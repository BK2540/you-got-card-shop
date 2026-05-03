-- Store user credentials in the database instead of local filesystem storage.
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'customer',
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Convert money columns to integer minor units (satang).
ALTER TABLE `Card` ADD COLUMN `priceAmount` INTEGER NULL;
UPDATE `Card` SET `priceAmount` = ROUND(`price` * 100);
ALTER TABLE `Card` MODIFY `priceAmount` INTEGER NOT NULL;
ALTER TABLE `Card` DROP COLUMN `price`;

ALTER TABLE `Order` ADD COLUMN `totalAmount` INTEGER NULL,
    ADD COLUMN `shippingAmount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `shippingName` VARCHAR(191) NULL,
    ADD COLUMN `shippingEmail` VARCHAR(191) NULL,
    ADD COLUMN `shippingPhone` VARCHAR(191) NULL,
    ADD COLUMN `shippingAddressLine1` VARCHAR(191) NULL,
    ADD COLUMN `shippingAddressLine2` VARCHAR(191) NULL,
    ADD COLUMN `shippingCity` VARCHAR(191) NULL,
    ADD COLUMN `shippingProvince` VARCHAR(191) NULL,
    ADD COLUMN `shippingPostalCode` VARCHAR(191) NULL,
    ADD COLUMN `shippingCountry` VARCHAR(191) NOT NULL DEFAULT 'Thailand',
    ADD COLUMN `deliveryMethod` VARCHAR(191) NOT NULL DEFAULT 'standard';
UPDATE `Order` SET `totalAmount` = ROUND(`total` * 100);
ALTER TABLE `Order` MODIFY `totalAmount` INTEGER NOT NULL;
ALTER TABLE `Order` DROP COLUMN `total`;

ALTER TABLE `OrderItem` ADD COLUMN `unitPriceAmount` INTEGER NULL;
UPDATE `OrderItem` SET `unitPriceAmount` = ROUND(`unitPrice` * 100);
ALTER TABLE `OrderItem` MODIFY `unitPriceAmount` INTEGER NOT NULL;
ALTER TABLE `OrderItem` DROP COLUMN `unitPrice`;
