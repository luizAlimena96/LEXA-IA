import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { convertRoutesToObjects, type ParsedData } from '@/app/lib/csvParser';
import { Prisma } from '@prisma/client';

interface ImportReport {
    agent: { created: boolean; id?: string };
    knowledge: { created: number; failed: number; errors: string[] };
    states: { created: number; failed: number; errors: string[] };
    followups: { created: number; failed: number; errors: string[] };
    reminders: { created: number; failed: number; errors: string[] };
}

// POST /api/agents/import
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { data, organizationId: reqOrgId } = body as { data: ParsedData; organizationId: string };

        const organizationId = user.role === 'SUPER_ADMIN' && reqOrgId ? reqOrgId : user.organizationId;
        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }

        if (!data || !data.agent) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
        }

        const report: ImportReport = {
            agent: { created: false },
            knowledge: { created: 0, failed: 0, errors: [] },
            states: { created: 0, failed: 0, errors: [] },
            followups: { created: 0, failed: 0, errors: [] },
            reminders: { created: 0, failed: 0, errors: [] }
        };

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const agent = await tx.agent.create({
                data: {
                    name: data.agent!.name,
                    description: data.agent!.description,
                    tone: data.agent!.tone,
                    language: data.agent!.language,
                    responseDelay: data.agent!.responseDelay,
                    writingStyle: data.agent!.writingStyle,
                    prohibitions: data.agent!.prohibitions,
                    dataCollectionInstructions: data.agent!.dataCollectionInstructions,
                    followupDecisionPrompt: data.agent!.followupDecisionPrompt,
                    notificationPhones: data.agent!.notificationPhones || [],
                    isActive: false,
                    instance: `${data.agent!.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                    userId: user.id,
                    organizationId
                }
            });

            report.agent = { created: true, id: agent.id };

            // 2. Create Knowledge
            for (const knowledge of data.knowledge) {
                try {
                    await tx.knowledge.create({
                        data: {
                            title: knowledge.title,
                            type: knowledge.type,
                            content: knowledge.content,
                            agentId: agent.id,
                            organizationId
                        }
                    });
                    report.knowledge.created++;
                } catch (error: any) {
                    report.knowledge.failed++;
                    report.knowledge.errors.push(`${knowledge.title}: ${error.message}`);
                }
            }

            // 3. Create States
            const stateMap = new Map<string, string>(); // name -> id

            for (const state of data.matrix) {
                try {
                    const createdState = await tx.state.create({
                        data: {
                            name: state.name,
                            missionPrompt: state.missionPrompt,
                            mediaTiming: state.mediaTiming,
                            responseType: state.responseType,
                            tools: state.tools,
                            crmStatus: state.crmStatus,
                            dataKey: state.dataKey,
                            dataDescription: state.dataDescription,
                            dataType: state.dataType,
                            availableRoutes: [], // Will be updated after all states are created
                            agentId: agent.id,
                            organizationId
                        }
                    });
                    stateMap.set(state.name, createdState.id);
                    report.states.created++;
                } catch (error: any) {
                    report.states.failed++;
                    report.states.errors.push(`${state.name}: ${error.message}`);
                }
            }

            // 4. Update routes after all states are created
            for (const state of data.matrix) {
                if (state.routes) {
                    const stateId = stateMap.get(state.name);
                    if (stateId) {
                        const routes = convertRoutesToObjects(state.routes, stateMap);
                        await tx.state.update({
                            where: { id: stateId },
                            data: { availableRoutes: routes }
                        });
                    }
                }
            }

            // 5. Set initial state (first state or create default)
            let initialStateId: string;
            if (data.matrix.length > 0) {
                initialStateId = stateMap.get(data.matrix[0].name)!;
            } else {
                // Create default initial state
                const defaultState = await tx.state.create({
                    data: {
                        name: 'Início',
                        missionPrompt: 'Cumprimente o cliente e pergunte como pode ajudar.',
                        mediaTiming: 'AFTER',
                        responseType: 'TEXT',
                        availableRoutes: [],
                        agentId: agent.id,
                        organizationId
                    }
                });
                initialStateId = defaultState.id;
                stateMap.set('Início', defaultState.id);
            }

            await tx.agent.update({
                where: { id: agent.id },
                data: { initialStateId }
            });

            // 6. Create Follow-ups
            for (const followup of data.followups) {
                try {
                    // Convert state name to ID
                    const matrixStageId = stateMap.get(followup.matrixStageId);
                    if (!matrixStageId) {
                        throw new Error(`Estado "${followup.matrixStageId}" não encontrado`);
                    }

                    const conditionStateId = followup.conditionStateId
                        ? stateMap.get(followup.conditionStateId)
                        : undefined;

                    await tx.followup.create({
                        data: {
                            name: followup.name,
                            condition: followup.conditionValue || `${followup.conditionType}`,
                            message: followup.message,
                            delayHours: followup.delayHours,
                            delayMinutes: followup.delayMinutes,
                            isActive: true,
                            respectBusinessHours: followup.respectBusinessHours,
                            matrixStageId,
                            mediaType: followup.mediaType,
                            specificTimeEnabled: followup.specificTimeEnabled,
                            specificHour: followup.specificHour,
                            specificMinute: followup.specificMinute,
                            agentId: agent.id,
                            organizationId
                        }
                    });
                    report.followups.created++;
                } catch (error: any) {
                    report.followups.failed++;
                    report.followups.errors.push(`${followup.name}: ${error.message}`);
                }
            }

            // 7. Create Reminders
            for (const reminder of data.reminders) {
                try {
                    await tx.reminder.create({
                        data: {
                            title: reminder.title,
                            message: reminder.message,
                            scheduledFor: new Date(reminder.scheduledFor),
                            recipients: reminder.recipients.split(',').map(r => r.trim()),
                            isActive: true,
                            mediaType: reminder.mediaType,
                            advanceTime: reminder.advanceTime,
                            agentId: agent.id,
                            organizationId
                        }
                    });
                    report.reminders.created++;
                } catch (error: any) {
                    report.reminders.failed++;
                    report.reminders.errors.push(`${reminder.title}: ${error.message}`);
                }
            }

            return { agentId: agent.id, report };
        });

        return NextResponse.json({
            success: true,
            agentId: result.agentId,
            report: result.report
        });

    } catch (error) {
        return handleError(error);
    }
}
