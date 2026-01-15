/*
  Warnings:

  - You are about to drop the column `authorId` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the `article_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tags` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `author` to the `articles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."article_tags" DROP CONSTRAINT "article_tags_articleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."article_tags" DROP CONSTRAINT "article_tags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."articles" DROP CONSTRAINT "articles_authorId_fkey";

-- AlterTable
ALTER TABLE "articles" DROP COLUMN "authorId",
ADD COLUMN     "author" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."article_tags";

-- DropTable
DROP TABLE "public"."tags";
