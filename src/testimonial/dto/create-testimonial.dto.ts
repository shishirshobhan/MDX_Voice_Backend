import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsDateString, 
  IsBoolean 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTestimonialDto {
  @ApiProperty({
    description: 'Title of the testimonial',
    example: 'Life-Changing Experience',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the testimonial',
    example: 'This program completely transformed my life and gave me hope...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Date of the testimonial (ISO 8601 format)',
    example: '2025-11-06T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({
    description: 'User ID of the admin creating the testimonial',
    example: 'abc123-def456-ghi789',
  })
  @IsString()
  @IsNotEmpty()
  adminId: string;

  @ApiPropertyOptional({
    description: 'URL to the uploaded thumbnail image',
    example: 'https://storage.example.com/thumbnails/testimonial-123.jpg',
  })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({
    description: 'URL to the uploaded video file',
    example: 'https://storage.example.com/videos/testimonial-123.mp4',
  })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the testimonial is published',
    example: true,
    default: false,
  })
@IsOptional()
@Transform(({ value }) => value === 'true' || value === true)
@IsBoolean()
  published?: boolean;
}
