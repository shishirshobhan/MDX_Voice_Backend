import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { PrismaService } from 'prisma/prisma.service';
import { AuthService } from 'src/auth/authservice';
import { AuthModule } from 'src/auth/auth.module';
@Module({
    imports: [AuthModule],
  controllers: [AssessmentController],
  providers: [AssessmentService,PrismaService],
})
export class AssessmentModule {}
