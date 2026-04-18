-- AlterTable
ALTER TABLE `Card`
  ADD COLUMN `playerName` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `isRecommended` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Card_playerName_idx` ON `Card`(`playerName`);

-- CreateIndex
CREATE INDEX `Card_isRecommended_idx` ON `Card`(`isRecommended`);
