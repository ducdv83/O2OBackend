import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Message } from './entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private connectedClients: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
    
    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without userId`);
      client.disconnect();
      return;
    }

    if (!this.connectedClients.has(userId)) {
      this.connectedClients.set(userId, new Set());
    }
    this.connectedClients.get(userId)?.add(client.id);

    this.logger.log(`Client ${client.id} (user ${userId}) connected`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
    
    if (userId && this.connectedClients.has(userId)) {
      this.connectedClients.get(userId)?.delete(client.id);
      if (this.connectedClients.get(userId)?.size === 0) {
        this.connectedClients.delete(userId);
      }
    }

    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join_booking')
  handleJoinBooking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    client.join(`booking:${data.bookingId}`);
    this.logger.log(`Client ${client.id} joined booking ${data.bookingId}`);
  }

  @SubscribeMessage('leave_booking')
  handleLeaveBooking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    client.leave(`booking:${data.bookingId}`);
    this.logger.log(`Client ${client.id} left booking ${data.bookingId}`);
  }

  /**
   * Send message to all clients in a booking room
   */
  sendMessage(bookingId: string, message: Message) {
    this.server.to(`booking:${bookingId}`).emit('new_message', message);
  }

  /**
   * Send notification to a specific user
   */
  sendNotification(userId: string, notification: any) {
    const userSockets = this.connectedClients.get(userId);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        this.server.to(socketId).emit('notification', notification);
      });
    }
  }
}
