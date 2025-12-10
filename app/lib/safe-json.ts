// Utility: Safe JSON Parser
// Protege contra JSON mal formatado que pode travar o Node

export function safeJSONParse<T = any>(
    jsonString: string,
    fallback: T | null = null,
    logError = true
): T | null {
    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        if (logError) {
            console.error('[Safe JSON Parse] Erro ao parsear JSON:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                jsonString: jsonString.substring(0, 200), // Primeiros 200 chars
                length: jsonString.length,
            });
        }
        return fallback;
    }
}

export function safeJSONStringify(
    obj: any,
    fallback: string = '{}',
    logError = true
): string {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        if (logError) {
            console.error('[Safe JSON Stringify] Erro ao stringificar objeto:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                objectType: typeof obj,
            });
        }
        return fallback;
    }
}

// Validar se uma string é JSON válido
export function isValidJSON(jsonString: string): boolean {
    try {
        JSON.parse(jsonString);
        return true;
    } catch {
        return false;
    }
}

// Limpar escapes inválidos de uma string
export function cleanInvalidEscapes(str: string): string {
    // Remove escapes numéricos inválidos como \159
    let cleaned = str.replace(/\\([0-9]{3})/g, '\\\\$1');

    // Corrige quebras de linha
    cleaned = cleaned.replace(/\n/g, '\\n');
    cleaned = cleaned.replace(/\r/g, '\\r');
    cleaned = cleaned.replace(/\t/g, '\\t');

    return cleaned;
}

// Exemplo de uso:
// const data = safeJSONParse(suspectString, { default: 'value' });
// if (data) {
//     // Usar data
// }
