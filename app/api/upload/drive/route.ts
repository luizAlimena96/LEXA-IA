import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        // Validate file type
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 });
        }

        // Validate file size
        const maxSize = file.type.startsWith('image/') ? 16 * 1024 * 1024 : 20 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({
                error: `Arquivo muito grande. Máximo: ${file.type.startsWith('image/') ? '16MB' : '20MB'}`
            }, { status: 400 });
        }

        // TODO: Implement Google Drive upload
        // For now, return a placeholder URL
        // You'll need to:
        // 1. Set up Google Drive API credentials
        // 2. Upload file to Google Drive
        // 3. Get shareable link
        // 4. Return the link

        // Placeholder implementation
        const fileName = `${Date.now()}-${file.name}`;
        const placeholderUrl = `https://drive.google.com/file/d/PLACEHOLDER_${fileName}/view`;

        return NextResponse.json({
            url: placeholderUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
    }
}
