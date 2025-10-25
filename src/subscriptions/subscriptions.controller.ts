import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/users.entity';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  
  
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createSubscriptionDto: CreateSubscriptionDto, @GetUser() user: User) {
    return this.subscriptionsService.create(createSubscriptionDto, user);
  }

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get('my-subscriptions')
  @UseGuards(AuthGuard('jwt'))
  findMySubscriptions(@GetUser() user: User) {
    return this.subscriptionsService.findByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(+id);
  }
}
