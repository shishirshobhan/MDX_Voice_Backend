import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserStoryDto {
  @ApiProperty({ description: 'User ID who is creating the story' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Caption for the story' })
  @IsString()
  @IsNotEmpty()
  caption: string;

  @ApiProperty({ description: 'Image URL (will be set by controller)', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the story is published',
    example: true,
    default: false,
  })
@IsOptional()
@Transform(({ value }) => value === 'true' || value === true)
@IsBoolean()
  published?: boolean;
}
