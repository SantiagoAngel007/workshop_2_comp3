import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Jwt } from './interfaces/jwt.interface';
import { JwtService } from '@nestjs/jwt';
import { Role } from './entities/roles.entity';
import { ValidRoles } from './enums/roles.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    public readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    public readonly roleRepository: Repository<Role>,
    public readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    const user = this.userRepository.create({
      ...userData,
      password: this.encryptPassword(password),
    });

    const defaultRole = await this.roleRepository.findOneBy({ name: ValidRoles.client });
    if (!defaultRole) {
      throw new InternalServerErrorException('Rol por defecto "client" no encontrado');
    }
    user.roles = [defaultRole];

    try {
      await this.userRepository.save(user);
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
      select: { id: true, email: true, password: true, fullName: true, age: true, isActive: true },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User ${email} not found`);
    }

    if (!bcrypt.compareSync(password, user.password!)) {
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
      return users.map(user => {
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = this.encryptPassword(updateUserDto.password);
    }

    try {
      await this.userRepository.update(id, updateUserDto);
      const updatedUser = await this.userRepository.findOne({
        where: { id },
        relations: ['roles'],
      });

      if (!updatedUser) {
        throw new InternalServerErrorException('User updated but not found after update');
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

    const isAdmin = user.roles.some(role => role.name === 'admin');
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

  encryptPassword(password: string): string {
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
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}