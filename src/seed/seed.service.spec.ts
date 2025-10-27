import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { AuthService } from '../auth/auth.service';
import { MembershipsService } from '../memberships/memberships.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Membership } from '../memberships/entities/membership.entity';

describe('SeedService', () => {
  let service: SeedService;

  const mockAuthService = {
    userRepository: { query: jest.fn() },
    roleRepository: { query: jest.fn(), create: jest.fn(), save: jest.fn(), findOneBy: jest.fn() },
    encryptPassword: jest.fn(),
  };

  const mockMembershipsService = {
    create: jest.fn(),
  };

  const mockMembershipRepository = {
    query: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: MembershipsService,
          useValue: mockMembershipsService,
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepository,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
