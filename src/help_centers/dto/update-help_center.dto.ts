import { PartialType } from '@nestjs/mapped-types';
import { CreateHelpCenterDto } from './create-help_center.dto';

export class UpdateHelpCenterDto extends PartialType(CreateHelpCenterDto) {}
