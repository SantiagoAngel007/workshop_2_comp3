import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AddMembershipDto } from './dto/add-membership.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/enums/roles.enum';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * GET /subscriptions/user/:userId
   * Obtiene la subscripción de un usuario por su ID
   */
  @Get('user/:userId')
  @Auth(ValidRoles.admin, ValidRoles.receptionist)
  getSubscriptionByUserId(@Param('userId') userId: string) {
    return this.subscriptionsService.findSubscriptionByUserId(userId);
  }

  /**
   * POST /subscriptions
   * Crea una subscripción para un usuario
   * Body: { userId: string }
   */
  @Post()
  @Auth(ValidRoles.admin, ValidRoles.receptionist)
  @HttpCode(HttpStatus.CREATED)
  createSubscription(@Body('userId') userId: string) {
    return this.subscriptionsService.createSubscriptionForUser(userId);
  }

  /**
   * POST /subscriptions/:id/memberships
   * Agrega una membresía a una subscripción existente
   * Body: { membershipId: string }
   */
  @Post(':id/memberships')
  @Auth(ValidRoles.admin, ValidRoles.receptionist)
  addMembership(
    @Param('id') subscriptionId: string,
    @Body() addMembershipDto: AddMembershipDto,
  ) {
    return this.subscriptionsService.addMembershipToSubscription(
      subscriptionId,
      addMembershipDto,
    );
  }

  /**
   * GET /subscriptions
   * Obtiene todas las subscripciones
   */
  @Get()
  @Auth(ValidRoles.admin)
  findAll() {
    return this.subscriptionsService.findAll();
  }

  /**
   * GET /subscriptions/:id
   * Obtiene una subscripción por ID
   */
  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.receptionist, ValidRoles.client)
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  /**
   * PATCH /subscriptions/:id
   * Actualiza una subscripción
   */
  @Patch(':id')
  @Auth(ValidRoles.admin)
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  /**
   * PATCH /subscriptions/:id/deactivate
   * Desactiva una subscripción
   */
  @Patch(':id/deactivate')
  @Auth(ValidRoles.admin)
  deactivate(@Param('id') id: string) {
    return this.subscriptionsService.deactivateSubscription(id);
  }

  /**
   * PATCH /subscriptions/:id/activate
   * Activa una subscripción
   */
  @Patch(':id/activate')
  @Auth(ValidRoles.admin)
  activate(@Param('id') id: string) {
    return this.subscriptionsService.activateSubscription(id);
  }

  /**
   * DELETE /subscriptions/:id
   * Elimina una subscripción
   */
  @Delete(':id')
  @Auth(ValidRoles.admin)
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
