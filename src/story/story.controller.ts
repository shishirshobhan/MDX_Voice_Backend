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
import { CreateUserStoryDto } from './dto/create-story.dto';
import { UpdateUserStoryDto } from './dto/update-story.dto';


// File filter for images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only image files are allowed!'), false);
  }
};

@ApiTags('User Stories')
@Controller('user-story')
// @UseGuards(FirebaseAuthGuard) // Uncomment when ready to use auth
export class UserStoryController {
  constructor(private readonly userStoryService: UserStoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user story with image upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        caption: { type: 'string' },
        published: { type: 'boolean' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Story image (jpg, jpeg, png, gif, webp)',
        },
      },
      required: ['userId', 'caption', 'image'],
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/userstory',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `story-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  create(
    @Body() createUserStoryDto: CreateUserStoryDto,
    @UploadedFile() file: Multer.File,
  ) {
    console.log('Uploaded file')
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const imageUrl = `/uploads/userstory/${file.filename}`;

    return this.userStoryService.create({
      ...createUserStoryDto,
      imageUrl,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all user stories with optional filters' })
  findAll(
    @Query('userId') userId?: string,
    @Query('published') published?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('orderBy') orderBy?: 'createdAt' | 'updatedAt',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.userStoryService.findAll({
      userId,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      orderBy,
      order,
    });
  }

  @Get('published')
  @ApiOperation({ summary: 'Get all published stories' })
  getPublished(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.userStoryService.getPublishedStories(
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
  @ApiOperation({ summary: 'Update a story with optional image upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        caption: { type: 'string' },
        published: { type: 'boolean' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'New story image (optional)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/userstory',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `story-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
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
      updateData.imageUrl = `/uploads/userstory/${file.filename}`;
    }

    return this.userStoryService.update(id, updateData);
  }

  @Patch(':id/toggle-publish')
  @ApiOperation({ summary: 'Toggle publish status of a story' })
  togglePublish(@Param('id') id: string) {
    return this.userStoryService.togglePublish(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story' })
  remove(@Param('id') id: string) {
    return this.userStoryService.remove(id);
  }
}
