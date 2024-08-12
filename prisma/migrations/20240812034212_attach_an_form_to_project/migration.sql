/*
  Warnings:

  - You are about to alter the column `deletedAt` on the `Field` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `FieldType` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `Form` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `Team` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `deletedAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `Field` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `FieldType` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `Form` ADD COLUMN `projectId` INTEGER NULL,
    MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `Project` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `Team` MODIFY `deletedAt` DATETIME NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `deletedAt` DATETIME NULL;

-- AddForeignKey
ALTER TABLE `Form` ADD CONSTRAINT `Form_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
