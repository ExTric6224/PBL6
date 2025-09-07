-- DropForeignKey
ALTER TABLE `schedule` DROP FOREIGN KEY `Schedule_mentorId_fkey`;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_mentorId_fkey` FOREIGN KEY (`mentorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
