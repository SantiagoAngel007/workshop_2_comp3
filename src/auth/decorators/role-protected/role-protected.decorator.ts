import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from '../../enums/roles.enum';

export const META_DATA = 'roles';

export const RoleProtected = (...args: ValidRoles[]) => {
  return SetMetadata(META_DATA, args);
};
