import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreateUserStoryDto, StoryType } from './dto/create-story.dto';
import { UpdateUserStoryDto } from './dto/update-story.dto';

@Injectable()
export class UserStoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to delete a file from the filesystem
   */
  private async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    try {
      const filePath = path.join(process.cwd(), fileUrl);
      await fs.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to delete file ${fileUrl}:`, error);
    }
  }

  async create(createUserStoryDto: CreateUserStoryDto) {
    try {
      // Verify user exists
      console.log('Creating story for userId:', createUserStoryDto.userId);
      const userExists = await this.prisma.user.findUnique({
        where: { id: createUserStoryDto.userId },
      });

      console.log('User exists:', createUserStoryDto.userId);

      if (!userExists) {
        throw new BadRequestException('User not found');
      }

      // Determine story type if not provided
      let storyType = createUserStoryDto.type;
      if (!storyType) {
        if (createUserStoryDto.mediaUrl) {
          // Try to determine from file extension
          const ext = path.extname(createUserStoryDto.mediaUrl).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            storyType = StoryType.IMAGE;
          } else if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
            storyType = StoryType.VIDEO;
          } else {
            storyType = StoryType.TEXT;
          }
        } else {
          storyType = StoryType.TEXT;
        }
      }

      const userStory = await this.prisma.userStory.create({
        data: {
          userId: createUserStoryDto.userId,
          caption: createUserStoryDto.caption,
          mediaUrl: createUserStoryDto.mediaUrl || null,
          type: storyType,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              photoURL: true,
            },
          },
        },
      });

      console.log('Story created:', userStory);

      return {
        success: true,
        message: 'Story created successfully',
        data: userStory,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create story', error.message);
    }
  }

  async findAll(options?: {
    userId?: string;
    type?: StoryType;
    skip?: number;
    take?: number;
    orderBy?: 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
  }) {
    const {
      userId,
      type,
      skip = 0,
      take = 10,
      orderBy = 'createdAt',
      order = 'desc',
    } = options || {};

    const where: Prisma.UserStoryWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    const [stories, total] = await Promise.all([
      this.prisma.userStory.findMany({
        where,
        skip,
        take,
        orderBy: {
          [orderBy]: order,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              photoURL: true,
            },
          },
        },
      }),
      this.prisma.userStory.count({ where }),
    ]);

    return {
      success: true,
      data: stories,
      meta: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const story = await this.prisma.userStory.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            photoURL: true,
          },
        },
      },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    return {
      success: true,
      data: story,
    };
  }

  async update(id: string, updateUserStoryDto: UpdateUserStoryDto) {
    try {
      const existing = await this.prisma.userStory.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Story with ID ${id} not found`);
      }

      const updateData: any = {};

      if (updateUserStoryDto.caption !== undefined) {
        updateData.caption = updateUserStoryDto.caption;
      }

      // Handle media update - delete old file if new one is provided
      if (updateUserStoryDto.mediaUrl !== undefined) {
        if (updateUserStoryDto.mediaUrl && existing.mediaUrl && 
            updateUserStoryDto.mediaUrl !== existing.mediaUrl) {
          await this.deleteFile(existing.mediaUrl);
        }
        updateData.mediaUrl = updateUserStoryDto.mediaUrl;

        // Update type if media changes
        if (updateUserStoryDto.type) {
          updateData.type = updateUserStoryDto.type;
        }
      }

      const story = await this.prisma.userStory.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              photoURL: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Story updated successfully',
        data: story,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update story');
    }
  }

  async remove(id: string) {
    try {
      const existing = await this.prisma.userStory.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Story with ID ${id} not found`);
      }

      await this.prisma.userStory.delete({
        where: { id },
      });

      // Delete associated media from filesystem
      if (existing.mediaUrl) {
        await this.deleteFile(existing.mediaUrl);
      }

      return {
        success: true,
        message: 'Story deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete story');
    }
  }

  async getStoriesByUser(userId: string, skip = 0, take = 10) {
    return this.findAll({
      userId,
      skip,
      take,
    });
  }

  async getStoriesByType(type: StoryType, skip = 0, take = 10) {
    return this.findAll({
      type,
      skip,
      take,
      orderBy: 'createdAt',
      order: 'desc',
    });
  }

  async getStatistics() {
    const [total, imageCount, videoCount, textCount] = await Promise.all([
      this.prisma.userStory.count(),
      this.prisma.userStory.count({ where: { type: StoryType.IMAGE } }),
      this.prisma.userStory.count({ where: { type: StoryType.VIDEO } }),
      this.prisma.userStory.count({ where: { type: StoryType.TEXT } }),
    ]);

    return {
      success: true,
      data: {
        total,
        byType: {
          image: imageCount,
          video: videoCount,
          text: textCount,
        },
      },
    };
  }
}
