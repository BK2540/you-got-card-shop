-- CreateTable
CREATE TABLE `HomeContent` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `featuredId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HomeContent` ADD CONSTRAINT `HomeContent_featuredId_fkey` FOREIGN KEY (`featuredId`) REFERENCES `Card`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
