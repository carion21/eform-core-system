/*
  Warnings:

  - You are about to drop the column `optionnal` on the `Field` table. All the data in the column will be lost.
  - You are about to alter the column `deletedAt` on the `Field` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `FieldType` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `Form` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `Team` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `Field` DROP COLUMN `optionnal`,
    ADD COLUMN `optional` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `FieldType` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `Form` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `Project` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `Team` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `deletedAt` DATETIME NULL;

-- CreateTable
CREATE TABLE `FieldRank` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fieldId` INTEGER NOT NULL,
    `rank` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `formId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FieldRank` ADD CONSTRAINT `FieldRank_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `Field`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FieldRank` ADD CONSTRAINT `FieldRank_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `Form`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
