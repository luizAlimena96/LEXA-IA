'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Moon, Sun, ArrowLeft, GraduationCap } from 'lucide-react';

export default function TreinamentosPage() {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('landing-theme');
        if (saved) setIsDark(saved === 'dark');
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem('landing-theme', next ? 'dark' : 'light');
    };

    const bgMain = isDark ? 'bg-[#05050A]' : 'bg-slate-50';
    const textMain = isDark ? 'text-white' : 'text-slate-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
    const glassHeader = isDark ? 'bg-[#05050A]/80 border-white/5' : 'bg-white/80 border-slate-200';

    return (
        <div className={cn("min-h-screen font-sans selection:bg-indigo-500/30", bgMain, textMain)}>
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className={cn("absolute inset-0", bgMain)} />
                <div className={cn("absolute inset-0 opacity-[0.03]", isDark ? "invert" : "")}>
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(#888 1px, transparent 1px), linear-gradient(90deg, #888 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }} />
                </div>
                <div className={cn("absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] rounded-full blur-[120px] opacity-20", isDark ? "bg-purple-900" : "bg-purple-300")} />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <header className={cn("fixed top-0 w-full z-50 backdrop-blur-xl border-b", glassHeader)}>
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        <Link href="/landing" className="flex items-center gap-3 group">
                            <div className="relative w-16 h-16">
                                <Image
                                    src={isDark ? '/Lexa logo cinza escuro.png' : '/Lexa logo roxo.png'}
                                    alt="Lexa"
                                    fill
                                    className="object-contain transition-transform group-hover:scale-105"
                                />
                            </div>
                        </Link>
                        <div className="flex items-center gap-4">
                            <button onClick={toggleTheme} className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-slate-100")}>
                                {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <section className="pt-40 pb-24 px-6 min-h-screen flex items-center justify-center">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >

                            <h1 className="text-4xl md:text-6xl font-bold mb-6">
                                Treinamentos Comerciais
                            </h1>

                            <p className={cn("text-xl md:text-2xl mb-8", textMuted)}>
                                Em breve, ofereceremos treinamentos especializados para equipes comerciais de escritórios de advocacia.
                            </p>

                            <p className={cn("text-lg mb-12", textMuted)}>
                                Capacite sua equipe com as melhores práticas de vendas e atendimento para o mercado jurídico.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/landing"
                                    className={cn("inline-flex items-center gap-2 px-6 py-3 rounded-full border font-semibold transition-all hover:scale-105", isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50")}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Voltar para Home
                                </Link>
                                <a
                                    href="https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20os%20Treinamentos%20Comerciais"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                                >
                                    Manifestar Interesse
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>
        </div>
    );
}
