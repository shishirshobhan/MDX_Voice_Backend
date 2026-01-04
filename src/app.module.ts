import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ArticlesModule } from './articles/articles.module';
import { AssessmentModule } from './assessment/assessment.module';
import { HelpCentersModule } from './help_centers/help_centers.module';
import { TestimonialModule } from './testimonial/testimonial.module';
import { StoryModule } from './story/story.module';
import { FirebaseService } from './firebase/firebase.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { FirebaseModule } from './firebase/firebase.module';
import { UploadsModule } from './Uploads_helper/uploads.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Global()
@Module({
  imports: [
    UserModule,
    PrismaModule,
    ArticlesModule,
    FirebaseModule,
    AssessmentModule,
    HelpCentersModule,
    TestimonialModule,
    StoryModule,
     UploadsModule,
    AuthModule,ChatbotModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
  exports: [FirebaseService],
})
export class AppModule {}
