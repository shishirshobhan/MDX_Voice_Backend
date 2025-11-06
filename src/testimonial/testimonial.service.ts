import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust path as needed
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TestimonialService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTestimonialDto: CreateTestimonialDto) {
    try {
      // Verify admin user exists
      const adminExists = await this.prisma.user.findUnique({
        where: { id: createTestimonialDto.adminId },
      });

      if (!adminExists) {
        throw new BadRequestException('Admin user not found');
      }

      const testimonial = await this.prisma.testimonial.create({
        data: {
          title: createTestimonialDto.title,
          description: createTestimonialDto.description,
          date: createTestimonialDto.date ? new Date(createTestimonialDto.date) : new Date(),
          adminId: createTestimonialDto.adminId,
          thumbnail: createTestimonialDto.thumbnail,
          videoUrl: createTestimonialDto.videoUrl,
          published: createTestimonialDto.published ?? false,
        },
        include: {
          admin: {
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
        message: 'Testimonial created successfully',
        data: testimonial,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create testimonial');
    }
  }

  async findAll(options?: {
    published?: boolean;
    adminId?: string;
    skip?: number;
    take?: number;
    orderBy?: 'date' | 'createdAt';
    order?: 'asc' | 'desc';
  }) {
    const {
      published,
      adminId,
      skip = 0,
      take = 10,
      orderBy = 'createdAt',
      order = 'desc',
    } = options || {};

    const where: Prisma.TestimonialWhereInput = {};

    if (published !== undefined) {
      where.published = published;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    const [testimonials, total] = await Promise.all([
      this.prisma.testimonial.findMany({
        where,
        skip,
        take,
        orderBy: {
          [orderBy]: order,
        },
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              displayName: true,
              photoURL: true,
            },
          },
        },
      }),
      this.prisma.testimonial.count({ where }),
    ]);

    return {
      success: true,
      data: testimonials,
      meta: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            displayName: true,
            photoURL: true,
          },
        },
      },
    });

    if (!testimonial) {
      throw new NotFoundException(`Testimonial with ID ${id} not found`);
    }

    return {
      success: true,
      data: testimonial,
    };
  }

  async update(id: string, updateTestimonialDto: UpdateTestimonialDto) {
    try {
      // Check if testimonial exists
      const exists = await this.prisma.testimonial.findUnique({
        where: { id },
      });

      if (!exists) {
        throw new NotFoundException(`Testimonial with ID ${id} not found`);
      }

      // If adminId is being updated, verify the new admin exists
      if (updateTestimonialDto.adminId) {
        const adminExists = await this.prisma.user.findUnique({
          where: { id: updateTestimonialDto.adminId },
        });

        if (!adminExists) {
          throw new BadRequestException('Admin user not found');
        }
      }

      const updateData: Prisma.TestimonialUpdateInput = {};

      if (updateTestimonialDto.title) updateData.title = updateTestimonialDto.title;
      if (updateTestimonialDto.description !== undefined) {
        updateData.description = updateTestimonialDto.description;
      }
      if (updateTestimonialDto.date) {
        updateData.date = new Date(updateTestimonialDto.date);
      }
      if (updateTestimonialDto.adminId) {
        updateData.admin = {
          connect: { id: updateTestimonialDto.adminId },
        };
      }
      if (updateTestimonialDto.thumbnail !== undefined) {
        updateData.thumbnail = updateTestimonialDto.thumbnail;
      }
      if (updateTestimonialDto.videoUrl) {
        updateData.videoUrl = updateTestimonialDto.videoUrl;
      }
      if (updateTestimonialDto.published !== undefined) {
        updateData.published = updateTestimonialDto.published;
      }

      const testimonial = await this.prisma.testimonial.update({
        where: { id },
        data: updateData,
        include: {
          admin: {
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
        message: 'Testimonial updated successfully',
        data: testimonial,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update testimonial');
    }
  }

  async remove(id: string) {
    try {
      const exists = await this.prisma.testimonial.findUnique({
        where: { id },
      });

      if (!exists) {
        throw new NotFoundException(`Testimonial with ID ${id} not found`);
      }

      await this.prisma.testimonial.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Testimonial deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete testimonial');
    }
  }

  // Additional utility methods

  async togglePublish(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      throw new NotFoundException(`Testimonial with ID ${id} not found`);
    }

    const updated = await this.prisma.testimonial.update({
      where: { id },
      data: { published: !testimonial.published },
      include: {
        admin: {
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
      message: `Testimonial ${updated.published ? 'published' : 'unpublished'} successfully`,
      data: updated,
    };
  }

  async getPublishedTestimonials(skip = 0, take = 10) {
    return this.findAll({
      published: true,
      skip,
      take,
      orderBy: 'date',
      order: 'desc',
    });
  }

  async getTestimonialsByAdmin(adminId: string, skip = 0, take = 10) {
    return this.findAll({
      adminId,
      skip,
      take,
    });
  }
}
