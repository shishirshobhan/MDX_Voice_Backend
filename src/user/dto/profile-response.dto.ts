import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Firebase user ID',
    example: 'firebase-user-id-123',
  })
  uid: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Whether email is verified',
    example: true,
  })
  email_verified: boolean;

  @ApiProperty({
    description: 'User photo URL',
    example: 'https://example.com/photo.jpg',
    required: false,
  })
  picture?: string;
}