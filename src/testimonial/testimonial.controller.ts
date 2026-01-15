import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Multer } from 'multer';
import { TestimonialService } from './testimonial.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { FirebaseAuthGuard } from '../auth/authguard';
import { ApiConsumes, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

// Configure multer storage
const videoStorage = diskStorage({
  destination: './uploads/testimonial-videos',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `testimonial-${uniqueSuffix}${ext}`);
  },
});

const thumbnailStorage = diskStorage({
  destination: './uploads/testimonial-thumbnails',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `thumbnail-${uniqueSuffix}${ext}`);
  },
});

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  if (file.mimetype.match(/\/(mp4|avi|mov|wmv|flv|mkv|webm)$/)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only video files are allowed!'), false);
  }
};

// File filter for images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only image files are allowed!'), false);
  }
};

@ApiTags('Testimonials')
@Controller('testimonial')
// @UseGuards(FirebaseAuthGuard)
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new testimonial with video upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        adminId: { type: 'string' },
        published: { type: 'boolean' },
        video: {
          type: 'string',
          format: 'binary',
          description: 'Video file (mp4, avi, mov, wmv, flv, mkv, webm)',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Thumbnail image (jpg, jpeg, png, gif, webp)',
        },
      },
      required: ['title', 'adminId'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'video',
          maxCount: 1,
        },
        {
          name: 'thumbnail',
          maxCount: 1,
        },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            if (file.fieldname === 'video') {
              cb(null, './uploads/testimonial-videos');
            } else {
              cb(null, './uploads/testimonial-thumbnails');
            }
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const prefix = file.fieldname === 'video' ? 'testimonial' : 'thumbnail';
            cb(null, `${prefix}-${uniqueSuffix}${ext}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'video') {
            videoFileFilter(req, file, cb);
          } else {
            imageFileFilter(req, file, cb);
          }
        },
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB limit for videos
        },
      },
    ),
  )
  create(
    @Body() createTestimonialDto: CreateTestimonialDto,
    @UploadedFiles()
    files: {
      video?: Multer.File[];
      thumbnail?: Multer.File[];
    },
  ) {
    if (!files.video || files.video.length === 0) {
      throw new BadRequestException('Video file is required');
    }

    // Construct URLs for the uploaded files
    const videoUrl = `/uploads/testimonial-videos/${files.video[0].filename}`;
    const thumbnailUrl = files.thumbnail?.[0]
      ? `/uploads/testimonial-thumbnails/${files.thumbnail[0].filename}`
      : undefined;

    return this.testimonialService.create({
      ...createTestimonialDto,
      videoUrl,
      thumbnail: thumbnailUrl,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all testimonials with optional filters' })
  findAll(
    @Query('published') published?: string,
    @Query('adminId') adminId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('orderBy') orderBy?: 'date' | 'createdAt',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.testimonialService.findAll({
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      adminId,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      orderBy,
      order,
    });
  }

  @Get('published')
  @ApiOperation({ summary: 'Get all published testimonials' })
  getPublished(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.testimonialService.getPublishedTestimonials(
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a testimonial by ID' })
  findOne(@Param('id') id: string) {
    return this.testimonialService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a testimonial with optional video upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        adminId: { type: 'string' },
        published: { type: 'boolean' },
        video: {
          type: 'string',
          format: 'binary',
          description: 'New video file (optional)',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'New thumbnail image (optional)',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            if (file.fieldname === 'video') {
              cb(null, './uploads/testimonial-videos');
            } else {
              cb(null, './uploads/testimonial-thumbnails');
            }
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const prefix = file.fieldname === 'video' ? 'testimonial' : 'thumbnail';
            cb(null, `${prefix}-${uniqueSuffix}${ext}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'video') {
            videoFileFilter(req, file, cb);
          } else {
            imageFileFilter(req, file, cb);
          }
        },
        limits: {
          fileSize: 100 * 1024 * 1024,
        },
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() updateTestimonialDto: UpdateTestimonialDto,
    @UploadedFiles()
    files?: {
      video?: Multer.File[];
      thumbnail?: Multer.File[];
    },
  ) {
    const updateData = { ...updateTestimonialDto };

    if (files?.video?.[0]) {
      updateData.videoUrl = `/uploads/testimonial-videos/${files.video[0].filename}`;
    }

    if (files?.thumbnail?.[0]) {
      updateData.thumbnail = `/uploads/testimonial-thumbnails/${files.thumbnail[0].filename}`;
    }

    return this.testimonialService.update(id, updateData);
  }

  @Patch(':id/toggle-publish')
  @ApiOperation({ summary: 'Toggle publish status of a testimonial' })
  togglePublish(@Param('id') id: string) {
    return this.testimonialService.togglePublish(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a testimonial' })
  remove(@Param('id') id: string) {
    return this.testimonialService.remove(id);
  }
}
