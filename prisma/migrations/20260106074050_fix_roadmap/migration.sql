/*
  Warnings:

  - You are about to drop the `RoadmapStory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoadmapStory" DROP CONSTRAINT "RoadmapStory_roadmapItemId_fkey";

-- DropForeignKey
ALTER TABLE "RoadmapStory" DROP CONSTRAINT "RoadmapStory_storyId_fkey";

-- AlterTable
ALTER TABLE "Epic" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- DropTable
DROP TABLE "RoadmapStory";
