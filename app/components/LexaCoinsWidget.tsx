"use client";

import { useState, useEffect } from "react";
import { Coins, TrendingUp, AlertCircle, Plus } from "lucide-react";
import api from "../lib/api-client";

interface LexaCoinsWidgetProps {
    organizationId: string;
}

export default function LexaCoinsWidget({ organizationId }: LexaCoinsWidgetProps) {
    const [balance, setBalance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);

    const loadBalance = async () => {
        try {
            setLoading(true);
            const response = await api.lexaCoins.getBalance(organizationId);
            if (response.success) {
                setBalance(response.data);
            }
        } catch (error) {
            console.error("Erro ao carregar saldo LEXA-COINS:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (organizationId) {
            loadBalance();
        }
    }, [organizationId]);

    const handleRequestRecharge = async (amount: number) => {
        try {
            const response = await api.lexaCoins.requestRecharge(organizationId, amount);
            if (response.success) {
                alert(response.message);
                setShowRechargeModal(false);
                setSelectedPackage(null);
            }
        } catch (error) {
            console.error("Erro ao solicitar recarga:", error);
            alert("Erro ao solicitar recarga. Tente novamente.");
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#12121d] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
        );
    }

    if (!balance) return null;

    const percentage = balance.percentage;
    const isLow = percentage < 20;
    const isCritical = percentage < 10;

    return (
        <>
            <div className="bg-white dark:bg-[#12121d] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                            <Coins className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">LEXA-COINS</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Disponível</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRechargeModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors text-sm font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Recarregar
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            {balance.balance.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-gray-400 text-sm font-medium">
                            / {balance.limit.toLocaleString('pt-BR')}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        <span>{balance.used.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} usados</span>
                        <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-indigo-600'
                                }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Alert */}
                {isLow && (
                    <div className={`flex items-start gap-3 p-3 rounded-xl mb-4 ${isCritical
                        ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/20'
                        : 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-900/20'
                        }`}>
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">
                            {isCritical
                                ? 'Seu saldo está crítico! Solicite uma recarga para evitar interrupções.'
                                : 'Seu saldo está baixo. Considere recarregar em breve.'}
                        </span>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase">Status</p>
                        </div>
                        <p className={`text-sm font-bold ${isCritical ? 'text-red-500' : isLow ? 'text-yellow-500' : 'text-emerald-500'
                            }`}>
                            {isCritical ? 'Crítico' : isLow ? 'Baixo' : 'Normal'}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <Coins className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase">Previsão</p>
                        </div>
                        <p className="text-gray-900 dark:text-white text-sm font-bold">
                            {percentage > 90 ? '< 2 dias' : 'Normal'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recharge Modal */}
            {showRechargeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
                    <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 transform transition-all scale-100">
                        {selectedPackage ? (
                            // Confirmation View
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Coins className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Confirmar Recarga
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Você está solicitando o seguinte pacote:
                                    </p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">Pacote</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedPackage.label}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">Quantidade</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{(selectedPackage.amount / 1000).toFixed(0)}k LEXA-COINS</span>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2 flex justify-between items-center">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">Valor Total</span>
                                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{selectedPackage.price}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleRequestRecharge(selectedPackage.amount)}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Confirmar Solicitação
                                    </button>
                                    <button
                                        onClick={() => setSelectedPackage(null)}
                                        className="w-full py-3 bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
                                    >
                                        Voltar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Selection View
                            <>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Solicitar Recarga
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                    Escolha o melhor pacote para sua organização.
                                </p>

                                <div className="space-y-3 mb-6">
                                    {[
                                        { amount: 5000, label: 'Básico', price: 'R$ 206,25' },
                                        { amount: 10000, label: 'Profissional', price: 'R$ 412,50', popular: true },
                                        { amount: 20000, label: 'Enterprise', price: 'R$ 825,00' },
                                    ].map((pkg) => (
                                        <button
                                            key={pkg.amount}
                                            onClick={() => setSelectedPackage(pkg)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all text-left group hover:shadow-md ${pkg.popular
                                                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-gray-800'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            {pkg.label}
                                                        </span>
                                                        {pkg.popular && (
                                                            <span className="text-[10px] uppercase font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                                Popular
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {(pkg.amount / 1000).toFixed(0)}.000 LEXA-COINS
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                                        {pkg.price}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowRechargeModal(false)}
                                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
