export interface SeedMembership {
  name: string;
  cost: number;
  status: boolean;
  max_classes_assistance: number;
  max_gym_assistance: number;
  duration_months: number;
}

export const membershipsSeedData: SeedMembership[] = [
  {
    name: 'Básica Mensual',
    cost: 50.0,
    status: true,
    max_classes_assistance: 8,
    max_gym_assistance: 15,
    duration_months: 1,
  },
  {
    name: 'Premium Mensual',
    cost: 80.0,
    status: true,
    max_classes_assistance: 20,
    max_gym_assistance: 30,
    duration_months: 1,
  },
  {
    name: 'Básica Anual',
    cost: 500.0,
    status: true,
    max_classes_assistance: 96,
    max_gym_assistance: 180,
    duration_months: 12,
  },
  {
    name: 'Premium Anual',
    cost: 800.0,
    status: true,
    max_classes_assistance: 240,
    max_gym_assistance: 365,
    duration_months: 12,
  },
  {
    name: 'VIP Anual',
    cost: 1200.0,
    status: true,
    max_classes_assistance: 365,
    max_gym_assistance: 365,
    duration_months: 12,
  },
];
