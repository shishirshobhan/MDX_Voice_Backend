import { Module } from '@nestjs/common';
import { HelpCentersService } from './help_centers.service';
import { HelpCentersController } from './help_centers.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [HelpCentersController],
  providers: [HelpCentersService, PrismaService],
})
export class HelpCentersModule {}
