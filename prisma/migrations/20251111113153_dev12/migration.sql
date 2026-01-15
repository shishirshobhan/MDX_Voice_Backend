/*
  Warnings:

  - You are about to drop the column `description` on the `user_stories` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `user_stories` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `user_stories` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `user_stories` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `user_stories` table. All the data in the column will be lost.
  - You are about to drop the column `views` on the `user_stories` table. All the data in the column will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `caption` to the `user_stories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `user_stories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."posts" DROP CONSTRAINT "posts_userId_fkey";

-- AlterTable
ALTER TABLE "user_stories" DROP COLUMN "description",
DROP COLUMN "duration",
DROP COLUMN "thumbnail",
DROP COLUMN "title",
DROP COLUMN "videoUrl",
DROP COLUMN "views",
ADD COLUMN     "caption" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."posts";
