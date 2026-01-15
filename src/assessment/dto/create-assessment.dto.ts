import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean, 
  IsArray, 
  ValidateNested, 
  IsInt, 
  Min, 
  ArrayMinSize,
  IsNumber,
  Max,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO for MCQ Options with point values
export class CreateMCQOptionDto {
  @ApiProperty({
    description: 'The text of the option',
    example: 'Never',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Point value for this option',
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  pointValue: number;

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
    example: 'Does your partner ever physically hurt you?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({
    description: 'Additional information or context for the question',
    example: 'This includes any form of physical violence.',
  })
  @IsString()
  @IsOptional()
  additionalInfo?: string;

  @ApiPropertyOptional({
    description: 'Display order of the question',
    example: 1,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: 'Array of answer options with point values',
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
    example: 'Physical Safety',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the section',
    example: 'Questions related to physical safety in relationships',
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

// Risk Level Thresholds
export class RiskLevelThresholdDto {
  @ApiProperty({
    description: 'Minimum score for this risk level',
    example: 0,
  })
  @IsInt()
  @Min(0)
  minScore: number;

  @ApiProperty({
    description: 'Maximum score for this risk level',
    example: 15,
  })
  @IsInt()
  @Min(0)
  maxScore: number;

  @ApiProperty({
    description: 'Risk level name',
    example: 'Low Risk',
    enum: ['Low Risk', 'Moderate Risk', 'High Risk', 'Severe Risk'],
  })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({
    description: 'Message to display for this risk level',
    example: 'Based on your responses, you may not be experiencing domestic violence.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Recommended resources for this risk level',
    type: [String],
    example: ['General awareness articles', 'Preventive information'],
  })
  @IsArray()
  @IsString({ each: true })
  resources: string[];
}

// Main DTO for Assessment
export class CreateAssessmentDto {
  @ApiProperty({
    description: 'The title of the assessment',
    example: 'Domestic Violence and Abuse Awareness Assessment',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the assessment',
    example: 'Self-assessment tool to help identify potential signs of domestic abuse',
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

  @ApiProperty({
    description: 'Risk level thresholds and associated messages',
    type: [RiskLevelThresholdDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RiskLevelThresholdDto)
  riskLevels: RiskLevelThresholdDto[];
}

// DTO for submitting assessment answers (user submission)
export class SubmitAssessmentAnswersDto {
  @ApiProperty({
    description: 'Array of answers',
    example: [
      { questionId: 'q1-id', optionId: 'opt1-id' },
      { questionId: 'q2-id', optionId: 'opt2-id' }
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiPropertyOptional({
    description: 'Optional user identifier for anonymous tracking',
    example: 'anonymous-user-123',
  })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class AnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    description: 'Selected option ID',
    example: 'clx0987654321',
  })
  @IsString()
  @IsNotEmpty()
  optionId: string;
}

// Update DTO
export class UpdateAssessmentDto {
  @ApiPropertyOptional({
    description: 'The title of the assessment',
    example: 'Updated Assessment Title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the assessment',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the assessment is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
