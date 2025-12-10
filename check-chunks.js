// Script para investigar chunks de conhecimento
import { prisma } from './app/lib/prisma';

async function main() {
    // Verificar documentos de knowledge
    const knowledge = await prisma.knowledge.findMany({
        select: { id: true, title: true, fileName: true, agentId: true, content: true }
    });

    console.log('\n=== DOCUMENTOS DE CONHECIMENTO ===');
    for (const k of knowledge) {
        console.log('\n--- Documento ---');
        console.log('ID:', k.id);
        console.log('Title:', k.title);
        console.log('FileName:', k.fileName);
        console.log('Agent ID:', k.agentId);
        console.log('Content Preview:', k.content?.substring(0, 500) || 'VAZIO');
    }

    // Query raw para chunks com embedding info
    const chunks = await prisma.$queryRawUnsafe(`
        SELECT 
            id, 
            LEFT(content, 300) as content_preview, 
            "agentId",
            embedding IS NOT NULL as has_embedding
        FROM knowledge_chunks 
        LIMIT 10
    `);

    console.log('\n=== CHUNKS ===');
    console.log(JSON.stringify(chunks, null, 2));
}

main()
    .catch(e => console.error('Erro:', e))
    .finally(() => prisma.$disconnect());
