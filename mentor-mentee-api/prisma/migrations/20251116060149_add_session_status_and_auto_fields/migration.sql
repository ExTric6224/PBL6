-- AlterTable
ALTER TABLE `session` ADD COLUMN `autoEnded` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `autoStarted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED';

-- CreateIndex
CREATE INDEX `Session_status_idx` ON `session`(`status`);
