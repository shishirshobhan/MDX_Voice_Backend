import { Module } from '@nestjs/common';
import { TestimonialService } from './testimonial.service';
import { TestimonialController } from './testimonial.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [TestimonialController],
  providers: [TestimonialService,PrismaService],
})
export class TestimonialModule {}
