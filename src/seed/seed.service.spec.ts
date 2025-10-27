import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';

describe('SeedService', () => {
  let service: SeedService;

  const mockAuthService = {
    create: jest.fn(),
  };

  const mockMembershipsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: 'AuthService',
          useValue: mockAuthService,
        },
        {
          provide: 'MembershipsService', 
          useValue: mockMembershipsService,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
