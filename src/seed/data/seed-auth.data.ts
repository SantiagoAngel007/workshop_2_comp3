import { ValidRoles } from 'src/auth/enums/roles.enum';

export interface SeedData {
  roles: ValidRoles[];
  users: {
    email: string;
    fullName: string;
    age: number;
    password: string;
    roles: ValidRoles[];
  }[];
}

export const initialData: SeedData = {
  roles: [
    ValidRoles.admin,
    ValidRoles.coach,
    ValidRoles.client,
    ValidRoles.receptionist,
  ],
  users: [
    {
      email: 'admin@example.com',
      fullName: 'Admin User',
      age: 30,
      password: 'admin123',
      roles: [ValidRoles.admin],
    },
    {
      email: 'coach@example.com',
      fullName: 'Coach User',
      age: 28,
      password: 'coach123',
      roles: [ValidRoles.coach],
    },
    {
      email: 'client@example.com',
      fullName: 'Client User',
      age: 25,
      password: 'client123',
      roles: [ValidRoles.client],
    },
    {
      email: 'receptionist@example.com',
      fullName: 'Receptionist User',
      age: 27,
      password: 'recep123',
      roles: [ValidRoles.receptionist],
    },
  ],
};
