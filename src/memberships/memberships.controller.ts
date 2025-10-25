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

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.receptionist)
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return await this.membershipsService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.receptionist, ValidRoles.coach)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return await this.membershipsService.findMembershipById(id);
  }


  @Post()
  @Auth(ValidRoles.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMembershipDto: CreateMembershipDto) {
    return await this.membershipsService.createNewMembership(
      createMembershipDto,
    );
  }


  @Put(':id')
  @Auth(ValidRoles.admin)
  @HttpCode(HttpStatus.OK)
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
  async toggleStatus(@Param('id') id: string) {
    return await this.membershipsService.toggleMembershipStatus(id);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.membershipsService.removeMembership(id);
  }
}
