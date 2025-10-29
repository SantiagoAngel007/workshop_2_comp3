import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MembershipsService } from '../memberships/memberships.service';
import { Role } from '../auth/entities/roles.entity';
import { initialData } from './data/seed-auth.data';
import { membershipsSeedData } from './data/seed-memberships.data';
import { InjectRepository } from '@nestjs/typeorm';
import { Membership } from '../memberships/entities/membership.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService {
  constructor(
    private readonly authService: AuthService,
    private readonly membershipsService: MembershipsService,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  async runSeed() {
    await this.deleteAllUsersAndRoles();
    await this.deleteAllMemberships();
    await this.insertRoles();
    await this.insertUsers();
    await this.insertMemberships();
    return 'SEED EXECUTED SUCCESSFULLY';
  }

private async deleteAllUsersAndRoles() {
  try {
    await this.authService.userRepository.query(`ALTER TABLE "user_roles" DISABLE TRIGGER ALL`);
    await this.authService.userRepository.query(`DELETE FROM "user_roles"`);
    await this.authService.userRepository.query(`DELETE FROM "user"`);
    await this.authService.roleRepository.query(`DELETE FROM "roles"`);
    await this.authService.userRepository.query(`ALTER TABLE "user_roles" ENABLE TRIGGER ALL`);
  } catch (error) {
    // Si la tabla no existe, solo limpia las existentes
    await this.authService.userRepository.delete({});
    await this.authService.roleRepository.delete({});
  }
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

      const user = this.authService.userRepository.create({
        ...rest,
        password: this.authService.encryptPassword(rest.password),
      });

      const assignedRoles = await Promise.all(
        roles.map((roleName) =>
          this.authService.roleRepository.findOneBy({ name: roleName }),
        ),
      );
      user.roles = assignedRoles.filter(Boolean) as Role[];

      await this.authService.userRepository.save(user);
    }
  }

  private async deleteAllMemberships() {
    await this.membershipRepository.query(`DELETE FROM "membership"`);
  }

  private async insertMemberships() {
    for (const membershipData of membershipsSeedData) {
      const membership = this.membershipRepository.create(membershipData);
      await this.membershipRepository.save(membership);
    }
  }
}