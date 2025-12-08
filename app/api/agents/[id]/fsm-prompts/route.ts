import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/agents/[id]/fsm-prompts
 * Retorna os prompts FSM customizados do agente
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id: agentId } = await params;

        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            select: {
                id: true,
                name: true,
                fsmDataExtractorPrompt: true,
                fsmStateDeciderPrompt: true,
                fsmValidatorPrompt: true,
            },
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            agentId: agent.id,
            agentName: agent.name,
            prompts: {
                dataExtractor: agent.fsmDataExtractorPrompt,
                stateDecider: agent.fsmStateDeciderPrompt,
                validator: agent.fsmValidatorPrompt,
            },
        });
    } catch (error) {
        console.error('[API] Error fetching FSM prompts:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar prompts FSM' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/agents/[id]/fsm-prompts
 * Atualiza os prompts FSM customizados do agente
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id: agentId } = await params;
        const body = await request.json();
        const { dataExtractor, stateDecider, validator } = body.prompts || {};

        // Validação básica
        if (dataExtractor !== undefined && dataExtractor !== null && typeof dataExtractor !== 'string') {
            return NextResponse.json(
                { error: 'dataExtractor deve ser uma string ou null' },
                { status: 400 }
            );
        }

        if (stateDecider !== undefined && stateDecider !== null && typeof stateDecider !== 'string') {
            return NextResponse.json(
                { error: 'stateDecider deve ser uma string ou null' },
                { status: 400 }
            );
        }

        if (validator !== undefined && validator !== null && typeof validator !== 'string') {
            return NextResponse.json(
                { error: 'validator deve ser uma string ou null' },
                { status: 400 }
            );
        }

        // Atualizar agente
        const updatedAgent = await prisma.agent.update({
            where: { id: agentId },
            data: {
                fsmDataExtractorPrompt: dataExtractor !== undefined ? dataExtractor : undefined,
                fsmStateDeciderPrompt: stateDecider !== undefined ? stateDecider : undefined,
                fsmValidatorPrompt: validator !== undefined ? validator : undefined,
            },
            select: {
                id: true,
                name: true,
                fsmDataExtractorPrompt: true,
                fsmStateDeciderPrompt: true,
                fsmValidatorPrompt: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Prompts FSM atualizados com sucesso',
            agent: {
                id: updatedAgent.id,
                name: updatedAgent.name,
                prompts: {
                    dataExtractor: updatedAgent.fsmDataExtractorPrompt,
                    stateDecider: updatedAgent.fsmStateDeciderPrompt,
                    validator: updatedAgent.fsmValidatorPrompt,
                },
            },
        });
    } catch (error) {
        console.error('[API] Error updating FSM prompts:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar prompts FSM' },
            { status: 500 }
        );
    }
}
