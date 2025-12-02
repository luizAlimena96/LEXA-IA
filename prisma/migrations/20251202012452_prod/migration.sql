/*
  Warnings:

  - You are about to drop the column `date` on the `appointments` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[cpf]` on the table `leads` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `agents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledAt` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `followups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `knowledge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `matrix_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `reminders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('ERROR', 'WARN', 'INFO', 'DEBUG');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'CRM_BLOCKED';

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "allowDynamicDuration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "blockedDates" JSONB,
ADD COLUMN     "bufferTime" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "customTimeWindows" JSONB,
ADD COLUMN     "followupDelay" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "followupEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleCalendarId" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "maxMeetingDuration" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "meetingDuration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "minAdvanceHours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minMeetingDuration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "notificationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationPhone" TEXT,
ADD COLUMN     "notificationTemplate" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "personality" TEXT,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderHours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "reminderMessage" TEXT,
ADD COLUMN     "systemPrompt" TEXT,
ADD COLUMN     "useCustomTimeWindows" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workingHours" JSONB;

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "date",
ADD COLUMN     "crmEventId" TEXT,
ADD COLUMN     "crmSynced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "followups" ADD COLUMN     "aiDecisionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiDecisionPrompt" TEXT,
ADD COLUMN     "audioVoiceId" TEXT,
ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "respectBusinessHours" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specificHour" INTEGER,
ADD COLUMN     "specificMinute" INTEGER,
ADD COLUMN     "specificTimeEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "knowledge" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contractDate" TIMESTAMP(3),
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "currentState" TEXT,
ADD COLUMN     "extractedData" JSONB,
ADD COLUMN     "log" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "zapSignDocumentId" TEXT,
ADD COLUMN     "zapSignSignedAt" TIMESTAMP(3),
ADD COLUMN     "zapSignStatus" TEXT;

-- AlterTable
ALTER TABLE "matrix_items" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "organizationId" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "evolutionApiUrl" TEXT,
    "evolutionApiKey" TEXT,
    "evolutionInstanceName" TEXT,
    "whatsappConnected" BOOLEAN NOT NULL DEFAULT false,
    "whatsappQrCode" TEXT,
    "whatsappPhone" TEXT,
    "whatsappConnectedAt" TIMESTAMP(3),
    "crmEnabled" BOOLEAN NOT NULL DEFAULT false,
    "crmType" TEXT,
    "crmWebhookUrl" TEXT,
    "crmApiKey" TEXT,
    "crmAuthType" TEXT,
    "crmFieldMapping" JSONB,
    "crmCalendarSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "crmCalendarApiUrl" TEXT,
    "crmCalendarApiKey" TEXT,
    "crmCalendarSyncInterval" INTEGER NOT NULL DEFAULT 15,
    "crmCalendarType" TEXT,
    "appointmentWebhookUrl" TEXT,
    "appointmentWebhookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "zapSignApiToken" TEXT,
    "zapSignTemplateId" TEXT,
    "zapSignEnabled" BOOLEAN NOT NULL DEFAULT false,
    "openaiApiKey" TEXT,
    "openaiModel" TEXT DEFAULT 'gpt-4o-mini',
    "elevenLabsApiKey" TEXT,
    "elevenLabsVoiceId" TEXT,
    "elevenLabsModel" TEXT DEFAULT 'eleven_multilingual_v2',

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "missionPrompt" TEXT NOT NULL,
    "availableRoutes" JSONB NOT NULL,
    "dataKey" TEXT,
    "dataDescription" TEXT,
    "dataType" TEXT,
    "mediaId" TEXT,
    "tools" TEXT,
    "crmStatus" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "code" TEXT,
    "stack" TEXT,
    "context" JSONB,
    "userId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_webhooks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" JSONB,
    "bodyTemplate" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_webhook_logs" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "response" JSONB,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_logs" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followup_logs" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "followupId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,

    CONSTRAINT "followup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debug_logs" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "conversationId" TEXT,
    "clientMessage" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "currentState" TEXT,
    "aiThinking" TEXT,
    "organizationId" TEXT,
    "agentId" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debug_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "states_agentId_idx" ON "states"("agentId");

-- CreateIndex
CREATE INDEX "states_organizationId_idx" ON "states"("organizationId");

-- CreateIndex
CREATE INDEX "states_organizationId_agentId_idx" ON "states"("organizationId", "agentId");

-- CreateIndex
CREATE UNIQUE INDEX "states_agentId_name_key" ON "states"("agentId", "name");

-- CreateIndex
CREATE INDEX "error_logs_level_idx" ON "error_logs"("level");

-- CreateIndex
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt");

-- CreateIndex
CREATE INDEX "error_logs_organizationId_idx" ON "error_logs"("organizationId");

-- CreateIndex
CREATE INDEX "crm_webhooks_organizationId_idx" ON "crm_webhooks"("organizationId");

-- CreateIndex
CREATE INDEX "crm_webhooks_event_idx" ON "crm_webhooks"("event");

-- CreateIndex
CREATE INDEX "crm_webhook_logs_webhookId_idx" ON "crm_webhook_logs"("webhookId");

-- CreateIndex
CREATE INDEX "crm_webhook_logs_createdAt_idx" ON "crm_webhook_logs"("createdAt");

-- CreateIndex
CREATE INDEX "crm_webhook_logs_success_idx" ON "crm_webhook_logs"("success");

-- CreateIndex
CREATE INDEX "reminder_logs_scheduledFor_status_idx" ON "reminder_logs"("scheduledFor", "status");

-- CreateIndex
CREATE INDEX "reminder_logs_appointmentId_idx" ON "reminder_logs"("appointmentId");

-- CreateIndex
CREATE INDEX "followup_logs_leadId_idx" ON "followup_logs"("leadId");

-- CreateIndex
CREATE INDEX "followup_logs_sentAt_idx" ON "followup_logs"("sentAt");

-- CreateIndex
CREATE INDEX "debug_logs_phone_idx" ON "debug_logs"("phone");

-- CreateIndex
CREATE INDEX "debug_logs_conversationId_idx" ON "debug_logs"("conversationId");

-- CreateIndex
CREATE INDEX "debug_logs_organizationId_idx" ON "debug_logs"("organizationId");

-- CreateIndex
CREATE INDEX "debug_logs_createdAt_idx" ON "debug_logs"("createdAt");

-- CreateIndex
CREATE INDEX "agents_organizationId_idx" ON "agents"("organizationId");

-- CreateIndex
CREATE INDEX "appointments_leadId_idx" ON "appointments"("leadId");

-- CreateIndex
CREATE INDEX "appointments_organizationId_idx" ON "appointments"("organizationId");

-- CreateIndex
CREATE INDEX "appointments_scheduledAt_idx" ON "appointments"("scheduledAt");

-- CreateIndex
CREATE INDEX "conversations_organizationId_idx" ON "conversations"("organizationId");

-- CreateIndex
CREATE INDEX "conversations_organizationId_leadId_idx" ON "conversations"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "conversations_organizationId_whatsapp_idx" ON "conversations"("organizationId", "whatsapp");

-- CreateIndex
CREATE INDEX "followups_organizationId_idx" ON "followups"("organizationId");

-- CreateIndex
CREATE INDEX "followups_organizationId_isActive_idx" ON "followups"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "followups_organizationId_agentId_idx" ON "followups"("organizationId", "agentId");

-- CreateIndex
CREATE INDEX "knowledge_organizationId_idx" ON "knowledge"("organizationId");

-- CreateIndex
CREATE INDEX "knowledge_organizationId_type_idx" ON "knowledge"("organizationId", "type");

-- CreateIndex
CREATE INDEX "knowledge_organizationId_agentId_idx" ON "knowledge"("organizationId", "agentId");

-- CreateIndex
CREATE UNIQUE INDEX "leads_cpf_key" ON "leads"("cpf");

-- CreateIndex
CREATE INDEX "leads_currentState_idx" ON "leads"("currentState");

-- CreateIndex
CREATE INDEX "leads_organizationId_idx" ON "leads"("organizationId");

-- CreateIndex
CREATE INDEX "leads_organizationId_status_idx" ON "leads"("organizationId", "status");

-- CreateIndex
CREATE INDEX "leads_organizationId_phone_idx" ON "leads"("organizationId", "phone");

-- CreateIndex
CREATE INDEX "leads_organizationId_email_idx" ON "leads"("organizationId", "email");

-- CreateIndex
CREATE INDEX "leads_organizationId_currentState_idx" ON "leads"("organizationId", "currentState");

-- CreateIndex
CREATE INDEX "leads_organizationId_updatedAt_idx" ON "leads"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "matrix_items_organizationId_idx" ON "matrix_items"("organizationId");

-- CreateIndex
CREATE INDEX "matrix_items_organizationId_agentId_idx" ON "matrix_items"("organizationId", "agentId");

-- CreateIndex
CREATE INDEX "reminders_organizationId_idx" ON "reminders"("organizationId");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge" ADD CONSTRAINT "knowledge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrix_items" ADD CONSTRAINT "matrix_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followups" ADD CONSTRAINT "followups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_webhooks" ADD CONSTRAINT "crm_webhooks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_webhook_logs" ADD CONSTRAINT "crm_webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "crm_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followup_logs" ADD CONSTRAINT "followup_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followup_logs" ADD CONSTRAINT "followup_logs_followupId_fkey" FOREIGN KEY ("followupId") REFERENCES "followups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
