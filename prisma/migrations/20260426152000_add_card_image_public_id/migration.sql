ALTER TABLE `CardImage`
ADD COLUMN `publicId` VARCHAR(191) NULL;

CREATE INDEX `CardImage_publicId_idx` ON `CardImage`(`publicId`);
