import { ValidRoles } from '../enums/roles.enum';

export interface SeedData {
  roles: string[];
  users: {
    email: string;
    fullName: string;
    age: number;
    password: string;
    roles: ValidRoles[];
  }[];
}

export const initialData: SeedData = {
  roles: ['admin', 'coach', 'client', 'receptionist'],
  users: [
    {
      email: 'admin@example.com',
      fullName: 'Admin User',
      age: 30,
      password: 'admin123',
      roles: ['admin'],
    },
    {
      email: 'coach@example.com',
      fullName: 'Coach User',
      age: 28,
      password: 'coach123',
      roles: ['coach'],
    },
    {
      email: 'client@example.com',
      fullName: 'Client User',
      age: 25,
      password: 'client123',
      roles: ['client'],
    },
    {
      email: 'receptionist@example.com',
      fullName: 'Receptionist User',
      age: 27,
      password: 'recep123',
      roles: ['receptionist'],
    },
  ],
};