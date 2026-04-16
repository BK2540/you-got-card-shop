-- DropForeignKey
ALTER TABLE `cardimage` DROP FOREIGN KEY `CardImage_cardId_fkey`;

-- AddForeignKey
ALTER TABLE `CardImage` ADD CONSTRAINT `CardImage_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
