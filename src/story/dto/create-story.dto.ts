import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsUrl, 
  IsInt, 
  Min, 
  IsBoolean 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoryDto {
  @ApiProperty({
    description: 'User ID who creates the story',
    example: 'clxxx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Title of the user story',
    example: 'My Journey to Recovery',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the story',
    example: 'This is my personal story about overcoming challenges...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL to the video file',
    example: 'https://storage.example.com/videos/story-123.mp4',
  })
  @IsUrl()
  @IsNotEmpty()
  videoUrl: string;

  @ApiPropertyOptional({
    description: 'URL to the video thumbnail',
    example: 'https://storage.example.com/thumbnails/story-123.jpg',
  })
  @IsUrl()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({
    description: 'Duration of the video in seconds',
    example: 120,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    description: 'Whether the story is published',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
