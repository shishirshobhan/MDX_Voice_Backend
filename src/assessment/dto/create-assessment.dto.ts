import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean, 
  IsArray, 
  ValidateNested, 
  IsInt, 
  Min, 
  ArrayMinSize 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO for MCQ Options
export class CreateMCQOptionDto {
  @ApiProperty({
    description: 'The text of the option',
    example: 'Paris',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Whether this option is correct',
    example: true,
  })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({
    description: 'Display order of the option',
    example: 1,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

// DTO for MCQ Questions
export class CreateMCQQuestionDto {
  @ApiProperty({
    description: 'The question text',
    example: 'What is the capital of France?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({
    description: 'Explanation for the correct answer',
    example: 'Paris has been the capital of France since 987 AD.',
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Display order of the question',
    example: 1,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description: 'Points awarded for correct answer',
    example: 10,
    default: 1,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;

  @ApiProperty({
    description: 'Array of answer options',
    type: [CreateMCQOptionDto],
    minItems: 2,
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateMCQOptionDto)
  options: CreateMCQOptionDto[];
}

// DTO for Sections
export class CreateSectionDto {
  @ApiProperty({
    description: 'Name of the section',
    example: 'Science',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the section',
    example: 'Questions related to general science topics',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Display order of the section',
    example: 1,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: 'Array of MCQ questions in this section',
    type: [CreateMCQQuestionDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMCQQuestionDto)
  questions: CreateMCQQuestionDto[];
}

// Main DTO for Assessment
export class CreateAssessmentDto {
  @ApiProperty({
    description: 'The title of the assessment',
    example: 'General Knowledge Quiz',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the assessment',
    example: 'This assessment tests general knowledge across multiple subjects',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the assessment is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Array of sections in the assessment',
    type: [CreateSectionDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDto)
  sections: CreateSectionDto[];
}
