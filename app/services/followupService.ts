// Enhanced Follow-up Service with Business Hours, AI Decisions, Specific Time, and Media Support

import { prisma } from '@/app/lib/prisma';
import { textToSpeech } from './elevenLabsService';

// Check if current time is within business hours
function isWithinBusinessHours(workingHours: any): boolean {
    const now = new Date();
    const dayOfWeek = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][now.getDay()];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const dayConfig = workingHours[dayOfWeek];
    if (!dayConfig || !dayConfig.enabled) return false;

    const [startHour, startMin] = dayConfig.start.split(':').map(Number);
    const [endHour, endMin] = dayConfig.end.split(':').map(Number);

    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
}

// Calculate next business hour
function getNextBusinessHour(workingHours: any, specificHour?: number, specificMinute?: number): Date {
    const now = new Date();
    let checkDate = new Date(now);

    if (specificHour !== undefined && specificMinute !== undefined) {
        checkDate.setHours(specificHour, specificMinute, 0, 0);
        if (checkDate <= now) checkDate.setDate(checkDate.getDate() + 1);
    }

    for (let i = 0; i < 14; i++) {
        const dayOfWeek = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][checkDate.getDay()];
        const dayConfig = workingHours[dayOfWeek];

        if (dayConfig && dayConfig.enabled) {
            const [startHour, startMin] = dayConfig.start.split(':').map(Number);

            if (specificHour !== undefined) {
                if (checkDate.getHours() >= startHour) return checkDate;
            } else {
                checkDate.setHours(startHour, startMin, 0, 0);
                if (checkDate > now) return checkDate;
            }
        }

        checkDate.setDate(checkDate.getDate() + 1);
        if (specificHour !== undefined) {
            checkDate.setHours(specificHour, specificMinute || 0, 0, 0);
        }
    }

    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

// Check if AI decides follow-up is needed
async function shouldSendFollowupByAI(lastMessage: string, aiDecisionPrompt: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: aiDecisionPrompt || 'Avalie se a última mensagem do chatbot requer um follow-up. Responda apenas "sim" ou "não".',
                    },
                    {
                        role: 'user',
                        content: `Última mensagem: "${lastMessage}"\n\nPrecisa de follow-up?`,
                    },
                ],
                max_tokens: 10,
            }),
        });

        const data = await response.json();
        const decision = data.choices[0].message.content.toLowerCase();
        return decision.includes('sim') || decision.includes('yes');
    } catch (error) {
        console.error('Error in AI follow-up decision:', error);
        return true;
    }
}

// Send follow-up message
async function sendFollowupMessage(
    phone: string,
    message: string,
    mediaType: string,
    mediaUrl: string | null,
    audioVoiceId: string | null,
    evolutionApiUrl: string,
    evolutionApiKey: string,
    instanceName: string
) {
    if (mediaType === 'audio') {
        const audioBuffer = await textToSpeech(message, audioVoiceId || undefined);
        const base64Audio = audioBuffer.toString('base64');

        await fetch(`${evolutionApiUrl}/message/sendWhatsAppAudio/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: evolutionApiKey,
            },
            body: JSON.stringify({
                number: phone,
                audioBase64: base64Audio,
            }),
        });
    } else if (mediaType === 'image' && mediaUrl) {
        await fetch(`${evolutionApiUrl}/message/sendMedia/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: evolutionApiKey,
            },
            body: JSON.stringify({
                number: phone,
                mediatype: 'image',
                media: mediaUrl,
                caption: message,
            }),
        });
    } else {
        await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: evolutionApiKey,
            },
            body: JSON.stringify({
                number: phone,
                text: message,
            }),
        });
    }
}

// Main function to check and send follow-ups
export async function checkAndSendFollowups() {
    try {
        const followups = await prisma.followup.findMany({
            where: { isActive: true },
            include: {
                agent: {
                    include: {
                        organization: true,
                    },
                },
            },
        });

        for (const followup of followups) {
            const { agent } = followup;
            const organization = agent.organization;

            const inactiveLeads = await prisma.lead.findMany({
                where: {
                    agentId: agent.id,
                    status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
                    updatedAt: {
                        lt: new Date(Date.now() - followup.delayHours * 60 * 60 * 1000),
                    },
                },
                include: {
                    conversations: {
                        include: {
                            messages: {
                                orderBy: { timestamp: 'desc' },
                                take: 1,
                            },
                        },
                        orderBy: { updatedAt: 'desc' },
                        take: 1,
                    },
                },
            });

            for (const lead of inactiveLeads) {
                const recentFollowup = await prisma.followupLog.findFirst({
                    where: {
                        leadId: lead.id,
                        followupId: followup.id,
                        sentAt: {
                            gt: new Date(Date.now() - followup.delayHours * 60 * 60 * 1000),
                        },
                    },
                });

                if (recentFollowup) continue;

                // AI Decision check
                if (followup.aiDecisionEnabled && lead.conversations[0]?.messages[0]) {
                    const lastMessage = lead.conversations[0].messages[0].content;
                    const shouldSend = await shouldSendFollowupByAI(
                        lastMessage,
                        followup.aiDecisionPrompt || ''
                    );
                    if (!shouldSend) continue;
                }

                // Business hours check
                if (followup.respectBusinessHours && agent.workingHours) {
                    if (!isWithinBusinessHours(agent.workingHours)) {
                        const nextBusinessHour = getNextBusinessHour(
                            agent.workingHours,
                            followup.specificHour || undefined,
                            followup.specificMinute || undefined
                        );

                        if (nextBusinessHour > new Date()) continue;
                    }
                }

                // Specific time check
                if (followup.specificTimeEnabled) {
                    const now = new Date();
                    const targetHour = followup.specificHour || 9;
                    const targetMinute = followup.specificMinute || 0;

                    if (now.getHours() !== targetHour || now.getMinutes() < targetMinute) {
                        continue;
                    }
                }

                // Replace variables in message
                let message = followup.message
                    .replace(/{lead\.name}/g, lead.name || 'Cliente')
                    .replace(/{lead\.phone}/g, lead.phone || '')
                    .replace(/{lead\.email}/g, lead.email || '');

                // Send follow-up
                await sendFollowupMessage(
                    lead.phone,
                    message,
                    followup.mediaType,
                    followup.mediaUrl,
                    followup.audioVoiceId,
                    organization.evolutionApiUrl!,
                    organization.evolutionApiKey!,
                    organization.evolutionInstanceName!
                );

                // Log follow-up
                await prisma.followupLog.create({
                    data: {
                        leadId: lead.id,
                        followupId: followup.id,
                        message,
                    },
                });

                console.log(`Follow-up sent to ${lead.phone} (${followup.name})`);
            }
        }
    } catch (error) {
        console.error('Error in checkAndSendFollowups:', error);
    }
}
