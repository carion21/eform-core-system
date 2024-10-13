/*
  Warnings:

  - You are about to alter the column `deletedAt` on the `Field` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `FieldType` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `Form` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the column `bottlesDistributed` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `drinkRacks` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `peopleToReach` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `salesPointToReach` on the `Project` table. All the data in the column will be lost.
  - You are about to alter the column `deletedAt` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `Team` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `Field` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `FieldType` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `Form` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `Project` DROP COLUMN `bottlesDistributed`,
    DROP COLUMN `drinkRacks`,
    DROP COLUMN `peopleToReach`,
    DROP COLUMN `salesPointToReach`,
    MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `Team` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `deletedAt` DATETIME NULL;

-- CreateTable
CREATE TABLE `Kpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiByTeam` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teamId` INTEGER NOT NULL,
    `kpiId` INTEGER NOT NULL,
    `value` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KpiByTeam` ADD CONSTRAINT `KpiByTeam_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiByTeam` ADD CONSTRAINT `KpiByTeam_kpiId_fkey` FOREIGN KEY (`kpiId`) REFERENCES `Kpi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
