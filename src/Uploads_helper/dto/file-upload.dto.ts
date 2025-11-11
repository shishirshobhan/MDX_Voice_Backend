import { ApiProperty } from '@nestjs/swagger';

export class FileUploadResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'File uploaded successfully' })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      filename: { type: 'string', example: 'thumbnail-1762544432752-607021853.jpeg' },
      url: { type: 'string', example: '/uploads/testimonial-thumbnails/thumbnail-1762544432752-607021853.jpeg' },
      path: { type: 'string', example: '/path/to/file' },
      size: { type: 'number', example: 123456 },
      mimetype: { type: 'string', example: 'image/jpeg' },
    },
  })
  data: {
    filename: string;
    url: string;
    path: string;
    size: number;
    mimetype: string;
  };
}
