"use client";

import { useState } from "react";
import { Users, TrendingDown } from "lucide-react";
import type { DashboardMetrics } from "../types";

interface FunnelChartProps {
    metrics: DashboardMetrics;
}

// Modern funnel colors - vibrant gradient palette
const FUNNEL_COLORS = [
    { bg: '#fbbf24', bgDark: '#f59e0b' }, // Amber
    { bg: '#34d399', bgDark: '#10b981' }, // Emerald
    { bg: '#f472b6', bgDark: '#ec4899' }, // Pink
    { bg: '#2dd4bf', bgDark: '#14b8a6' }, // Teal
    { bg: '#a78bfa', bgDark: '#8b5cf6' }, // Violet
    { bg: '#60a5fa', bgDark: '#3b82f6' }, // Blue
    { bg: '#f87171', bgDark: '#ef4444' }, // Red
    { bg: '#fb923c', bgDark: '#f97316' }, // Orange
];

export default function FunnelChart({ metrics }: FunnelChartProps) {
    const [mode, setMode] = useState<"CRM" | "STATES">("CRM");
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const funnelData = mode === "CRM" ? metrics.crmFunnel : metrics.statesFunnel;
    const totalValue = funnelData?.reduce((acc: number, item: any) => acc + item.value, 0) || 0;

    return (
        <div className="bg-white dark:bg-[#12121d] rounded-2xl p-6 border border-gray-100 dark:border-gray-800/50 transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Funil de Vendas
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {mode === "CRM" ? "Etapas do CRM" : "Estados do Agente"}
                        </p>
                    </div>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setMode("CRM")}
                        className={`
                            px-3 py-1.5 text-xs font-medium rounded-md transition-all
                            ${mode === "CRM"
                                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}
                        `}
                    >
                        CRM
                    </button>
                    <button
                        onClick={() => setMode("STATES")}
                        className={`
                            px-3 py-1.5 text-xs font-medium rounded-md transition-all
                            ${mode === "STATES"
                                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}
                        `}
                    >
                        Estados
                    </button>
                </div>
            </div>

            {/* Total Badge */}
            <div className="flex items-center justify-center mb-8">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{totalValue}</span> leads no funil
                </div>
            </div>

            {/* Visual Funnel */}
            <div className="relative" style={{ overflow: 'visible' }}>
                {!funnelData || funnelData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                        <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        Nenhum dado disponível para este funil.
                    </div>
                ) : (
                    <div className="relative">
                        {/* Funnel Container */}
                        <div className="flex justify-center items-center gap-1 py-4">
                            {funnelData.map((item: any, index: number) => {
                                const percentage = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
                                const colorSet = FUNNEL_COLORS[index % FUNNEL_COLORS.length];
                                const itemColor = item.color || colorSet.bg;
                                const isPalette = !item.color;
                                const colorStart = isPalette ? colorSet.bg : itemColor;
                                const colorEnd = isPalette ? colorSet.bgDark : itemColor;

                                const isLast = index === funnelData.length - 1;
                                const itemCount = funnelData.length;
                                const isHovered = hoveredIndex === index;

                                const maxHeight = 140;
                                const minHeight = 40;
                                const heightStep = (maxHeight - minHeight) / Math.max(itemCount - 1, 1);
                                const currentHeight = maxHeight - (index * heightStep);

                                // Width based on number of items
                                const segmentWidth = Math.max(70, Math.min(120, 600 / itemCount));

                                return (
                                    <div
                                        key={index}
                                        className="relative flex flex-col items-center group"
                                        onMouseEnter={() => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        {/* Funnel Segment */}
                                        <div
                                            className="relative transition-all duration-300 cursor-pointer"
                                            style={{
                                                width: segmentWidth,
                                                height: currentHeight,
                                                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                                                zIndex: isHovered ? 10 : 1,
                                            }}
                                        >
                                            {/* Main shape with CSS clip-path for smooth trapezoid */}
                                            <div
                                                className="absolute inset-0 transition-all duration-300"
                                                style={{
                                                    background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
                                                    clipPath: isLast
                                                        ? `polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)`
                                                        : `polygon(0 0, 100% 8%, 100% 92%, 0 100%)`,
                                                    borderRadius: '4px',
                                                    opacity: isHovered ? 1 : 0.9,
                                                }}
                                            >
                                                {/* Content inside segment */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                                    <span className="text-2xl font-bold">
                                                        {item.value}
                                                    </span>
                                                    <span className="text-xs opacity-80 font-medium">
                                                        {percentage}%
                                                    </span>
                                                </div>

                                                {/* Subtle shine effect */}
                                                <div
                                                    className="absolute inset-0 opacity-20"
                                                    style={{
                                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                                                        clipPath: isLast
                                                            ? `polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)`
                                                            : `polygon(0 0, 100% 8%, 100% 92%, 0 100%)`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stage Name Below */}
                                        <div
                                            className={`mt-3 text-center transition-all duration-300`}
                                            style={{ width: segmentWidth }}
                                        >
                                            <p
                                                className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate px-1"
                                                title={item.name}
                                            >
                                                {item.name || "N/A"}
                                            </p>
                                        </div>

                                        {/* Statistics tooltip on hover */}
                                        {isHovered && (
                                            <div
                                                className="absolute left-1/2 transform -translate-x-1/2"
                                                style={{
                                                    top: -130,
                                                    zIndex: 9999,
                                                }}
                                            >
                                                <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 rounded-xl text-sm whitespace-nowrap border border-gray-200 dark:border-gray-700">
                                                    <div className="font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                                        {item.name}
                                                    </div>
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-gray-500 dark:text-gray-400">Leads:</span>
                                                            <span className="font-bold">{item.value}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-gray-500 dark:text-gray-400">% do Total:</span>
                                                            <span className="font-bold">{percentage}%</span>
                                                        </div>
                                                        {index > 0 && funnelData[index - 1]?.value > 0 && (
                                                            <div className="flex justify-between gap-4 pt-1 border-t border-gray-200 dark:border-gray-700">
                                                                <span className="text-gray-500 dark:text-gray-400">Conversão:</span>
                                                                <span className="font-bold text-green-600 dark:text-green-400">
                                                                    {Math.round((item.value / funnelData[index - 1].value) * 100)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 rotate-45" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Legend Cards Grid */}
            {funnelData && funnelData.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {funnelData.map((item: any, index: number) => {
                            const percentage = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
                            const colorSet = FUNNEL_COLORS[index % FUNNEL_COLORS.length];
                            const itemColor = item.color || colorSet.bg;
                            const isHovered = hoveredIndex === index;

                            return (
                                <div
                                    key={index}
                                    className={`
                                        relative p-3 rounded-xl transition-all duration-300 cursor-pointer
                                        ${isHovered
                                            ? 'bg-gray-100 dark:bg-gray-800 scale-105'
                                            : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'}
                                    `}
                                    style={{
                                        borderLeft: `4px solid ${itemColor}`,
                                    }}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1" title={item.name}>
                                        {item.name}
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            {item.value}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            ({percentage}%)
                                        </span>
                                    </div>

                                    {/* Mini progress bar */}
                                    <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: itemColor,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
