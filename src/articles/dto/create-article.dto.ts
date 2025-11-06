import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'Getting Started with NestJS',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'getting-started-with-nestjs',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Article content in HTML or Markdown',
    example: '<p>This is the article content...</p>',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Short excerpt or summary',
    example: 'Learn the basics of NestJS framework',
  })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiPropertyOptional({
    description: 'Cover image URL',
    example: 'https://example.com/images/cover.jpg',
  })
  @IsUrl()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({
    description: 'Author user ID',
    example: 'cm123abc456',
  })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiPropertyOptional({
    description: 'Published status',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiPropertyOptional({
    description: 'Array of tag IDs to associate with the article',
    example: ['tag1', 'tag2', 'tag3'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];
}
