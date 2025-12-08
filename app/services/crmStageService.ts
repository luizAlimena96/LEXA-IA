import { prisma } from '@/app/lib/prisma';

export interface CRMStage {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    order: number;
    agentId: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    states?: Array<{
        id: string;
        name: string;
        order: number;
    }>;
}

export interface CreateCRMStageInput {
    name: string;
    description?: string;
    color?: string;
    order?: number;
    stateIds?: string[];
}

export interface UpdateCRMStageInput {
    name?: string;
    description?: string;
    color?: string;
    order?: number;
    stateIds?: string[];
}


export async function getCRMStages(agentId: string): Promise<CRMStage[]> {
    const stages = await prisma.cRMStage.findMany({
        where: { agentId },
        include: {
            states: {
                select: {
                    id: true,
                    name: true,
                    order: true,
                },
                orderBy: { order: 'asc' },
            },
        },
        orderBy: { order: 'asc' },
    });

    return stages;
}

export async function getCRMStage(agentId: string, stageId: string): Promise<CRMStage | null> {
    const stage = await prisma.cRMStage.findFirst({
        where: {
            id: stageId,
            agentId,
        },
        include: {
            states: {
                select: {
                    id: true,
                    name: true,
                    order: true,
                },
                orderBy: { order: 'asc' },
            },
        },
    });

    return stage;
}

export async function createCRMStage(
    agentId: string,
    organizationId: string,
    data: CreateCRMStageInput
): Promise<CRMStage> {
    const { stateIds, ...stageData } = data;

    console.log('[createCRMStage] Creating stage:', { agentId, organizationId, stageName: data.name, stateIds });

    const stage = await prisma.cRMStage.create({
        data: {
            ...stageData,
            agentId,
            organizationId,
            color: data.color || '#6366f1',
            order: data.order ?? 0,
        },
        include: {
            states: {
                select: {
                    id: true,
                    name: true,
                    order: true,
                },
                orderBy: { order: 'asc' },
            },
        },
    });

    console.log('[createCRMStage] Stage created:', { stageId: stage.id, stageName: stage.name });

    if (stateIds && stateIds.length > 0) {
        console.log('[createCRMStage] Assigning states:', stateIds);

        const updateResult = await prisma.state.updateMany({
            where: {
                id: { in: stateIds },
                organizationId,
            },
            data: {
                crmStageId: stage.id,
            },
        });

        console.log('[createCRMStage] States updated:', { count: updateResult.count, expected: stateIds.length });

        const updatedStage = await getCRMStage(agentId, stage.id);
        console.log('[createCRMStage] Fetched updated stage:', {
            stageId: updatedStage?.id,
            statesCount: updatedStage?.states?.length || 0,
            stateNames: updatedStage?.states?.map(s => s.name).join(', ') || 'none'
        });
        return updatedStage!;
    }

    console.log('[createCRMStage] No states to assign');
    return stage;
}

export async function updateCRMStage(
    agentId: string,
    stageId: string,
    data: UpdateCRMStageInput
): Promise<CRMStage> {
    const { stateIds, ...stageData } = data;

    console.log('[updateCRMStage] Updating stage:', { agentId, stageId, stageName: data.name, stateIds });

    const stage = await prisma.cRMStage.update({
        where: {
            id: stageId,
            agentId,
        },
        data: stageData,
        include: {
            states: {
                select: {
                    id: true,
                    name: true,
                    order: true,
                },
                orderBy: { order: 'asc' },
            },
        },
    });

    console.log('[updateCRMStage] Stage updated:', { stageId: stage.id, stageName: stage.name });

    if (stateIds !== undefined) {
        console.log('[updateCRMStage] Updating state assignments. Current stateIds:', stateIds);

        const removeResult = await prisma.state.updateMany({
            where: {
                crmStageId: stageId,
            },
            data: {
                crmStageId: null,
            },
        });

        console.log('[updateCRMStage] Removed states from stage:', { count: removeResult.count });

        if (stateIds.length > 0) {
            // Get organizationId from the stage
            const stage = await prisma.cRMStage.findUnique({
                where: { id: stageId },
                select: { organizationId: true },
            });

            const addResult = await prisma.state.updateMany({
                where: {
                    id: { in: stateIds },
                    organizationId: stage!.organizationId,
                },
                data: {
                    crmStageId: stageId,
                },
            });

            console.log('[updateCRMStage] Assigned new states:', { count: addResult.count, expected: stateIds.length });
        }

        const updatedStage = await getCRMStage(agentId, stageId);
        console.log('[updateCRMStage] Fetched updated stage:', {
            stageId: updatedStage?.id,
            statesCount: updatedStage?.states?.length || 0,
            stateNames: updatedStage?.states?.map(s => s.name).join(', ') || 'none'
        });
        return updatedStage!;
    }

    console.log('[updateCRMStage] No state assignment changes');
    return stage;
}

export async function deleteCRMStage(agentId: string, stageId: string): Promise<void> {
    await prisma.state.updateMany({
        where: {
            crmStageId: stageId,
        },
        data: {
            crmStageId: null,
        },
    });

    await prisma.cRMStage.delete({
        where: {
            id: stageId,
        },
    });
}

export async function reorderCRMStages(
    agentId: string,
    stageOrders: Array<{ id: string; order: number }>
): Promise<void> {
    await Promise.all(
        stageOrders.map((item) =>
            prisma.cRMStage.update({
                where: {
                    id: item.id,
                    agentId,
                },
                data: {
                    order: item.order,
                },
            })
        )
    );
}
