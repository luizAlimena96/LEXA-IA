'use client';

import { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import {
    parseAgentCSV,
    validateParsedData,
    type ParsedData,
    type ValidationResult
} from '../../lib/csvParser';

interface ImportTabProps {
    organizationId: string;
    onImportComplete: () => void;
}

export default function ImportTab({ organizationId, onImportComplete }: ImportTabProps) {
    const { addToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [importResult, setImportResult] = useState<any | null>(null);

    const handleDownloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/csv-templates/agente-completo.csv';
        link.download = 'agente-completo.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Template baixado com sucesso!', 'success');
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            addToast('Por favor, selecione um arquivo CSV', 'error');
            return;
        }

        setFile(selectedFile);
        setParsedData(null);
        setValidation(null);
        setImportResult(null);

        // Parse file
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            try {
                const parsed = parseAgentCSV(content);
                const validated = validateParsedData(parsed);

                setParsedData(parsed);
                setValidation(validated);

                if (validated.valid) {
                    addToast('Arquivo validado com sucesso!', 'success');
                } else {
                    addToast(`Encontrados ${validated.errors.length} erros no arquivo`, 'error');
                }
            } catch (error) {
                addToast('Erro ao processar arquivo CSV', 'error');
                console.error(error);
            }
        };
        reader.readAsText(selectedFile);
    };

    const handleImport = async () => {
        if (!parsedData || !validation?.valid) {
            addToast('Corrija os erros antes de importar', 'error');
            return;
        }

        try {
            setImporting(true);
            setProgress(0);

            const response = await fetch('/api/agents/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: parsedData,
                    organizationId
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao importar dados');
            }

            const result = await response.json();
            setImportResult(result);
            setProgress(100);

            addToast('Importação concluída com sucesso!', 'success');

            // Reset after 2 seconds
            setTimeout(() => {
                onImportComplete();
            }, 2000);

        } catch (error: any) {
            addToast(error.message || 'Erro ao importar dados', 'error');
            console.error(error);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Step 1: Download Template */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">1</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Baixar Template CSV
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Baixe o arquivo modelo e preencha com os dados do seu agente.
                            O template inclui exemplos e instruções para cada campo.
                        </p>
                        <button
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download agente-completo.csv
                        </button>
                    </div>
                </div>
            </div>

            {/* Step 2: Upload File */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">2</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Fazer Upload do Arquivo
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Selecione o arquivo CSV preenchido para visualizar e validar os dados.
                        </p>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                                {file ? (
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Clique para selecionar ou arraste o arquivo
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Apenas arquivos CSV
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Validation Results */}
                        {validation && (
                            <div className="mt-4 space-y-3">
                                {validation.valid ? (
                                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">Arquivo validado com sucesso!</span>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-red-700 mb-2">
                                            <XCircle className="w-5 h-5" />
                                            <span className="font-medium">
                                                {validation.errors.length} erro(s) encontrado(s)
                                            </span>
                                        </div>
                                        <ul className="space-y-1 text-sm text-red-600">
                                            {validation.errors.map((error, index) => (
                                                <li key={index}>
                                                    <strong>[{error.section}]</strong> Linha {error.row}, campo "{error.field}": {error.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {validation.warnings.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-yellow-700 mb-2">
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="font-medium">Avisos</span>
                                        </div>
                                        <ul className="space-y-1 text-sm text-yellow-600">
                                            {validation.warnings.map((warning, index) => (
                                                <li key={index}>{warning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Data Preview */}
                        {parsedData && (
                            <div className="mt-6 space-y-4">
                                <h4 className="font-semibold text-gray-900">Preview dos Dados:</h4>

                                {parsedData.agent && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h5 className="font-medium text-gray-700 mb-2">Agente</h5>
                                        <p className="text-sm text-gray-600">
                                            <strong>Nome:</strong> {parsedData.agent.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Descrição:</strong> {parsedData.agent.description}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {parsedData.knowledge.length}
                                        </p>
                                        <p className="text-sm text-blue-700">Conhecimentos</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-600">
                                            {parsedData.followups.length}
                                        </p>
                                        <p className="text-sm text-green-700">Follow-ups</p>
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-orange-600">
                                            {parsedData.reminders.length}
                                        </p>
                                        <p className="text-sm text-orange-700">Lembretes</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Step 3: Import */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">3</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Importar Dados
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Confirme e importe todos os dados do agente para o sistema.
                        </p>

                        <button
                            onClick={handleImport}
                            disabled={!validation?.valid || importing}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <FileText className="w-5 h-5" />
                            {importing ? 'Importando...' : 'Importar Agente Completo'}
                        </button>

                        {/* Progress Bar */}
                        {importing && (
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Importando dados... {progress}%
                                </p>
                            </div>
                        )}

                        {/* Import Result */}
                        {importResult && (
                            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-green-700 mb-3">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Importação Concluída!</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Agente: <strong className="text-green-700">Criado</strong></p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">
                                            Conhecimentos: <strong className="text-green-700">
                                                {importResult.report?.knowledge?.created || 0}
                                            </strong>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">
                                            Follow-ups: <strong className="text-green-700">
                                                {importResult.report?.followups?.created || 0}
                                            </strong>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">
                                            Lembretes: <strong className="text-green-700">
                                                {importResult.report?.reminders?.created || 0}
                                            </strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
