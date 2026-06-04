import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import {
  createConversationMessageSchema,
  type ConversationSummary,
  type CreateConversationMessageInput,
  type MessageSummary,
  type PublicUser
} from "@bbs/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../validation/zod-validation.pipe.js";
import { MessagesService } from "./messages.service.js";

interface ConversationsResponse {
  conversations: ConversationSummary[];
}

interface MessagesResponse {
  messages: MessageSummary[];
}

interface SendMessageResponse {
  conversation: ConversationSummary;
  message: MessageSummary;
}

@Controller("messages")
@UseGuards(SessionGuard)
export class MessagesController {
  constructor(@Inject(MessagesService) private readonly messagesService: MessagesService) {}

  @Get("conversations")
  async listConversations(@CurrentUser() user: PublicUser): Promise<ConversationsResponse> {
    return {
      conversations: await this.messagesService.listConversations(user)
    };
  }

  @Get("conversations/:id")
  async listMessages(@Param("id") conversationId: string, @CurrentUser() user: PublicUser): Promise<MessagesResponse> {
    return {
      messages: await this.messagesService.listMessages(conversationId, user)
    };
  }

  @Post()
  async sendMessage(
    @Body(new ZodValidationPipe(createConversationMessageSchema)) input: CreateConversationMessageInput,
    @CurrentUser() user: PublicUser
  ): Promise<SendMessageResponse> {
    return this.messagesService.sendMessage(input, user);
  }
}
