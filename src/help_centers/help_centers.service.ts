import { Injectable } from '@nestjs/common';
import { CreateHelpCenterDto } from './dto/create-help_center.dto';
import { UpdateHelpCenterDto } from './dto/update-help_center.dto';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class HelpCentersService {
  constructor(private readonly prisma: PrismaService) {}
  create(createHelpCenterDto: CreateHelpCenterDto) {
    const helpCenter = this.prisma.helpCenter.create({
      data: {
        name: createHelpCenterDto.name,
        description: createHelpCenterDto.description?.replace(/\.(\s+[A-Z])/g, '.\n\n$1').trim(),
        phoneNumber: createHelpCenterDto.phoneNumber,
        email: createHelpCenterDto.email,
        address: createHelpCenterDto.address,
        logo: createHelpCenterDto.logo,
        isActive: createHelpCenterDto.isActive ?? true,
      },
    });
    return helpCenter;
  }

  findAll() {
    return this.prisma.helpCenter.findMany();
  }

  findOne(id) {
    return this.prisma.helpCenter.findUnique({
      where: { id },
    });
  }

  update(id, updateHelpCenterDto) {
    return this.prisma.helpCenter.update({
      where: { id },
      data: updateHelpCenterDto,
    });
  }

  remove(id) {
    return this.prisma.helpCenter.delete({
      where: { id },
    });
  }
}
