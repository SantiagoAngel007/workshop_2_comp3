import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Repository } from 'typeorm';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');
import { LoginDto } from './dto/login.dto';
import { Jwt } from './interfaces/jwt.interface';
import { JwtService } from '@nestjs/jwt';
import { Role } from './entities/roles.entity';
import { ValidRoles } from './enums/roles.enum';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    public readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    public readonly roleRepository: Repository<Role>,
    public readonly jwtService: JwtService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    const user = this.userRepository.create({
      ...userData,
      password: this.encryptPassword(password),
    });

    const defaultRole = await this.roleRepository.findOneBy({
      name: ValidRoles.client,
    });
    if (!defaultRole) {
      throw new InternalServerErrorException(
        'Rol por defecto "client" no encontrado',
      );
    }
    user.roles = [defaultRole];

    try {
      await this.userRepository.save(user);

      // Crear subscripción vacía automáticamente
      try {
        await this.subscriptionsService.createSubscriptionForUser(user.id);
      } catch (subscriptionError) {
        // Logueamos el error para verlo en la consola con todos sus detalles
        this.logger.error(
          `FATAL: Failed to create subscription for user ${user.id}. Registration aborted.`,

          subscriptionError.stack, // El .stack da mucha más información
        );
        // Volvemos a lanzar el error para que la petición falle y veamos el problema
        throw subscriptionError;
      }

      delete user.password;
      return {
        ...user,
        token: this.getJwtToken({ id: user.id, email: user.email }),
      };
    } catch (error) {
      this.handleException(error);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        age: true,
        isActive: true,
      },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User ${email} not found`);
    }

    if (!bcrypt.compareSync(password, user.password || '')) {
      throw new UnauthorizedException('Email or password incorrect');
    }

    delete user.password;
    return {
      ...user,
      token: this.getJwtToken({ id: user.id, email: user.email }),
    };
  }

  async findAll() {
    try {
      const users = await this.userRepository.find({
        relations: ['roles'],
      });
      return users.map((user) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = user;
        return safeUser;
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error retrieving users');
    }
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    delete user.password;
    return user;
  }

  async update(
    idToUpdate: string,
    updateUserDto: UpdateUserDto,
    authUser: User,
  ) {
    const userToUpdate = await this.userRepository.findOne({
      where: { id: idToUpdate },
      relations: ['roles'],
    });

    if (!userToUpdate) {
      throw new NotFoundException(`User with ID ${idToUpdate} not found`);
    }

    const isAdmin = authUser.roles.some(
      (role) => role.name === String(ValidRoles.admin),
    );

    if (!isAdmin && authUser.id !== idToUpdate) {
      throw new ForbiddenException(
        `You can only update your own profile. You cannot update other users.`,
      );
    }

    if (updateUserDto.email && updateUserDto.email !== userToUpdate.email) {
      const existingUser = await this.userRepository.findOneBy({
        email: updateUserDto.email,
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = this.encryptPassword(updateUserDto.password);
    }

    try {
      await this.userRepository.update(idToUpdate, updateUserDto);
      const updatedUser = await this.userRepository.findOne({
        where: { id: idToUpdate },
        relations: ['roles'],
      });

      if (!updatedUser) {
        throw new InternalServerErrorException(
          'User updated but not found after update',
        );
      }

      delete updatedUser.password;
      return updatedUser;
    } catch (error) {
      this.handleException(error);
    }
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isAdmin = user.roles.some((role) => role.name === 'admin');
    if (isAdmin) {
      const adminCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.name = :role', { role: 'admin' })
        .getCount();

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }

    try {
      await this.userRepository.delete(id);
      return { message: `User with ID ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error deleting user');
    }
  }

  /**
   * Método especial para crear usuarios con roles personalizados (usado por el seed)
   * Crea el usuario, asigna los roles especificados, y crea una suscripción automáticamente
   */
  async createUserWithRoles(
    userData: {
      email: string;
      fullName: string;
      age: number;
      password: string;
    },
    roles: Role[],
  ) {
    const { password, ...rest } = userData;

    const user = this.userRepository.create({
      ...rest,
      password: this.encryptPassword(password),
    });

    user.roles = roles;

    try {
      await this.userRepository.save(user);

      // Crear subscripción vacía automáticamente
      try {
        await this.subscriptionsService.createSubscriptionForUser(user.id);
      } catch (subscriptionError) {
        this.logger.error(
          `Failed to create subscription for user ${user.id} during seed`,
          subscriptionError.stack,
        );
        throw subscriptionError;
      }

      return user;
    } catch (error) {
      this.handleException(error);
    }
  }

  /**
   * Assigns roles to a user, replacing their current roles
   * If the user ends up with no roles after deletion, the 'client' role is assigned automatically
   */
  async assignRoles(userId: string, roleNames: ValidRoles[]) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent assigning roles if the user is the last admin
    if (
      roleNames.every((role) => role !== ValidRoles.admin) &&
      user.roles.some((role) => role.name === ValidRoles.admin)
    ) {
      const adminCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.name = :role', { role: ValidRoles.admin })
        .getCount();

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove admin role from the last admin user',
        );
      }
    }

    // Fetch the requested roles from database
    const roles = await Promise.all(
      roleNames.map((roleName) =>
        this.roleRepository.findOneBy({ name: roleName }),
      ),
    );

    // Check if all requested roles exist
    const notFoundRoles = roleNames.filter(
      (roleName, index) => !roles[index],
    );
    if (notFoundRoles.length > 0) {
      throw new NotFoundException(
        `The following roles were not found: ${notFoundRoles.join(', ')}`,
      );
    }

    user.roles = roles.filter((role) => role !== null);

    try {
      await this.userRepository.save(user);
      return this.findOne(userId);
    } catch (error) {
      this.handleException(error);
    }
  }

  /**
   * Adds one or more roles to a user without removing existing ones
   */
  async addRolesToUser(userId: string, roleNames: ValidRoles[]) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Fetch the roles to add
    const rolesToAdd = await Promise.all(
      roleNames.map((roleName) =>
        this.roleRepository.findOneBy({ name: roleName }),
      ),
    );

    // Check if all requested roles exist
    const notFoundRoles = roleNames.filter(
      (roleName, index) => !rolesToAdd[index],
    );
    if (notFoundRoles.length > 0) {
      throw new NotFoundException(
        `The following roles were not found: ${notFoundRoles.join(', ')}`,
      );
    }

    // Add roles that the user doesn't already have
    const existingRoleNames = user.roles.map((role) => role.name);
    const newRoles = rolesToAdd.filter(
      (role) => role !== null && !existingRoleNames.includes(role.name),
    ) as Role[];

    user.roles = [...user.roles, ...newRoles];

    try {
      await this.userRepository.save(user);
      return this.findOne(userId);
    } catch (error) {
      this.handleException(error);
    }
  }

  /**
   * Removes one or more roles from a user
   * If the user ends up with no roles, the 'client' role is automatically assigned
   */
  async removeRolesFromUser(userId: string, roleNames: ValidRoles[]) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent removing admin role if this is the last admin
    if (roleNames.includes(ValidRoles.admin)) {
      const adminCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.name = :role', { role: ValidRoles.admin })
        .getCount();

      if (adminCount <= 1 && user.roles.some((r) => r.name === ValidRoles.admin)) {
        throw new BadRequestException(
          'Cannot remove admin role from the last admin user',
        );
      }
    }

    // Remove the specified roles
    user.roles = user.roles.filter(
      (role) => !roleNames.includes(role.name),
    );

    // If user has no roles left, assign the default 'client' role
    if (user.roles.length === 0) {
      const defaultRole = await this.roleRepository.findOneBy({
        name: ValidRoles.client,
      });

      if (!defaultRole) {
        throw new InternalServerErrorException(
          'Default role "client" not found',
        );
      }

      user.roles = [defaultRole];
    }

    try {
      await this.userRepository.save(user);
      return this.findOne(userId);
    } catch (error) {
      this.handleException(error);
    }
  }

  encryptPassword(password: string): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return bcrypt.hashSync(password, 10);
  }

  private getJwtToken(payload: Jwt): string {
    return this.jwtService.sign(payload);
  }

  private handleException(error: any): never {
    this.logger.error(error);

    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
