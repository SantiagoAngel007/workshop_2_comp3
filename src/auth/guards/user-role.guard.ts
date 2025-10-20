
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const validRoles: string[] = this.reflector.get<string[]>('roles', context.getHandler());
    
    
    if (!validRoles || validRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    
    const userRoles = user.roles?.map(role => role.name) || [];

    
    const hasValidRole = validRoles.some(role => userRoles.includes(role));

    if (!hasValidRole) {
      throw new UnauthorizedException(
        `User ${user.email} does not have valid roles. Required: ${validRoles.join(', ')}. User roles: ${userRoles.join(', ')}`
      );
    }

    return true;
  }
}