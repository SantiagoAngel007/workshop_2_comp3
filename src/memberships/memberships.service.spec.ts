import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsService } from './memberships.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { createMockRepository, mockMembership } from '../../test/utils/test-utils';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let membershipRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        {
          provide: getRepositoryToken(Membership),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
    membershipRepository = module.get(getRepositoryToken(Membership));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all memberships', async () => {
      const memberships = [mockMembership];
      membershipRepository.find.mockResolvedValue(memberships);

      const result = await service.findAll();

      expect(result).toEqual(memberships);
      expect(membershipRepository.find).toHaveBeenCalledWith({
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findMembershipById', () => {
    it('should return membership by id', async () => {
      const membershipId = 'membership-123';
      membershipRepository.findOne.mockResolvedValue(mockMembership);

      const result = await service.findMembershipById(membershipId);

      expect(result).toEqual(mockMembership);
      expect(membershipRepository.findOne).toHaveBeenCalledWith({
        where: { id: membershipId },
      });
    });

    it('should throw NotFoundException if membership not found', async () => {
      const membershipId = 'invalid-id';
      membershipRepository.findOne.mockResolvedValue(null);

      await expect(service.findMembershipById(membershipId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new membership', async () => {
      const createMembershipDto = {
        name: 'Premium Membership',
        cost: 100,
        status: true,
        max_classes_assistance: 20,
        max_gym_assistance: 60,
        duration_months: 3,
      };

      membershipRepository.findOne.mockResolvedValue(null);
      membershipRepository.create.mockReturnValue(mockMembership);
      membershipRepository.save.mockResolvedValue(mockMembership);

      const result = await service.create(createMembershipDto);

      expect(result).toEqual(mockMembership);
      expect(membershipRepository.create).toHaveBeenCalledWith(createMembershipDto);
    });

    it('should throw ConflictException if membership name already exists', async () => {
      const createMembershipDto = {
        name: 'Existing Membership',
        cost: 100,
        status: true,
        max_classes_assistance: 20,
        max_gym_assistance: 60,
        duration_months: 3,
      };

      membershipRepository.findOne.mockResolvedValue(mockMembership);

      await expect(service.create(createMembershipDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update membership successfully', async () => {
      const membershipId = 'membership-123';
      const updateMembershipDto = { name: 'Updated Membership' };
      const updatedMembership = { ...mockMembership, name: 'Updated Membership' };

      membershipRepository.findOne.mockResolvedValue(mockMembership);
      membershipRepository.save.mockResolvedValue(updatedMembership);

      const result = await service.update(membershipId, updateMembershipDto);

      expect(result).toEqual(updatedMembership);
    });

    it('should throw NotFoundException if membership not found', async () => {
      const membershipId = 'invalid-id';
      const updateMembershipDto = { name: 'Updated' };

      membershipRepository.findOne.mockResolvedValue(null);

      await expect(service.update(membershipId, updateMembershipDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove membership successfully', async () => {
      const membershipId = 'membership-123';

      membershipRepository.findOne.mockResolvedValue(mockMembership);
      membershipRepository.remove.mockResolvedValue(mockMembership);

      const result = await service.remove(membershipId);

      expect(result).toEqual(mockMembership);
    });

    it('should throw NotFoundException if membership not found', async () => {
      const membershipId = 'invalid-id';

      membershipRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(membershipId)).rejects.toThrow(NotFoundException);
    });
  });
});
