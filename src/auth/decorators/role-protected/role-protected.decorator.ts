import { SetMetadata } from '@nestjs/common';

export const RoleProtected = (...roles: string[]) => SetMetadata('roles', roles);