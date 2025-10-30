import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { mockMembership } from '../../test/utils/test-utils';

describe('MembershipsController', () => {
  let controller: MembershipsController;
  let membershipsService: MembershipsService;

  const mockMembershipsService = {
    createNewMembership: jest.fn(),
    findAll: jest.fn(),
    findMembershipById: jest.fn(),
    updateExistingMembership: jest.fn(),
    removeMembership: jest.fn(),
    toggleMembershipStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipsController],
      providers: [
        {
          provide: MembershipsService,
          useValue: mockMembershipsService,
        },
      ],
    }).compile();

    controller = module.get<MembershipsController>(MembershipsController);
    membershipsService = module.get<MembershipsService>(MembershipsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a membership', async () => {
      const createMembershipDto = {
        name: 'Basic Membership',
        cost: 50,
        status: true,
        max_classes_assistance: 10,
        max_gym_assistance: 30,
        duration_months: 1,
      };
      const expectedResult = mockMembership;

      mockMembershipsService.createNewMembership.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.create(createMembershipDto);

      expect(result).toEqual(expectedResult);
      expect(membershipsService.createNewMembership).toHaveBeenCalledWith(
        createMembershipDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return all memberships', async () => {
      const expectedResult = [mockMembership];

      mockMembershipsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(membershipsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return membership by id', async () => {
      const id = 'membership-123';
      const expectedResult = mockMembership;

      mockMembershipsService.findMembershipById.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(membershipsService.findMembershipById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update membership', async () => {
      const id = 'membership-123';
      const updateMembershipDto = { name: 'Updated Membership' };
      const expectedResult = { ...mockMembership, name: 'Updated Membership' };

      mockMembershipsService.updateExistingMembership.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.update(id, updateMembershipDto);

      expect(result).toEqual(expectedResult);
      expect(membershipsService.updateExistingMembership).toHaveBeenCalledWith(
        id,
        updateMembershipDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove membership', async () => {
      const id = 'membership-123';
      const expectedResult = mockMembership;

      mockMembershipsService.removeMembership.mockResolvedValue(expectedResult);

      await controller.remove(id);

      expect(membershipsService.removeMembership).toHaveBeenCalledWith(id);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle membership status', async () => {
      const id = 'membership-123';
      const expectedResult = { ...mockMembership, status: false };

      mockMembershipsService.toggleMembershipStatus.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.toggleStatus(id);

      expect(result).toEqual(expectedResult);
      expect(membershipsService.toggleMembershipStatus).toHaveBeenCalledWith(
        id,
      );
    });
  });
});
