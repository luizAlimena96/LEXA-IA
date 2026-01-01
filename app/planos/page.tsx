'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import {
    Moon,
    Sun,
    Check,
    ArrowRight,
    Zap,
    Sparkles,
} from 'lucide-react';

export default function PlanosPage() {
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

    // Theme Classes
    const bgMain = isDark ? 'bg-[#05050A]' : 'bg-slate-50';
    const textMain = isDark ? 'text-white' : 'text-slate-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
    const cardBg = isDark ? 'bg-white/[0.03] border-white/[0.05]' : 'bg-white border-slate-200 shadow-sm';
    const glassHeader = isDark ? 'bg-[#05050A]/80 border-white/5' : 'bg-white/80 border-slate-200';

    const plans = [
        {
            name: 'Plugar SellerIA',
            description: 'Comece a fechar contratos AGORA MESMO',
            priceMonthly: 'R$ 1.200,00',
            priceSetup: 'R$ 10.000,00',
            features: [
                'Acesso a nossa tecnologia',
                'Atendimento 24/7',
                'Fluxo comercial validado',
                'Triagem, agendamentos, follow up 100% Automático',
                'Entende áudios, imagens e documentos',
                'Atualização automática de CRM',
                'CRM_lexa ou integramos com os principais CRMs do mercado',
                'Integração com google agenda',
                'Comece a fechar contratos AGORA MESMO',
            ],
            ctas: [
                { label: 'Contratar Agora', href: 'https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa', primary: true },
                { label: 'Agendar Demonstração', href: 'https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa', primary: false },
            ],
            highlight: false,
        },
        {
            name: 'Implementação Lexa',
            description: 'Solução completa e personalizada para seu escritório',
            priceMonthly: 'Sob consulta',
            priceSetup: null,
            features: [
                'Acesso a nossa tecnologia',
                'Atendimento 24/7',
                'Fluxo comercial validado',
                'Triagem, agendamentos, follow up 100% Automático',
                'Entende áudios, imagens e documentos',
                'Atualização automática de CRM',
                'CRM_lexa ou integramos com os principais CRMs do mercado',
                'Integração com google agenda',
                'Personalização de fluxos',
            ],
            ctas: [
                { label: 'Aplicar para Implementação', href: 'https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa', primary: true },
            ],
            highlight: true,
        },
    ];

    return (
        <div className={cn("min-h-screen font-sans selection:bg-indigo-500/30 overflow-x-hidden", bgMain, textMain)}>

            {/* Fixed Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className={cn("absolute inset-0 transition-colors duration-700", bgMain)} />

                {/* Tech Grid */}
                <div className={cn("absolute inset-0 opacity-[0.03]", isDark ? "invert" : "")}>
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `linear-gradient(#888 1px, transparent 1px), linear-gradient(90deg, #888 1px, transparent 1px)`,
                            backgroundSize: '50px 50px'
                        }}
                    />
                </div>

                {/* Glows */}
                <div className="absolute inset-0">
                    <div className={cn("absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] rounded-full blur-[120px] opacity-20 animate-pulse-slow", isDark ? "bg-indigo-900" : "bg-indigo-300")} />
                    <div className={cn("absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 animate-pulse-slow delay-1000", isDark ? "bg-purple-900" : "bg-purple-300")} />
                </div>
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10">

                {/* HEADER */}
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
                            <Link href="/landing" className={cn("text-sm font-medium transition-colors hover:text-indigo-500", textMain)}>
                                Voltar
                            </Link>
                            <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95">
                                Acessar Plataforma
                            </Link>
                        </div>
                    </div>
                </header>

                {/* HERO */}
                <section className="pt-40 pb-20 px-6">
                    <div className="max-w-7xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8 border backdrop-blur-md", isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-700")}>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                Escolha o Plano Ideal
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                                Transforme seu Comercial com a{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                                    Lexa
                                </span>
                            </h1>

                            <p className={cn("text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed", textMuted)}>
                                Escolha o plano que melhor se adapta ao seu escritório e comece a fechar mais contratos hoje mesmo.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* PLANS */}
                <section className="pb-24 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                            {plans.map((plan, index) => (
                                <motion.div
                                    key={plan.name}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.2 }}
                                    className={cn(
                                        "relative rounded-3xl border p-8 md:p-10 transition-all duration-300",
                                        plan.highlight
                                            ? cn(
                                                "ring-2 ring-indigo-500/50 shadow-2xl",
                                                isDark ? "bg-[#0A0A15] border-indigo-500/30 shadow-indigo-900/20" : "bg-white border-indigo-100 shadow-indigo-100"
                                            )
                                            : cardBg
                                    )}
                                >
                                    {/* Highlight Badge */}
                                    {plan.highlight && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold tracking-wider uppercase">
                                            Mais Popular
                                        </div>
                                    )}

                                    {/* Glow Effect */}
                                    {plan.highlight && (
                                        <div className={cn("absolute -top-20 -right-20 w-64 h-64 blur-[80px] rounded-full pointer-events-none opacity-50", isDark ? "bg-indigo-500/30" : "bg-indigo-400/20")} />
                                    )}

                                    <div className="relative z-10">
                                        {/* Plan Name */}
                                        <h3 className="text-2xl md:text-3xl font-bold mb-3">{plan.name}</h3>
                                        <p className={cn("text-lg mb-6", textMuted)}>{plan.description}</p>

                                        {/* Pricing */}
                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-4xl md:text-5xl font-bold text-indigo-500">{plan.priceMonthly}</span>
                                                {plan.priceMonthly !== 'Sob consulta' && <span className={cn("text-lg", textMuted)}>/mês</span>}
                                            </div>
                                            {plan.priceSetup && (
                                                <p className={cn("text-sm", textMuted)}>
                                                    + {plan.priceSetup} (setup único)
                                                </p>
                                            )}
                                        </div>

                                        {/* Features */}
                                        <ul className="space-y-4 mb-8">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                                    <span className={cn("text-base", textMain)}>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTAs */}
                                        <div className="space-y-3">
                                            {plan.ctas.map((cta, i) => (
                                                <a
                                                    key={i}
                                                    href={cta.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={cn(
                                                        "w-full h-12 rounded-full font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95",
                                                        cta.primary
                                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/25"
                                                            : cn("border", isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50", textMain)
                                                    )}
                                                >
                                                    {cta.label}
                                                    <ArrowRight className="w-5 h-5" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA SECTION */}
                <section className="py-24 px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className={cn("relative rounded-[2.5rem] overflow-hidden border px-6 py-16 md:px-16 text-center",
                                isDark
                                    ? "bg-[#080810] border-white/10"
                                    : "bg-white border-slate-200 shadow-2xl"
                            )}
                        >
                            {/* Background Effects */}
                            <div className={cn("absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]", isDark ? "invert" : "")} />
                            <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none animate-pulse-slow", isDark ? "bg-indigo-600/20" : "bg-indigo-500/10")} />

                            <div className="relative z-10">
                                <h2 className={cn("text-3xl md:text-4xl font-bold mb-6", textMain)}>
                                    Ainda tem dúvidas?
                                </h2>
                                <p className={cn("text-xl mb-8 max-w-2xl mx-auto", textMuted)}>
                                    Fale com nosso time e descubra qual plano é o ideal para o seu escritório.
                                </p>
                                <a
                                    href="https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn("inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-lg",
                                        isDark
                                            ? "bg-white text-indigo-950 hover:bg-indigo-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                                    )}
                                >
                                    <Zap className={cn("w-5 h-5", isDark ? "fill-indigo-600" : "fill-white")} />
                                    Falar com Especialista
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className={cn("border-t py-16 px-6", isDark ? "border-white/5" : "border-slate-200")}>
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16">
                                <Image
                                    src={isDark ? '/Lexa logo cinza escuro.png' : '/Lexa logo roxo.png'}
                                    alt="Lexa"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>

                        <div className={cn("flex gap-8 text-sm", textMuted)}>
                            <span>© {new Date().getFullYear()} Lexa AI.</span>
                            <Link href="/terms" className="hover:text-indigo-500 transition-colors">Privacidade</Link>
                            <Link href="/terms" className="hover:text-indigo-500 transition-colors">Termos</Link>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
}
