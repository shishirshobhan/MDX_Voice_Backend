import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEmail, 
  IsBoolean,
  IsUrl 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHelpCenterDto {
  @ApiProperty({
    description: 'Name of the help center',
    example: 'Customer Support Center',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'URL to the help center logo',
    example: 'https://example.com/logo.png',
  })
  @IsUrl()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+1-234-567-8900',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'support@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Physical address of the help center',
    example: '123 Main Street, New York, NY 10001',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the help center',
    example: 'We provide 24/7 customer support for all your needs',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the help center is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
