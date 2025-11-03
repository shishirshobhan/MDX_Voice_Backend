import { Module } from '@nestjs/common';
import { HelpCentersService } from './help_centers.service';
import { HelpCentersController } from './help_centers.controller';

@Module({
  controllers: [HelpCentersController],
  providers: [HelpCentersService],
})
export class HelpCentersModule {}
