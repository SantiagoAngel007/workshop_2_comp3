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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * GET /subscriptions/user/:userId
   * Obtiene la subscripción de un usuario por su ID
   */
  @Get('user/:userId')
  @Auth(ValidRoles.admin, ValidRoles.receptionist)
  @ApiOperation({ summary: "Get a user's subscription by their User ID" })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiResponse({ status: 200, description: 'Subscription found.' })
  @ApiResponse({
    status: 404,
    description: 'Subscription for the given user not found.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
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
  @ApiOperation({ summary: 'Create a new subscription for a user' })
  @ApiBody({
    description: 'The ID of the user to create a subscription for.',
    schema: {
      type: 'object',
      properties: { userId: { type: 'string', example: 'user-id-123' } },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict. User already has a subscription.',
  })
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
  @ApiOperation({ summary: 'Add a membership to an existing subscription' })
  @ApiParam({ name: 'id', description: 'The ID of the subscription' })
  @ApiResponse({ status: 200, description: 'Membership added successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Subscription or Membership not found.',
  })
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
  @ApiOperation({ summary: 'Get all subscriptions (Admin only)' })
  @ApiResponse({ status: 200, description: 'A list of all subscriptions.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  findAll() {
    return this.subscriptionsService.findAll();
  }

  /**
   * GET /subscriptions/:id
   * Obtiene una subscripción por ID
   */
  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.receptionist, ValidRoles.client)
  @ApiOperation({ summary: 'Get a subscription by its ID' })
  @ApiParam({ name: 'id', description: 'The unique ID of the subscription' })
  @ApiResponse({ status: 200, description: 'Subscription details.' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  /**
   * PATCH /subscriptions/:id
   * Actualiza una subscripción
   */
  @Patch(':id')
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: 'Update a subscription (Admin only)' })
  @ApiParam({ name: 'id', description: 'The ID of the subscription to update' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
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
  @ApiOperation({ summary: 'Deactivate a subscription (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the subscription to deactivate',
  })
  @ApiResponse({ status: 200, description: 'Subscription deactivated.' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  deactivate(@Param('id') id: string) {
    return this.subscriptionsService.deactivateSubscription(id);
  }

  /**
   * PATCH /subscriptions/:id/activate
   * Activa una subscripción
   */
  @Patch(':id/activate')
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: 'Activate a subscription (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the subscription to activate',
  })
  @ApiResponse({ status: 200, description: 'Subscription activated.' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  activate(@Param('id') id: string) {
    return this.subscriptionsService.activateSubscription(id);
  }

  /**
   * DELETE /subscriptions/:id
   * Elimina una subscripción
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: 'Delete a subscription (Admin only)' })
  @ApiParam({ name: 'id', description: 'The ID of the subscription to delete' })
  @ApiResponse({
    status: 204,
    description: 'Subscription successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
