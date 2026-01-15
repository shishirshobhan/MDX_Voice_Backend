
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StartChatDto {
  @IsString()
  @IsOptional()
  session_id?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

