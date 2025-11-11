import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StoryType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
}

export class CreateUserStoryDto {
  @ApiProperty({ description: 'User ID who is creating the story' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Caption for the story' })
  @IsString()
  @IsNotEmpty()
  caption: string;

  @ApiPropertyOptional({ 
    description: 'Media URL (image or video) - set by controller',
    required: false 
  })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({
    description: 'Type of story content',
    enum: StoryType,
    example: StoryType.TEXT,
  })
  @IsEnum(StoryType)
  @IsOptional()
  type?: StoryType;
}
