-- AlterTable
ALTER TABLE "RoadmapItem" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "epicId" INTEGER,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RoadmapStory" (
    "roadmapItemId" INTEGER NOT NULL,
    "storyId" INTEGER NOT NULL,

    CONSTRAINT "RoadmapStory_pkey" PRIMARY KEY ("roadmapItemId","storyId")
);

-- CreateIndex
CREATE INDEX "RoadmapItem_epicId_idx" ON "RoadmapItem"("epicId");

-- AddForeignKey
ALTER TABLE "RoadmapItem" ADD CONSTRAINT "RoadmapItem_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapStory" ADD CONSTRAINT "RoadmapStory_roadmapItemId_fkey" FOREIGN KEY ("roadmapItemId") REFERENCES "RoadmapItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapStory" ADD CONSTRAINT "RoadmapStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
