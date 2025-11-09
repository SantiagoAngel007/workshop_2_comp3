import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MembershipsService } from '../memberships/memberships.service';
import { Role } from '../auth/entities/roles.entity';
import { initialData } from './data/seed-auth.data';
import { membershipsSeedData } from './data/seed-memberships.data';
import { InjectRepository } from '@nestjs/typeorm';
import { Membership } from '../memberships/entities/membership.entity';
import { Repository, DataSource } from 'typeorm';

@Injectable()
export class SeedService {
  constructor(
    private readonly authService: AuthService,
    private readonly membershipsService: MembershipsService,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
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
}