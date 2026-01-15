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
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Multer } from 'multer';
import { FirebaseAuthGuard } from '../auth/authguard';
import { ApiConsumes, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserStoryService } from './story.service';
import { CreateUserStoryDto, StoryType } from './dto/create-story.dto';
import { UpdateUserStoryDto } from './dto/update-story.dto';

// File filter for images and videos
const mediaFileFilter = (req, file, cb) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        'Only image (jpg, jpeg, png, gif, webp) and video (mp4, mov, avi, webm) files are allowed!'
      ),
      false
    );
  }
};

@ApiTags('User Stories')
@Controller('user-story')
@UseGuards(FirebaseAuthGuard) // Uncomment when ready to use auth
export class UserStoryController {
  constructor(private readonly userStoryService: UserStoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user story with optional media upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        caption: { type: 'string' },
        type: {
          type: 'string',
          enum: ['image', 'video', 'text'],
          description: 'Type of story (optional - auto-detected from file)',
        },
        media: {
          type: 'string',
          format: 'binary',
          description: 'Story media file (optional - image or video)',
        },
      },
      required: ['userId', 'caption'],
    },
  })
  @UseInterceptors(
    FileInterceptor('media', {
      storage: diskStorage({
        destination: './uploads/userstory',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `story-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: mediaFileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for videos
      },
    }),
  )
  create(
    @Body() createUserStoryDto: CreateUserStoryDto,
    @UploadedFile() file?: Multer.File,
  ) {
    console.log('Creating story with file:', file?.filename);

    // Validate that at least caption is provided
    if (!createUserStoryDto.caption || createUserStoryDto.caption.trim() === '') {
      throw new BadRequestException('Caption is required');
    }

    const storyData: CreateUserStoryDto = {
      ...createUserStoryDto,
    };

    // If file is uploaded, set the media URL and type
    if (file) {
      storyData.mediaUrl = `/uploads/userstory/${file.filename}`;
      
      // Auto-detect type from mimetype if not provided
      if (!storyData.type) {
        if (file.mimetype.startsWith('image/')) {
          storyData.type = StoryType.IMAGE;
        } else if (file.mimetype.startsWith('video/')) {
          storyData.type = StoryType.VIDEO;
        }
      }
    } else {
      // No file uploaded, this is a text-only story
      storyData.type = StoryType.TEXT;
    }

    return this.userStoryService.create(storyData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user stories with optional filters' })
  findAll(
    @Query('userId') userId?: string,
    @Query('type') type?: StoryType,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('orderBy') orderBy?: 'createdAt' | 'updatedAt',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.userStoryService.findAll({
      userId,
      type,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      orderBy,
      order,
    });
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get stories by type (image/video/text)' })
  getByType(
    @Param('type') type: StoryType,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.userStoryService.getStoriesByType(
      type,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 10,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get story statistics' })
  getStatistics() {
    return this.userStoryService.getStatistics();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all stories by a specific user' })
  getByUser(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.userStoryService.getStoriesByUser(
      userId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a story by ID' })
  findOne(@Param('id') id: string) {
    return this.userStoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a story with optional media upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        caption: { type: 'string' },
        type: {
          type: 'string',
          enum: ['image', 'video', 'text'],
        },
        media: {
          type: 'string',
          format: 'binary',
          description: 'New story media file (optional)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('media', {
      storage: diskStorage({
        destination: './uploads/userstory',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `story-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: mediaFileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateUserStoryDto: UpdateUserStoryDto,
    @UploadedFile() file?: Multer.File,
  ) {
    const updateData = { ...updateUserStoryDto };

    if (file) {
      updateData.mediaUrl = `/uploads/userstory/${file.filename}`;
      
      // Auto-detect type from mimetype if not provided
      if (!updateData.type) {
        if (file.mimetype.startsWith('image/')) {
          updateData.type = StoryType.IMAGE;
        } else if (file.mimetype.startsWith('video/')) {
          updateData.type = StoryType.VIDEO;
        }
      }
    }

    return this.userStoryService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story' })
  remove(@Param('id') id: string) {
    return this.userStoryService.remove(id);
  }
}
