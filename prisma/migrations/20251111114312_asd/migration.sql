/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `user_stories` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `user_stories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_stories" DROP COLUMN "imageUrl",
DROP COLUMN "published",
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text';
