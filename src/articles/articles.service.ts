import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto) {
    const {author, ...articleData } = createArticleDto;

    console.log('Creating article with data:', articleData);
    

    const article = await this.prisma.article.create({
      data: {
        ...articleData,
        author
      },
    });

    // Create article with tags
    // const article = await this.prisma.article.create({
    //   data: {
    //     ...articleData,
    //     publishedAt: articleData.published ? new Date() : null,
    //   },
    // });

    return this.formatArticleResponse(article);
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
       
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    return this.formatArticleResponse(article);
  }

    async findAll() {
    const articles = await this.prisma.article.findMany();

    return articles;
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
       
    });

    if (!article) {
      throw new NotFoundException(`Article with slug ${slug} not found`);
    }

    return this.formatArticleResponse(article);
  }

  async update(id: string, updateArticleDto: UpdateArticleDto) {
    const {author, ...articleData } = updateArticleDto;

    // Check if article exists
    await this.findOne(id);

    // Check if slug is being updated and already exists
    if (articleData.slug) {
      const existingArticle = await this.prisma.article.findUnique({
        where: { slug: articleData.slug },
      });

      if (existingArticle && existingArticle.id !== id) {
        throw new ConflictException('Article with this slug already exists');
      }
    }

    // Handle published status
    if (articleData.published !== undefined) {
      const currentArticle = await this.prisma.article.findUnique({
        where: { id },
      });

      if (articleData.published && !currentArticle?.published) {
        articleData['publishedAt'] = new Date();
      } else if (!articleData.published) {
        articleData['publishedAt'] = null;
      }
    }

    // Update article with tags
    const article = await this.prisma.article.update({
      where: { id }, data: articleData
    });

    return this.formatArticleResponse(article);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.article.delete({
      where: { id },
    });

    return { message: 'Article deleted successfully' };
  }

  private formatArticleResponse(article: any) {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
      published: article.published,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    
     
    };
  }
}
