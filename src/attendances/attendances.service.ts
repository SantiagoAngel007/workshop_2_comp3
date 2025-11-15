import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Attendance, AttendanceType } from './entities/attendance.entity';
import { User } from '../auth/entities/users.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Class } from '../classes/entities/class.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { RegisterClassAttendanceDto } from './dto/register-class-attendance.dto';
import {
  AttendanceStatus,
  AvailableAttendances,
  AttendanceStatsResponse,
} from './dto/attendance-response.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { SubscriptionItemStatus } from '../subscriptions/entities/subscription-item.entity';

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    // Inyectamos Subscription para calcular los pases disponibles
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  /**
   * Registra el check-in de un usuario.
   */
  async checkIn(
    createAttendanceDto: CreateAttendanceDto,
    receptionistId?: string,
  ): Promise<Attendance> {
    const { userId, type } = createAttendanceDto;

    // VALIDACIÓN 1: El recepcionista no puede registrarse a sí mismo
    if (receptionistId && userId === receptionistId) {
      throw new ForbiddenException(
        'No puedes registrar asistencia para ti mismo',
      );
    }

    const user = await this.validateUserExists(userId);

    // VALIDACIÓN 2: Solo clientes pueden registrar asistencia
    const userRole = user.roles?.[0]?.name;
    if (userRole !== 'client') {
      throw new ForbiddenException(
        `Solo los clientes pueden registrar asistencias. El usuario tiene rol de ${userRole}`,
      );
    }

    const isInside = await this.isUserCurrentlyInside(userId);
    if (isInside) {
      throw new ConflictException(
        `El usuario ya se encuentra dentro de las instalaciones.`,
      );
    }

    const canEnter = await this.validateUserCanEnter(userId, type);
    if (!canEnter) {
      throw new ForbiddenException(
        `El usuario no tiene pases disponibles para ${type}.`,
      );
    }

    const currentDate = new Date();
    const dateKey = this.generateDateKey(currentDate);

    const newAttendance = this.attendanceRepository.create({
      user: user, // Asociamos la entidad User completa
      entranceDatetime: currentDate,
      type,
      dateKey,
    });

    return this.attendanceRepository.save(newAttendance);
  }

  /**
   * Registra el check-out de un usuario.
   */
  async checkOut(userId: string): Promise<Attendance> {
    await this.validateUserExists(userId);

    const activeAttendance = await this.findActiveAttendanceByUserId(userId);
    if (!activeAttendance) {
      throw new NotFoundException(`El usuario no tiene un check-in activo.`);
    }

    activeAttendance.exitDatetime = new Date();
    activeAttendance.isActive = false;

    return this.attendanceRepository.save(activeAttendance);
  }

  /**
   * Obtiene el estado actual de asistencia de un usuario (si está dentro y cuántos pases le quedan).
   */
  async getUserAttendanceStatus(userId: string): Promise<AttendanceStatus> {
    const currentAttendance = await this.findActiveAttendanceByUserId(userId);
    const availableAttendances =
      await this.calculateAvailableAttendances(userId);

    return {
      isInside: !!currentAttendance,
      currentAttendance: currentAttendance
        ? {
            id: currentAttendance.id,
            entranceDatetime: currentAttendance.entranceDatetime,
            type: currentAttendance.type,
          }
        : undefined,
      availableAttendances,
    };
  }

  /**
   * Obtiene el historial de asistencias de un usuario con filtros opcionales.
   */
  async getUserAttendanceHistory(
    userId: string,
    queryParams: GetHistoryDto,
  ): Promise<Attendance[]> {
    const { from, to, type } = queryParams;
    await this.validateUserExists(userId);

    const whereClause: Record<string, unknown> = { user: { id: userId } };

    if (type) {
      whereClause.type = type;
    }

    if (from && to) {
      whereClause.entranceDatetime = Between(
        new Date(from),
        new Date(to + 'T23:59:59.999Z'),
      );
    } else if (from) {
      whereClause.entranceDatetime = MoreThanOrEqual(new Date(from));
    }

    return this.attendanceRepository.find({
      where: whereClause,
      order: { entranceDatetime: 'DESC' },
    });
  }

  /**
   * Obtiene todas las asistencias del sistema (para admin).
   */
  async findAll(): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      relations: ['user'], // Cargamos la relación con el usuario
      order: { entranceDatetime: 'DESC' },
    });
  }

  /**
   * Obtiene todas las asistencias activas actualmente (usuarios que están dentro).
   */
  async getActiveAttendances(): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { isActive: true },
      relations: ['user'], // Cargamos la relación con el usuario
      order: { entranceDatetime: 'DESC' },
    });
  }

  /**
   * Obtiene estadísticas de asistencia para un usuario.
   */
  async getUserAttendanceStats(
    userId: string,
  ): Promise<AttendanceStatsResponse> {
    await this.validateUserExists(userId);

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const yearlyAttendances = await this.attendanceRepository.find({
      where: {
        user: { id: userId },
        entranceDatetime: MoreThanOrEqual(startOfYear),
      },
    });

    const totalGymAttendances = yearlyAttendances.filter(
      (a) => a.type === AttendanceType.GYM,
    ).length;
    const totalClassAttendances = yearlyAttendances.filter(
      (a) => a.type === AttendanceType.CLASS,
    ).length;
    const monthlyStats = this.calculateMonthlyStats(yearlyAttendances);

    return { totalGymAttendances, totalClassAttendances, monthlyStats };
  }

  // --- MÉTODOS PRIVADOS DE AYUDA ---

  private async validateUserCanEnter(
    userId: string,
    type: AttendanceType,
  ): Promise<boolean> {
    const available = await this.hasAvailableAttendances(userId, type);
    return available > 0;
  }

  private async hasAvailableAttendances(
    userId: string,
    type: AttendanceType,
  ): Promise<number> {
    try {
      const available = await this.calculateAvailableAttendances(userId);
      return type === AttendanceType.GYM ? available.gym : available.classes;
    } catch (error) {
      // Si hay un error (ej. no tiene suscripción), no tiene pases.
      console.error('Error calculating available attendances:', error);
      return 0;
    }
  }

  private async isUserCurrentlyInside(userId: string): Promise<boolean> {
    const count = await this.attendanceRepository.count({
      where: { user: { id: userId }, isActive: true },
    });
    console.log(`isUserCurrentlyInside: count for user ${userId} is ${count}`); // Added console.log
    return count > 0;
  }

  private async findActiveAttendanceByUserId(
    userId: string,
  ): Promise<Attendance | null> {
    return this.attendanceRepository.findOne({
      where: { user: { id: userId }, isActive: true },
    });
  }

  private async validateUserExists(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'], // Cargamos los roles para las validaciones
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID '${userId}' no encontrado.`);
    }
    return user;
  }

  private generateDateKey(date: Date): string {
    return date.toISOString().substring(0, 10); // YYYY-MM-DD
  }

  private async calculateAvailableAttendances(
    userId: string,
  ): Promise<AvailableAttendances> {
    // 1. Encontrar la suscripción activa del usuario y cargar sus items
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: ['items'], // <-- Cambiado de 'memberships' a 'items'
    });

    if (!activeSubscription || !activeSubscription.items?.length) {
      return { gym: 0, classes: 0 }; // No tiene suscripción activa o items
    }

    // 2. Sumar los máximos pases de todos sus items ACTIVOS
    let totalGym = 0;
    let totalClasses = 0;
    activeSubscription.items.forEach((item) => { // <-- Cambiado de 'memberships' a 'items'
      // Solo sumar si el item está activo
      if(item.status === SubscriptionItemStatus.ACTIVE) { // <-- Añadido chequeo de estado
        totalGym += item.max_gym_assistance || 0;
        totalClasses += item.max_classes_assistance || 0;
      }
    });

    // 3. Contar los pases usados en el mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usedGym = await this.attendanceRepository.count({
      where: {
        user: { id: userId },
        type: AttendanceType.GYM,
        entranceDatetime: Between(startOfMonth, endOfMonth),
      },
    });

    const usedClasses = await this.attendanceRepository.count({
      where: {
        user: { id: userId },
        type: AttendanceType.CLASS,
        entranceDatetime: Between(startOfMonth, endOfMonth),
      },
    });

    // 4. Calcular los restantes
    return {
      gym: Math.max(0, totalGym - usedGym),
      classes: Math.max(0, totalClasses - usedClasses),
    };
  }

  private calculateMonthlyStats(attendances: Attendance[]) {
    const monthlyMap = new Map<
      string,
      { month: string; gymCount: number; classCount: number }
    >();

    // First group by month and type
    attendances.forEach((attendance) => {
      // Ensure we create a new Date object for each attendance to handle timezone correctly
      const date = new Date(attendance.entranceDatetime);
      // Format month key with UTC values to avoid timezone issues
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          gymCount: 0,
          classCount: 0,
        });
      }

      const monthData = monthlyMap.get(monthKey)!;

      if (attendance.type === AttendanceType.GYM) {
        monthData.gymCount++;
      } else if (attendance.type === AttendanceType.CLASS) {
        monthData.classCount++;
      }
    });

    // Then convert to array and sort by month
    const monthlyStats = Array.from(monthlyMap.values());
    monthlyStats.sort((a, b) => a.month.localeCompare(b.month));

    return monthlyStats;
  }

  /**
   * Registra la asistencia de un usuario a una clase específica.
   * A diferencia del check-in de gimnasio, no valida si el usuario ya está dentro
   * ya que puede tomar múltiples clases en el mismo día.
   */
  async registerClassAttendance(
    registerClassDto: RegisterClassAttendanceDto,
    coach: User,
  ): Promise<Attendance> {
    const { userId, classId, notes } = registerClassDto;

    // VALIDACIÓN 1: El coach no puede registrarse a sí mismo
    if (userId === coach.id) {
      throw new ForbiddenException(
        'No puedes registrar asistencia para ti mismo',
      );
    }

    const user = await this.validateUserExists(userId);

    // VALIDACIÓN 2: Solo clientes pueden ser registrados en clases
    const userRole = user.roles?.[0]?.name;
    if (userRole !== 'client') {
      throw new ForbiddenException(
        `Solo los clientes pueden ser registrados en clases. El usuario tiene rol de ${userRole}`,
      );
    }

    // Validar que la clase existe
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Clase con ID '${classId}' no encontrada`);
    }

    // Validar que la clase esté activa
    if (!classEntity.isActive) {
      throw new ForbiddenException(
        `La clase '${classEntity.name}' no está activa actualmente.`,
      );
    }

    // Validar que el usuario tenga pases de clase disponibles
    const canEnter = await this.validateUserCanEnter(userId, AttendanceType.CLASS);
    if (!canEnter) {
      throw new ForbiddenException(
        `El usuario no tiene pases de clase disponibles.`,
      );
    }

    const currentDate = new Date();
    const dateKey = this.generateDateKey(currentDate);

    const classAttendance = this.attendanceRepository.create({
      user: user,
      entranceDatetime: currentDate,
      type: AttendanceType.CLASS,
      dateKey,
      class: classEntity,
      coach,
      notes,
      isActive: false, // Las clases no tienen check-out, marcar como no activo
    });

    return this.attendanceRepository.save(classAttendance);
  }

  /**
   * Obtiene todas las clases registradas por un coach específico.
   */
  async getCoachClasses(coachId: string): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: {
        coach: { id: coachId },
        type: AttendanceType.CLASS,
      },
      relations: ['user', 'coach'],
      order: { entranceDatetime: 'DESC' },
    });
  }

  /**
   * Obtiene todas las clases registradas en el día actual.
   */
  async getTodayClasses(): Promise<Attendance[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    return this.attendanceRepository.find({
      where: {
        type: AttendanceType.CLASS,
        entranceDatetime: Between(startOfDay, endOfDay),
      },
      relations: ['user', 'coach'],
      order: { entranceDatetime: 'DESC' },
    });
  }

  /**
   * Obtiene los asistentes registrados para una clase específica.
   */
  async getClassAttendees(classId: string): Promise<Attendance[]> {
    // Buscar todas las asistencias de tipo CLASS para la clase dada
    return this.attendanceRepository.find({
      where: {
        class: { id: classId },
        type: AttendanceType.CLASS,
      },
      relations: ['user', 'class', 'coach'],
      order: { entranceDatetime: 'DESC' },
    });
  }
}