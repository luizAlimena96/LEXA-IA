"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import type { DashboardMetrics } from "../types";

interface FunnelChartProps {
    metrics: DashboardMetrics;
}

export default function FunnelChart({ metrics }: FunnelChartProps) {
    const [mode, setMode] = useState<"CRM" | "STATES">("CRM");

    const funnelData = mode === "CRM" ? metrics.crmFunnel : metrics.statesFunnel;
    const totalValue = funnelData?.reduce((acc: number, item: any) => acc + item.value, 0) || 0;

    // Find max value for bar scaling
    const maxValue = funnelData?.reduce((max: number, item: any) => Math.max(max, item.value), 0) || 1;

    return (
        <div className="bg-white dark:bg-[#12121d] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800/50 transition-colors duration-300 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Funil de Vendas
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        {mode === "CRM" ? "Por Etapa" : "Por Estado"}
                    </span>
                </h3>

                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setMode("CRM")}
                        className={`
              px-3 py-1 text-xs font-medium rounded-md transition-all
              ${mode === "CRM"
                                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}
            `}
                    >
                        CRM
                    </button>
                    <button
                        onClick={() => setMode("STATES")}
                        className={`
              px-3 py-1 text-xs font-medium rounded-md transition-all
              ${mode === "STATES"
                                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}
            `}
                    >
                        Estados
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {!funnelData || funnelData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        Nenhum dado disponível para este funil.
                    </div>
                ) : (
                    funnelData.map((item: any, index: number) => {
                        const percentage = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
                        const barWidth = Math.max((item.value / maxValue) * 100, 2); // Min 2% width for visibility

                        return (
                            <div key={index} className="group cursor-default">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate pr-2" title={item.name}>
                                        {item.name || "Sem Nome"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-900 dark:text-white font-bold">{item.value}</span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">({percentage}%)</span>
                                    </div>
                                </div>

                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-r-lg h-8 relative overflow-hidden flex items-center">
                                    <div
                                        className="h-full rounded-r-lg transition-all duration-700 ease-out flex items-center relative group-hover:brightness-95"
                                        style={{
                                            width: `${barWidth}%`,
                                            backgroundColor: item.color || (mode === 'CRM' ? '#6366f1' : '#8b5cf6')
                                        }}
                                    >
                                    </div>

                                    {/* Decorative background line to simulate funnel flow */}
                                    <div className="absolute inset-0 border-l-2 border-white dark:border-[#12121d] opacity-10 pointer-events-none"></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
