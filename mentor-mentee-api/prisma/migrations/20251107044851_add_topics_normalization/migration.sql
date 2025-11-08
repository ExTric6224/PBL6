/*
  Warnings:

  - You are about to drop the column `interests` on the `menteeprofile` table. All the data in the column will be lost.
  - You are about to drop the column `expertise` on the `mentorprofile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `menteeprofile` DROP COLUMN `interests`;

-- AlterTable
ALTER TABLE `mentorprofile` DROP COLUMN `expertise`;

-- CreateTable
CREATE TABLE `Topic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Topic_name_key`(`name`),
    INDEX `Topic_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MenteeTopicInterest` (
    `menteeProfileId` INTEGER NOT NULL,
    `topicId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MenteeTopicInterest_menteeProfileId_idx`(`menteeProfileId`),
    INDEX `MenteeTopicInterest_topicId_idx`(`topicId`),
    PRIMARY KEY (`menteeProfileId`, `topicId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MentorTopicExpertise` (
    `mentorProfileId` INTEGER NOT NULL,
    `topicId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MentorTopicExpertise_mentorProfileId_idx`(`mentorProfileId`),
    INDEX `MentorTopicExpertise_topicId_idx`(`topicId`),
    PRIMARY KEY (`mentorProfileId`, `topicId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MenteeTopicInterest` ADD CONSTRAINT `MenteeTopicInterest_menteeProfileId_fkey` FOREIGN KEY (`menteeProfileId`) REFERENCES `menteeprofile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MenteeTopicInterest` ADD CONSTRAINT `MenteeTopicInterest_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MentorTopicExpertise` ADD CONSTRAINT `MentorTopicExpertise_mentorProfileId_fkey` FOREIGN KEY (`mentorProfileId`) REFERENCES `mentorprofile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MentorTopicExpertise` ADD CONSTRAINT `MentorTopicExpertise_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
