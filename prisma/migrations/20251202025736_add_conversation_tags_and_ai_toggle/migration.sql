-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConversationTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ConversationTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "tags_organizationId_idx" ON "tags"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_organizationId_name_key" ON "tags"("organizationId", "name");

-- CreateIndex
CREATE INDEX "_ConversationTags_B_index" ON "_ConversationTags"("B");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConversationTags" ADD CONSTRAINT "_ConversationTags_A_fkey" FOREIGN KEY ("A") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConversationTags" ADD CONSTRAINT "_ConversationTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
