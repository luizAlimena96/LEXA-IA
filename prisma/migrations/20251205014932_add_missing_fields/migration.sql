/*
  Warnings:

  - You are about to drop the column `notificationPhone` on the `agents` table. All the data in the column will be lost.
  - Added the required column `data` to the `matrix_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataExtraction` to the `matrix_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matrixFlow` to the `matrix_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personality` to the `matrix_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prohibitions` to the `matrix_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduling` to the `matrix_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `writing` to the `matrix_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "FeedbackStatus" ADD VALUE 'RESPONDED';

-- AlterTable
ALTER TABLE "agents" DROP COLUMN "notificationPhone",
ADD COLUMN     "dataCollectionInstructions" TEXT,
ADD COLUMN     "followupDecisionPrompt" TEXT,
ADD COLUMN     "followupHours" JSONB,
ADD COLUMN     "initialStateId" TEXT,
ADD COLUMN     "messageBufferDelayMs" INTEGER NOT NULL DEFAULT 2000,
ADD COLUMN     "messageBufferEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "messageBufferMaxSize" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "notificationPhones" TEXT[],
ADD COLUMN     "prohibitions" TEXT,
ADD COLUMN     "responseDelay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "writingStyle" TEXT;

-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "respondedBy" TEXT;

-- AlterTable
ALTER TABLE "followups" ADD COLUMN     "delayMinutes" INTEGER DEFAULT 0,
ADD COLUMN     "matrixStageId" TEXT;

-- AlterTable
ALTER TABLE "matrix_items" ADD COLUMN     "data" TEXT NOT NULL,
ADD COLUMN     "dataExtraction" TEXT NOT NULL,
ADD COLUMN     "matrixFlow" TEXT NOT NULL,
ADD COLUMN     "personality" TEXT NOT NULL,
ADD COLUMN     "prohibitions" TEXT NOT NULL,
ADD COLUMN     "scheduling" TEXT NOT NULL,
ADD COLUMN     "writing" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "thought" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleCalendarId" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleTokenExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "advanceTime" INTEGER,
ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT 'text';

-- AlterTable
ALTER TABLE "states" ADD COLUMN     "dataCollections" JSONB,
ADD COLUMN     "matrixItemId" TEXT,
ADD COLUMN     "mediaTiming" TEXT,
ADD COLUMN     "prohibitions" TEXT,
ADD COLUMN     "responseType" TEXT;

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "attendees" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_slots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crmType" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authType" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_automations" (
    "id" TEXT NOT NULL,
    "crmConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "actions" JSONB NOT NULL,
    "agentStateId" TEXT,
    "description" TEXT,
    "matrixItemId" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'STATE_CHANGE',
    "delayMinutes" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "crm_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_logs" (
    "id" TEXT NOT NULL,
    "automationId" TEXT,
    "agentFollowUpId" TEXT,
    "conversationId" TEXT NOT NULL,
    "leadMessageId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_followups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentStateId" TEXT,
    "matrixItemId" TEXT,
    "triggerMode" TEXT NOT NULL DEFAULT 'TIMER',
    "delayMinutes" INTEGER,
    "scheduledTime" TEXT,
    "messageTemplate" TEXT NOT NULL,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "businessHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "businessHoursStart" TEXT,
    "businessHoursEnd" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_notifications" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentStateId" TEXT,
    "matrixItemId" TEXT,
    "leadMessage" TEXT,
    "teamMessage" TEXT,
    "teamPhones" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_googleEventId_key" ON "calendar_events"("googleEventId");

-- CreateIndex
CREATE INDEX "calendar_events_organizationId_idx" ON "calendar_events"("organizationId");

-- CreateIndex
CREATE INDEX "calendar_events_startTime_endTime_idx" ON "calendar_events"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "calendar_events_organizationId_startTime_idx" ON "calendar_events"("organizationId", "startTime");

-- CreateIndex
CREATE INDEX "blocked_slots_organizationId_idx" ON "blocked_slots"("organizationId");

-- CreateIndex
CREATE INDEX "blocked_slots_startTime_endTime_idx" ON "blocked_slots"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "crm_configs_organizationId_idx" ON "crm_configs"("organizationId");

-- CreateIndex
CREATE INDEX "crm_automations_crmConfigId_idx" ON "crm_automations"("crmConfigId");

-- CreateIndex
CREATE INDEX "crm_automations_agentStateId_idx" ON "crm_automations"("agentStateId");

-- CreateIndex
CREATE INDEX "crm_automations_matrixItemId_idx" ON "crm_automations"("matrixItemId");

-- CreateIndex
CREATE UNIQUE INDEX "automation_logs_automationId_conversationId_leadMessageId_key" ON "automation_logs"("automationId", "conversationId", "leadMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "automation_logs_agentFollowUpId_conversationId_leadMessageI_key" ON "automation_logs"("agentFollowUpId", "conversationId", "leadMessageId");

-- CreateIndex
CREATE INDEX "agent_followups_agentId_idx" ON "agent_followups"("agentId");

-- CreateIndex
CREATE INDEX "agent_followups_agentStateId_idx" ON "agent_followups"("agentStateId");

-- CreateIndex
CREATE INDEX "agent_followups_matrixItemId_idx" ON "agent_followups"("matrixItemId");

-- CreateIndex
CREATE INDEX "agent_notifications_agentId_idx" ON "agent_notifications"("agentId");

-- CreateIndex
CREATE INDEX "agent_notifications_agentStateId_idx" ON "agent_notifications"("agentStateId");

-- CreateIndex
CREATE INDEX "agent_notifications_matrixItemId_idx" ON "agent_notifications"("matrixItemId");

-- CreateIndex
CREATE INDEX "feedback_conversationId_idx" ON "feedback"("conversationId");

-- CreateIndex
CREATE INDEX "feedback_organizationId_idx" ON "feedback"("organizationId");

-- CreateIndex
CREATE INDEX "states_matrixItemId_idx" ON "states"("matrixItemId");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_slots" ADD CONSTRAINT "blocked_slots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_matrixItemId_fkey" FOREIGN KEY ("matrixItemId") REFERENCES "matrix_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_configs" ADD CONSTRAINT "crm_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_automations" ADD CONSTRAINT "crm_automations_agentStateId_fkey" FOREIGN KEY ("agentStateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_automations" ADD CONSTRAINT "crm_automations_crmConfigId_fkey" FOREIGN KEY ("crmConfigId") REFERENCES "crm_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_automations" ADD CONSTRAINT "crm_automations_matrixItemId_fkey" FOREIGN KEY ("matrixItemId") REFERENCES "matrix_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_agentFollowUpId_fkey" FOREIGN KEY ("agentFollowUpId") REFERENCES "agent_followups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "crm_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_followups" ADD CONSTRAINT "agent_followups_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_followups" ADD CONSTRAINT "agent_followups_agentStateId_fkey" FOREIGN KEY ("agentStateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_followups" ADD CONSTRAINT "agent_followups_matrixItemId_fkey" FOREIGN KEY ("matrixItemId") REFERENCES "matrix_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_notifications" ADD CONSTRAINT "agent_notifications_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_notifications" ADD CONSTRAINT "agent_notifications_agentStateId_fkey" FOREIGN KEY ("agentStateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_notifications" ADD CONSTRAINT "agent_notifications_matrixItemId_fkey" FOREIGN KEY ("matrixItemId") REFERENCES "matrix_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
