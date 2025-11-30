import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorProps {
    message?: string;
    onRetry?: () => void;
}

export default function Error({ message = 'Ocorreu um erro ao carregar os dados', onRetry }: ErrorProps) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ops! Algo deu errado</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <span>Tentar Novamente</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export function ErrorInline({ message }: { message: string }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{message}</p>
        </div>
    );
}
