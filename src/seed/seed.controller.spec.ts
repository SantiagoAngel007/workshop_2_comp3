import { Test, TestingModule } from '@nestjs/testing';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

describe('SeedController', () => {
  let controller: SeedController;
  let seedService: SeedService;

  const mockSeedService = {
    runSeed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeedController],
      providers: [
        {
          provide: SeedService,
          useValue: mockSeedService,
        },
      ],
    }).compile();

    controller = module.get<SeedController>(SeedController);
    seedService = module.get<SeedService>(SeedService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should execute seed', async () => {
    const expectedResult = { message: 'Seed executed successfully' };
    mockSeedService.runSeed.mockResolvedValue(expectedResult);

    const result = await controller.executeSeed();
    expect(result).toEqual(expectedResult);
    expect(seedService.runSeed).toHaveBeenCalled();
  });
});
