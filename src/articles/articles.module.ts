import { Module } from '@nestjs/common';
import { ArticleService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [ArticlesController],
  providers: [ArticleService,PrismaService],
})
export class ArticlesModule {}
