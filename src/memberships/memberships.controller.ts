import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/enums/roles.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('memberships')
@ApiBearerAuth()
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.receptionist)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all memberships' })
  @ApiResponse({ status: 200, description: 'List of all memberships.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Unauthorized role.' })
  async findAll() {
    return await this.membershipsService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.receptionist, ValidRoles.coach)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a membership by its ID' })
  @ApiResponse({ status: 200, description: 'Membership found.' })
  @ApiResponse({ status: 404, description: 'Membership not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Unauthorized role.' })
  async findOne(@Param('id') id: string) {
    return await this.membershipsService.findMembershipById(id);
  }

  @Post()
  @Auth(ValidRoles.admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new membership' })
  @ApiResponse({
    status: 201,
    description: 'The membership has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Unauthorized role.' })
  async create(@Body() createMembershipDto: CreateMembershipDto) {
    return await this.membershipsService.createNewMembership(
      createMembershipDto,
    );
  }

  @Put(':id')
  @Auth(ValidRoles.admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing membership by its ID' })
  @ApiResponse({
    status: 200,
    description: 'The membership has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Membership not found.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Unauthorized role.' })
  async update(
    @Param('id') id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return await this.membershipsService.updateExistingMembership(
      id,
      updateMembershipDto,
    );
  }

  @Patch(':id/toggle-status')
  @Auth(ValidRoles.admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate or deactivate a membership status' })
  @ApiResponse({
    status: 200,
    description: 'The membership status has been changed.',
  })
  @ApiResponse({ status: 404, description: 'Membership not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Unauthorized role.' })
  async toggleStatus(@Param('id') id: string) {
    return await this.membershipsService.toggleMembershipStatus(id);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a membership by its ID' })
  @ApiResponse({
    status: 204,
    description: 'The membership has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Membership not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Unauthorized role.' })
  async remove(@Param('id') id: string) {
    await this.membershipsService.removeMembership(id);
  }
}
