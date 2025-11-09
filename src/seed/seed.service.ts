import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MembershipsService } from '../memberships/memberships.service';
import { Role } from '../auth/entities/roles.entity';
import { initialData } from './data/seed-auth.data';
import { membershipsSeedData } from './data/seed-memberships.data';
import { InjectRepository } from '@nestjs/typeorm';
import { Membership } from '../memberships/entities/membership.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionItem, SubscriptionItemStatus } from '../subscriptions/entities/subscription-item.entity';
import { Repository, DataSource } from 'typeorm';

@Injectable()
export class SeedService {
  constructor(
    private readonly authService: AuthService,
    private readonly membershipsService: MembershipsService,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionItem)
    private readonly subscriptionItemRepository: Repository<SubscriptionItem>,
    private readonly dataSource: DataSource,
  ) {}

  async runSeed() {
    // Deshabilitar restricciones de FK
    await this.disableForeignKeyConstraints();

    try {
      // Limpiar en orden correcto (respetando dependencias)
      await this.deleteAllData();

      // Insertar nuevos datos
      await this.insertRoles();
      await this.insertUsers(); // Ahora crea usuarios + suscripciones automáticamente
      await this.insertMemberships();
      await this.insertSubscriptionItems(); // Crear ejemplos de compras de membresías

      return 'SEED EXECUTED SUCCESSFULLY';
    } catch (error) {
      console.error('Error during seed execution:', error);
      throw error;
    } finally {
      // Reabilitar restricciones de FK
      await this.enableForeignKeyConstraints();
    }
  }

  /**
   * Deshabilita las restricciones de claves foráneas
   */
  private async disableForeignKeyConstraints() {
    try {
      await this.dataSource.query('SET session_replication_role = replica');
    } catch (error) {
      console.warn('Could not disable FK constraints:', error.message);
    }
  }

  /**
   * Reabilita las restricciones de claves foráneas
   */
  private async enableForeignKeyConstraints() {
    try {
      await this.dataSource.query('SET session_replication_role = default');
    } catch (error) {
      console.warn('Could not enable FK constraints:', error.message);
    }
  }

  /**
   * Limpia todos los datos en orden de dependencias
   * 1. Attendances (depende de User)
   * 2. Subscriptions y relacionados (si aplica)
   * 3. User_roles
   * 4. Users
   * 5. Roles
   * 6. Memberships
   */
  private async deleteAllData() {
    try {
      // Eliminar en orden inverso a las dependencias
      const tablesToDelete = [
        'attendances',
        'subscription_items',
        'subscriptions',
        'user_roles',
        'user',
        'roles',
        'membership',
      ];

      for (const table of tablesToDelete) {
        try {
          await this.dataSource.query(`TRUNCATE TABLE "${table}" CASCADE`);
          console.log(`✓ Truncated table: ${table}`);
        } catch (error) {
          // Tabla no existe, continuar
          console.log(`⚠ Table ${table} does not exist or could not be truncated`);
        }
      }
    } catch (error) {
      console.error('Error deleting all data:', error.message);
      throw error;
    }
  }

  /**
   * Inserta los roles iniciales
   * Utiliza upsert para evitar duplicados
   */
  private async insertRoles() {
    try {
      for (const roleName of initialData.roles) {
        // Verificar si el rol ya existe
        let role = await this.authService.roleRepository.findOneBy({
          name: roleName,
        });

        if (!role) {
          role = this.authService.roleRepository.create({ name: roleName });
          await this.authService.roleRepository.save(role);
          console.log(`✓ Created role: ${roleName}`);
        } else {
          console.log(`⚠ Role already exists: ${roleName}`);
        }
      }
    } catch (error) {
      console.error('Error inserting roles:', error.message);
      throw error;
    }
  }

  /**
   * Inserta los usuarios iniciales con sus roles
   * Usa el método createUserWithRoles del AuthService que automáticamente crea la suscripción
   */
  private async insertUsers() {
    try {
      for (const userData of initialData.users) {
        const { roles, ...rest } = userData;

        // Verificar si el usuario ya existe
        const existingUser = await this.authService.userRepository.findOneBy({
          email: rest.email,
        });

        if (existingUser) {
          console.log(`⚠ User already exists: ${rest.email}`);
          continue;
        }

        // Obtener los roles desde la base de datos
        const assignedRoles = await Promise.all(
          roles.map((roleName) =>
            this.authService.roleRepository.findOneBy({ name: roleName }),
          ),
        );

        const validRoles = assignedRoles.filter(Boolean) as Role[];

        // Usar el método del AuthService que crea usuario + suscripción
        await this.authService.createUserWithRoles(rest, validRoles);
        console.log(`✓ Created user with subscription: ${rest.email}`);
      }
    } catch (error) {
      console.error('Error inserting users:', error.message);
      throw error;
    }
  }

  /**
   * Inserta las membresías iniciales
   */
  private async insertMemberships() {
    try {
      for (const membershipData of membershipsSeedData) {
        // Verificar si la membresía ya existe (por nombre o ID único)
        const existingMembership =
          await this.membershipRepository.findOneBy({
            name: membershipData.name,
          });

        if (existingMembership) {
          console.log(`⚠ Membership already exists: ${membershipData.name}`);
          continue;
        }

        const membership = this.membershipRepository.create(membershipData);
        await this.membershipRepository.save(membership);
        console.log(`✓ Created membership: ${membershipData.name}`);
      }
    } catch (error) {
      console.error('Error inserting memberships:', error.message);
      throw error;
    }
  }

  /**
   * Crea SubscriptionItems de ejemplo para el usuario cliente
   * Crea 4 membresías con diferentes estados: expired, active, pending, pending
   */
  private async insertSubscriptionItems() {
    try {
      // Buscar el usuario cliente
      const clientUser = await this.authService.userRepository.findOne({
        where: { email: 'client@example.com' },
      });

      if (!clientUser) {
        console.log('⚠ Client user not found, skipping subscription items');
        return;
      }

      // Buscar la suscripción del usuario
      const subscription = await this.subscriptionRepository.findOne({
        where: { user: { id: clientUser.id } },
      });

      if (!subscription) {
        console.log('⚠ Subscription not found for client, skipping subscription items');
        return;
      }

      // Buscar las membresías disponibles
      const memberships = await this.membershipRepository.find();

      if (memberships.length < 4) {
        console.log('⚠ Not enough memberships to create subscription items');
        return;
      }

      const today = new Date();

      // Helper para sumar/restar meses
      const addMonths = (date: Date, months: number): Date => {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
      };

      // 1. Membresía EXPIRADA (comprada hace 2 meses, duración 1 mes)
      const expiredMembership = memberships[0];
      const expiredItem = this.subscriptionItemRepository.create({
        subscription,
        membership: expiredMembership,
        name: expiredMembership.name,
        cost: expiredMembership.cost,
        max_classes_assistance: expiredMembership.max_classes_assistance,
        max_gym_assistance: expiredMembership.max_gym_assistance,
        duration_months: expiredMembership.duration_months,
        purchase_date: addMonths(today, -2),
        start_date: addMonths(today, -2),
        end_date: addMonths(today, -1),
        status: SubscriptionItemStatus.EXPIRED,
      });
      await this.subscriptionItemRepository.save(expiredItem);
      console.log(`✓ Created EXPIRED subscription item: ${expiredMembership.name}`);

      // 2. Membresía ACTIVA (comprada hace 1 mes, termina en 11 meses)
      const activeMembership = memberships[1];
      const activeItem = this.subscriptionItemRepository.create({
        subscription,
        membership: activeMembership,
        name: activeMembership.name,
        cost: activeMembership.cost,
        max_classes_assistance: activeMembership.max_classes_assistance,
        max_gym_assistance: activeMembership.max_gym_assistance,
        duration_months: activeMembership.duration_months,
        purchase_date: addMonths(today, -1),
        start_date: addMonths(today, -1),
        end_date: addMonths(today, 11),
        status: SubscriptionItemStatus.ACTIVE,
      });
      await this.subscriptionItemRepository.save(activeItem);
      console.log(`✓ Created ACTIVE subscription item: ${activeMembership.name}`);

      // 3. Membresía PENDIENTE #1 (comienza cuando expire la activa)
      const pending1Membership = memberships[2];
      const pending1Item = this.subscriptionItemRepository.create({
        subscription,
        membership: pending1Membership,
        name: pending1Membership.name,
        cost: pending1Membership.cost,
        max_classes_assistance: pending1Membership.max_classes_assistance,
        max_gym_assistance: pending1Membership.max_gym_assistance,
        duration_months: pending1Membership.duration_months,
        purchase_date: today,
        start_date: addMonths(today, 11),
        end_date: addMonths(today, 11 + pending1Membership.duration_months),
        status: SubscriptionItemStatus.PENDING,
      });
      await this.subscriptionItemRepository.save(pending1Item);
      console.log(`✓ Created PENDING subscription item: ${pending1Membership.name}`);

      // 4. Membresía PENDIENTE #2 (comienza después de la pendiente #1)
      const pending2Membership = memberships[3];
      const pending2Item = this.subscriptionItemRepository.create({
        subscription,
        membership: pending2Membership,
        name: pending2Membership.name,
        cost: pending2Membership.cost,
        max_classes_assistance: pending2Membership.max_classes_assistance,
        max_gym_assistance: pending2Membership.max_gym_assistance,
        duration_months: pending2Membership.duration_months,
        purchase_date: today,
        start_date: addMonths(today, 11 + pending1Membership.duration_months),
        end_date: addMonths(today, 11 + pending1Membership.duration_months + pending2Membership.duration_months),
        status: SubscriptionItemStatus.PENDING,
      });
      await this.subscriptionItemRepository.save(pending2Item);
      console.log(`✓ Created PENDING subscription item: ${pending2Membership.name}`);

      console.log('✓ All subscription items created successfully');
    } catch (error) {
      console.error('Error inserting subscription items:', error.message);
      throw error;
    }
  }
}