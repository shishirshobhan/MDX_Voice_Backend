import { Module } from '@nestjs/common';
import { UserStoryService } from './story.service';
import { UserStoryController } from './story.controller';
import { FirebaseAuthGuard } from 'src/auth/authguard';
import { AuthService } from 'src/auth/authservice';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [UserStoryController],
  providers: [UserStoryService, PrismaService],
})
export class StoryModule {}
