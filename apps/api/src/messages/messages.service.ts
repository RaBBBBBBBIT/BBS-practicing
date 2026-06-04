import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType as PrismaNotificationType } from "@prisma/client";
import type { ConversationSummary, CreateConversationMessageInput, MessageSummary, PublicUser } from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class MessagesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listConversations(user: PublicUser): Promise<ConversationSummary[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }]
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    return Promise.all(conversations.map((conversation) => this.toConversationSummary(conversation, user.id)));
  }

  async listMessages(conversationId: string, user: PublicUser): Promise<MessageSummary[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userAId: true, userBId: true }
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    if (conversation.userAId !== user.id && conversation.userBId !== user.id) {
      throw new ForbiddenException("You cannot read this conversation");
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: { sender: true }
    });

    return messages.map((message) => this.toMessageSummary(message));
  }

  async sendMessage(
    input: CreateConversationMessageInput,
    user: PublicUser
  ): Promise<{ conversation: ConversationSummary; message: MessageSummary }> {
    if (input.recipientId === user.id) {
      throw new BadRequestException("You cannot message yourself");
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: input.recipientId },
      select: { id: true, username: true }
    });

    if (!recipient) {
      throw new NotFoundException("Recipient not found");
    }

    const participants = [user.id, input.recipientId].sort() as [string, string];
    const userAId = participants[0];
    const userBId = participants[1];
    const result = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: { userAId, userBId },
        update: { updatedAt: new Date() }
      });

      const message = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          body: input.body
        },
        include: { sender: true }
      });

      const updatedConversation = await tx.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });

      await tx.notification.create({
        data: {
          userId: input.recipientId,
          type: PrismaNotificationType.MESSAGE,
          title: "你收到了一条私信",
          body: `${user.username} 发来私信：${input.body}`
        }
      });

      return { conversation: updatedConversation, message };
    });

    return {
      conversation: await this.toConversationSummary(result.conversation, user.id),
      message: this.toMessageSummary(result.message)
    };
  }

  private async toConversationSummary(
    conversation: {
      id: string;
      userAId: string;
      userBId: string;
      updatedAt: Date;
      messages: Array<{ body: string }>;
    },
    viewerId: string
  ): Promise<ConversationSummary> {
    const participantId = conversation.userAId === viewerId ? conversation.userBId : conversation.userAId;
    const participant = await this.prisma.user.findUniqueOrThrow({
      where: { id: participantId },
      select: { username: true }
    });

    return {
      id: conversation.id,
      participantId,
      participantUsername: participant.username,
      lastMessageBody: conversation.messages[0]?.body ?? "",
      unreadCount: 0,
      updatedAt: conversation.updatedAt.toISOString()
    };
  }

  private toMessageSummary(message: {
    id: string;
    conversationId: string;
    senderId: string;
    sender: { username: string };
    body: string;
    createdAt: Date;
  }): MessageSummary {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderUsername: message.sender.username,
      body: message.body,
      createdAt: message.createdAt.toISOString()
    };
  }
}
