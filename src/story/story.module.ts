import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { FirebaseAuthGuard } from 'src/auth/authguard';
import { AuthService } from 'src/auth/authservice';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StoryController],
  providers: [StoryService],
})
export class StoryModule {}
