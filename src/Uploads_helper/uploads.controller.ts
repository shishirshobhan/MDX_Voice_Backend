import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { extname, join } from 'path';
import { createReadStream, existsSync } from 'fs';
import * as fs from 'fs';
import express from 'express';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor() {
    const baseDir = join(process.cwd(), 'uploads');
    const dirs = [
      join(baseDir, 'testimonial-videos'),
      join(baseDir, 'testimonial-thumbnails'),
    ];
    
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('Created directory:', dir);
      }
    });
  }

  // Get list of available videos from file system
  @Get('videos/list')
  @ApiOperation({ 
    summary: 'Get list of available videos',
    description: 'Returns a list of all video files available in the testimonial-videos directory'
  })
  @ApiResponse({
    status: 200,
    description: 'List of available videos',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string', example: 'video1.mp4' },
              url: { type: 'string', example: '/uploads/testimonial-videos/video1.mp4' },
              streamUrl: { type: 'string', example: '/uploads/videos/stream/video1.mp4' },
              size: { type: 'number', example: 12345678 },
              sizeFormatted: { type: 'string', example: '11.77 MB' },
              createdAt: { type: 'string', example: '2025-11-07T12:00:00.000Z' },
            },
          },
        },
      },
    },
  })
  getVideoList() {
    const videosDir = join(process.cwd(), 'uploads', 'testimonial-videos');
    
    if (!existsSync(videosDir)) {
      return {
        success: true,
        data: [],
        message: 'Videos directory not found',
      };
    }

    const files = fs.readdirSync(videosDir);
    const videoFiles = files
      .filter(file => {
        const ext = extname(file).toLowerCase();
        return ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.mpeg', '.mpg'].includes(ext);
      })
      .map(file => {
        const filePath = join(videosDir, file);
        const stats = fs.statSync(filePath);
        const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
        return {
          filename: file,
          url: `/uploads/testimonial-videos/${file}`,
          streamUrl: `/uploads/videos/stream/${file}`,
          size: stats.size,
          sizeFormatted: `${sizeInMB} MB`,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      success: true,
      data: videoFiles,
      total: videoFiles.length,
    };
  }

  // Stream video file with range support (for video player seeking)
  @Get('videos/stream/:filename')
  @ApiOperation({ 
    summary: 'Stream video file',
    description: 'Stream a video file with range support for seeking. Use this for video players.'
  })
  @ApiParam({ name: 'filename', description: 'Video filename', example: 'video1.mp4' })
  @ApiResponse({
    status: 200,
    description: 'Video stream',
    content: {
      'video/mp4': {},
      'video/webm': {},
      'video/ogg': {},
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Video not found',
  })
  async streamVideo(
    @Param('filename') filename: string,
    @Res() res: express.Response,
  ) {
    const videoPath = join(process.cwd(), 'uploads', 'testimonial-videos', filename);

    if (!existsSync(videoPath)) {
      throw new NotFoundException(`Video '${filename}' not found`);
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = res.req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': this.getVideoMimeType(filename),
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': this.getVideoMimeType(filename),
      };
      res.writeHead(200, head);
      createReadStream(videoPath).pipe(res);
    }
  }

  // Get video info
  @Get('videos/info/:filename')
  @ApiOperation({ 
    summary: 'Get video file information',
    description: 'Get detailed information about a specific video file'
  })
  @ApiParam({ name: 'filename', description: 'Video filename', example: 'video1.mp4' })
  @ApiResponse({
    status: 200,
    description: 'Video information',
  })
  @ApiResponse({
    status: 404,
    description: 'Video not found',
  })
  getVideoInfo(@Param('filename') filename: string) {
    const videoPath = join(process.cwd(), 'uploads', 'testimonial-videos', filename);

    if (!existsSync(videoPath)) {
      throw new NotFoundException(`Video '${filename}' not found`);
    }

    const stats = fs.statSync(videoPath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);

    return {
      success: true,
      data: {
        filename,
        url: `/uploads/testimonial-videos/${filename}`,
        streamUrl: `/uploads/videos/stream/${filename}`,
        size: stats.size,
        sizeFormatted: `${sizeInMB} MB`,
        mimeType: this.getVideoMimeType(filename),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      },
    };
  }

  // Get list of available thumbnails
  @Get('thumbnails/list')
  @ApiOperation({ 
    summary: 'Get list of available thumbnails',
    description: 'Returns a list of all thumbnail images available in the testimonial-thumbnails directory'
  })
  @ApiResponse({
    status: 200,
    description: 'List of available thumbnails',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string', example: 'thumbnail1.jpg' },
              url: { type: 'string', example: '/uploads/testimonial-thumbnails/thumbnail1.jpg' },
              size: { type: 'number', example: 123456 },
              sizeFormatted: { type: 'string', example: '120.56 KB' },
              createdAt: { type: 'string', example: '2025-11-07T12:00:00.000Z' },
            },
          },
        },
      },
    },
  })
  getThumbnailList() {
    const thumbnailsDir = join(process.cwd(), 'uploads', 'testimonial-thumbnails');
    
    if (!existsSync(thumbnailsDir)) {
      return {
        success: true,
        data: [],
        message: 'Thumbnails directory not found',
      };
    }

    const files = fs.readdirSync(thumbnailsDir);
    const imageFiles = files
      .filter(file => {
        const ext = extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      })
      .map(file => {
        const filePath = join(thumbnailsDir, file);
        const stats = fs.statSync(filePath);
        const sizeInKB = (stats.size / 1024).toFixed(2);
        return {
          filename: file,
          url: `/uploads/testimonial-thumbnails/${file}`,
          size: stats.size,
          sizeFormatted: `${sizeInKB} KB`,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      success: true,
      data: imageFiles,
      total: imageFiles.length,
    };
  }

  // Get thumbnail info
  @Get('thumbnails/info/:filename')
  @ApiOperation({ 
    summary: 'Get thumbnail file information',
    description: 'Get detailed information about a specific thumbnail file'
  })
  @ApiParam({ name: 'filename', description: 'Thumbnail filename', example: 'thumbnail1.jpg' })
  @ApiResponse({
    status: 200,
    description: 'Thumbnail information',
  })
  @ApiResponse({
    status: 404,
    description: 'Thumbnail not found',
  })
  getThumbnailInfo(@Param('filename') filename: string) {
    const thumbnailPath = join(process.cwd(), 'uploads', 'testimonial-thumbnails', filename);

    if (!existsSync(thumbnailPath)) {
      throw new NotFoundException(`Thumbnail '${filename}' not found`);
    }

    const stats = fs.statSync(thumbnailPath);
    const sizeInKB = (stats.size / 1024).toFixed(2);

    return {
      success: true,
      data: {
        filename,
        url: `/uploads/testimonial-thumbnails/${filename}`,
        size: stats.size,
        sizeFormatted: `${sizeInKB} KB`,
        mimeType: this.getImageMimeType(filename),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      },
    };
  }

  // Serve thumbnail image
  @Get('thumbnails/view/:filename')
  @ApiOperation({ 
    summary: 'View thumbnail image',
    description: 'Serve a thumbnail image file'
  })
  @ApiParam({ name: 'filename', description: 'Thumbnail filename', example: 'thumbnail1.jpg' })
  @ApiResponse({
    status: 200,
    description: 'Thumbnail image',
    content: {
      'image/jpeg': {},
      'image/png': {},
      'image/gif': {},
      'image/webp': {},
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Thumbnail not found',
  })
  viewThumbnail(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: express.Response,
  ): StreamableFile {
    const thumbnailPath = join(process.cwd(), 'uploads', 'testimonial-thumbnails', filename);

    if (!existsSync(thumbnailPath)) {
      throw new NotFoundException(`Thumbnail '${filename}' not found`);
    }

    const file = createReadStream(thumbnailPath);
    res.set({
      'Content-Type': this.getImageMimeType(filename),
      'Content-Disposition': `inline; filename="${filename}"`,
    });

    return new StreamableFile(file);
  }

  private getVideoMimeType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.mkv': 'video/x-matroska',
      '.mpeg': 'video/mpeg',
      '.mpg': 'video/mpeg',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getImageMimeType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
