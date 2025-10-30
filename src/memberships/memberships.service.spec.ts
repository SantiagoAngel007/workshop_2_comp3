import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsService } from './memberships.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import {
  createMockRepository,
  mockMembership,
} from '../../test/utils/test-utils';
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

      await expect(service.findMembershipById(membershipId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createMembership', () => {
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

      const result = await service.createNewMembership(createMembershipDto);

      expect(result).toEqual(mockMembership);
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

      await expect(
        service.createNewMembership(createMembershipDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateExistingMembership', () => {
    it('should update membership successfully', async () => {
      const membershipId = 'membership-123';
      const updateMembershipDto = { name: 'Updated Membership' };
      const updatedMembership = {
        ...mockMembership,
        name: 'Updated Membership',
      };

      membershipRepository.findOne.mockImplementation(async (options) => {
        if (options.where.id === membershipId) {
          return Promise.resolve(mockMembership);
        }
        if (options.where.name === updateMembershipDto.name) {
          return Promise.resolve(null); // No other membership with the new name
        }
        return Promise.resolve(null);
      });
      membershipRepository.save.mockResolvedValue(updatedMembership);

      const result = await service.updateExistingMembership(
        membershipId,
        updateMembershipDto,
      );

      expect(result).toEqual(updatedMembership);
    });

    it('should throw NotFoundException if membership not found', async () => {
      const membershipId = 'invalid-id';
      const updateMembershipDto = { name: 'Updated' };

      membershipRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateExistingMembership(membershipId, updateMembershipDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMembership', () => {
    it('should remove membership successfully', async () => {
      const membershipId = 'membership-123';

      membershipRepository.findOne.mockResolvedValue(mockMembership);
      membershipRepository.softRemove.mockResolvedValue(mockMembership);

      await service.removeMembership(membershipId);

      expect(membershipRepository.softRemove).toHaveBeenCalledWith(
        mockMembership,
      );
    });

    it('should throw NotFoundException if membership not found', async () => {
      const membershipId = 'invalid-id';

      membershipRepository.findOne.mockResolvedValue(null);

      await expect(service.removeMembership(membershipId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all memberships', async () => {
      membershipRepository.find.mockResolvedValue([mockMembership]);

      const result = await service.findAll();

      expect(result).toEqual([mockMembership]);
    });
  });

  describe('findMembershipById', () => {
    it('should return membership by id', async () => {
      membershipRepository.findOne.mockResolvedValue(mockMembership);

      const result = await service.findMembershipById('membership-123');

      expect(result).toEqual(mockMembership);
    });

    it('should throw NotFoundException if membership not found', async () => {
      membershipRepository.findOne.mockResolvedValue(null);

      await expect(service.findMembershipById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleMembershipStatus', () => {
    it('should toggle membership status', async () => {
      const membership = { ...mockMembership, status: true };
      const toggledMembership = { ...mockMembership, status: false };

      membershipRepository.findOne.mockResolvedValue(membership);
      membershipRepository.save.mockResolvedValue(toggledMembership);

      const result = await service.toggleMembershipStatus('membership-123');

      expect(result.status).toBe(false);
    });
  });
});
