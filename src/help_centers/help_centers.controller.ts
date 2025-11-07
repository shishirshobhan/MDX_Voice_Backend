import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HelpCentersService } from './help_centers.service';
import { CreateHelpCenterDto } from './dto/create-help_center.dto';
import { UpdateHelpCenterDto } from './dto/update-help_center.dto';
import { UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/authguard';

@Controller('help-centers')
@UseGuards(FirebaseAuthGuard)
export class HelpCentersController {
  constructor(private readonly helpCentersService: HelpCentersService) {}

  @Post()
  create(@Body() createHelpCenterDto: CreateHelpCenterDto) {
    return this.helpCentersService.create(createHelpCenterDto);
  }

  @Get()
  findAll() {
    return this.helpCentersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.helpCentersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHelpCenterDto: UpdateHelpCenterDto) {
    return this.helpCentersService.update(+id, updateHelpCenterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.helpCentersService.remove(+id);
  }
}
