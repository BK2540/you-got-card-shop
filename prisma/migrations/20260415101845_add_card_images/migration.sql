/*
  Warnings:

  - You are about to drop the column `image` on the `card` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `card` DROP COLUMN `image`;

-- CreateTable
CREATE TABLE `CardImage` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `isHero` BOOLEAN NOT NULL DEFAULT false,
    `cardId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CardImage` ADD CONSTRAINT `CardImage_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
