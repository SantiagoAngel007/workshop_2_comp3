/**
 * EVENTS GATEWAY - WebSocket
 *
 * Gateway simple para notificaciones en tiempo real.
 * Se usa principalmente para notificar cambios de roles a usuarios.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, cambiar por el dominio del frontend
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  // Mapa para trackear qué socket pertenece a qué usuario
  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Limpiar el mapa
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  /**
   * El cliente se registra con su userId para recibir notificaciones
   */
  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: string) {
    this.userSockets.set(userId, client.id);
    this.logger.log(`User ${userId} registered with socket ${client.id}`);
    return { success: true };
  }

  /**
   * Notifica a un usuario específico que sus roles cambiaron
   */
  notifyRoleChange(userId: string, newRoles: any[]) {
    const socketId = this.userSockets.get(userId);

    if (socketId) {
      this.logger.log(`Notifying user ${userId} about role change`);
      this.server.to(socketId).emit('roleChanged', {
        roles: newRoles,
        message: 'Tus roles han sido actualizados',
      });
    } else {
      this.logger.warn(`User ${userId} not connected via WebSocket`);
    }
  }

  /**
   * Notifica a un usuario que su estado de activación cambió
   */
  notifyUserStatusChange(userId: string, isActive: boolean) {
    const socketId = this.userSockets.get(userId);

    if (socketId) {
      this.logger.log(`Notifying user ${userId} about status change: isActive=${isActive}`);
      this.server.to(socketId).emit('userStatusChanged', {
        isActive,
        message: isActive
          ? 'Tu cuenta ha sido reactivada'
          : 'Tu cuenta ha sido desactivada',
      });
    } else {
      this.logger.warn(`User ${userId} not connected via WebSocket`);
    }
  }
}
