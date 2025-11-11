import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreateUserStoryDto } from './dto/create-story.dto';
import { UpdateUserStoryDto } from './dto/update-story.dto';

@Injectable()
export class UserStoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to delete an image from the filesystem
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
      console.log(createUserStoryDto.userId)
      const userExists = await this.prisma.user.findUnique({
        where: { id: createUserStoryDto.userId },
      });
      console.log(!userExists)

      if (!userExists) {
        throw new BadRequestException('User not found');
      }

      console

      const userStory = await this.prisma.userStory.create({
        data: {
          userId: createUserStoryDto.userId,
          caption: createUserStoryDto.caption,
          imageUrl: createUserStoryDto.imageUrl ?? '',
          published: createUserStoryDto.published ?? true,
        } as any,
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

      console.log(userStory)

      return {
        success: true,
        message: 'Story created successfully',
        data: userStory,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create story',error.message);
    }
  }

  async findAll(options?: {
    userId?: string;
    published?: boolean;
    skip?: number;
    take?: number;
    orderBy?: 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
  }) {
    const {
      userId,
      published,
      skip = 0,
      take = 10,
      orderBy = 'createdAt',
      order = 'desc',
    } = options || {};

    const where: Prisma.UserStoryWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (published !== undefined) {
      where.published = published;
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

      // Handle image update - delete old file if new one is provided
      if (updateUserStoryDto.imageUrl !== undefined) {
        if (updateUserStoryDto.imageUrl && existing.imageUrl && 
            updateUserStoryDto.imageUrl !== existing.imageUrl) {
          await this.deleteFile(existing.imageUrl);
        }
        updateData.imageUrl = updateUserStoryDto.imageUrl;
      }

      if (updateUserStoryDto.published !== undefined) {
        updateData.published = updateUserStoryDto.published;
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

      // Delete associated image from filesystem
      if (existing.imageUrl) {
        await this.deleteFile(existing.imageUrl);
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

  async togglePublish(id: string) {
    const story = await this.prisma.userStory.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    const updated = await this.prisma.userStory.update({
      where: { id },
      data: { published: !story.published },
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
      message: `Story ${updated.published ? 'published' : 'unpublished'} successfully`,
      data: updated,
    };
  }

  async getPublishedStories(skip = 0, take = 10) {
    return this.findAll({
      published: true,
      skip,
      take,
      orderBy: 'createdAt',
      order: 'desc',
    });
  }

  async getStoriesByUser(userId: string, skip = 0, take = 10) {
    return this.findAll({
      userId,
      skip,
      take,
    });
  }

  async getStatistics() {
    const [total, published, unpublished] = await Promise.all([
      this.prisma.userStory.count(),
      this.prisma.userStory.count({ where: { published: true } }),
      this.prisma.userStory.count({ where: { published: false } }),
    ]);

    return {
      success: true,
      data: {
        total,
        published,
        unpublished,
      },
    };
  }
}
