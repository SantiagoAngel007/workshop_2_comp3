import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Role } from '../auth/entities/roles.entity';
import { User } from '../auth/entities/users.entity';
import { initialData } from './data/seed-auth.data';

@Injectable()
export class SeedService {
  constructor(private readonly authService: AuthService) {}

  async runSeed() {
    await this.deleteAllUsersAndRoles();
    await this.insertRoles();
    await this.insertUsers();
    return 'SEED EXECUTED SUCCESSFULLY';
  }

  private async deleteAllUsersAndRoles() {
    // En TypeORM, si tienes relaciones, es mejor eliminar usuarios primero
    await this.authService.userRepository.clear();
    await this.authService.roleRepository.clear();
  }

  private async insertRoles() {
    for (const roleName of initialData.roles) {
      const role = this.authService.roleRepository.create({ name: roleName });
      await this.authService.roleRepository.save(role);
    }
  }

  private async insertUsers() {
    for (const userData of initialData.users) {
      const { roles, ...rest } = userData;

      // Crea el usuario
      const user = this.authService.userRepository.create({
        ...rest,
        password: this.authService.encryptPassword(rest.password),
      });

      // Asigna los roles
      const assignedRoles = await Promise.all(
        roles.map((roleName) =>
          this.authService.roleRepository.findOneBy({ name: roleName }),
        ),
      );
      user.roles = assignedRoles.filter(Boolean) as Role[];

      await this.authService.userRepository.save(user);
    }
  }
}