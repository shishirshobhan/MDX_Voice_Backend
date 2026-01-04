
import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { StartChatDto, SendMessageDto } from './dto/chatbot.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('health')
  async healthCheck() {
    return this.chatbotService.healthCheck();
  }

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startChat(@Body() startChatDto: StartChatDto) {
    return this.chatbotService.startChat(startChatDto.session_id);
  }

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.chatbotService.sendMessage(
      sendMessageDto.session_id,
      sendMessageDto.message,
    );
  }

  @Get('resources')
  async getResources() {
    return this.chatbotService.getResources();
  }
}

