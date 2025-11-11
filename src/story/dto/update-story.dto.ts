import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserStoryDto } from './create-story.dto';
export class UpdateUserStoryDto extends PartialType(CreateUserStoryDto) {
  @ApiProperty({ description: 'Caption for the story', required: false })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ description: 'Image URL (will be set by controller)', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: 'Whether the story is published', required: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
