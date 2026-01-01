'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, Variants } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  Moon,
  Sun,
  Menu,
  X,
  MessageSquare,
  Clock,
  Calendar,
  Mic,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ArrowRight,
  Zap,
} from 'lucide-react';

// --- DATA ---
const features = [
  {
    icon: Clock,
    title: 'Atendimento 24/7',
    description: 'Responda leads em segundos, a qualquer hora do dia ou da noite, garantindo que nenhuma oportunidade seja perdida.',
  },
  {
    icon: MessageSquare,
    title: 'Qualificação Inteligente',
    description: 'Faça as perguntas certas automaticamente para identificar o nível de interesse e urgência de cada lead.',
  },
  {
    icon: Calendar,
    title: 'Agendamento Automático',
    description: 'Integração direta com Google Calendar para agendar reuniões qualificadas sem intervenção humana.',
  },
  {
    icon: Mic,
    title: 'Multimodalidade',
    description: 'Entenda áudios, imagens e documentos. A Lexa ouve e responde como um humano, criando conexão real.',
  },
  {
    icon: BarChart3,
    title: 'CRM Integrado',
    description: 'Atualização automática do CRM com dados ricos. Mantenha seu pipeline sempre organizado e atualizado.',
  },
  {
    icon: RefreshCw,
    title: 'Follow-up Automático',
    description: 'Não deixe o lead esfriar. Acompanhamento persistente e personalizado para recuperar contatos inativos.',
  },
];

const comparisonData = {
  traditional: [
    'Conversão cai pela demora',
    'Atendimento engessado e robótico',
    'Clientes frustrados com filas',
    'Dependência total de humanos',
    'Falta de dados estruturados',
  ],
  lexa: [
    'Atendimento imediato 24/7',
    'Conversa natural e fluida',
    'Satisfação elevada do cliente',
    'Automação inteligente',
    'Dados ricos no CRM',
    'Agendamento automático',
  ],
};

const howItWorks = [
  {
    step: '01',
    title: 'Configuração',
    description: 'Escolha seu plano e configuramos a Lexa para entender o perfil do seu escritório e seus serviços.',
  },
  {
    step: '02',
    title: 'Integração',
    description: 'Conectamos ao seu WhatsApp, CRM e Calendar. Validamos os fluxos de conversa e qualificação.',
  },
  {
    step: '03',
    title: 'Execução',
    description: 'A Lexa assume o atendimento inicial, qualifica os leads e entrega oportunidades prontas para fechar.',
  },
];

const faqItems = [
  {
    question: 'A Lexa substitui o atendimento humano?',
    answer: 'A Lexa não substitui, ela potencializa. Ela assume o trabalho repetitivo de triagem, qualificação e agendamento, permitindo que seus advogados e closers foquem apenas em reuniões de alto valor e fechamento de contratos.',
  },
  {
    question: 'A IA funciona para qualquer área do direito?',
    answer: 'Sim! A Lexa é treinada com contextos específicos. Seja Trabalhista, Previdenciário, Cível ou Criminal, adaptamos o "cérebro" da IA para falar a linguagem do seu cliente e do seu nicho.',
  },
  {
    question: 'A Lexa fecha contratos sozinha?',
    answer: 'Ela pode enviar contratos e coletar assinaturas se configurada para isso (ideal para produtos de entrada). Para tickets maiores, o objetivo dela é colocar o lead qualificado "na mesa" do advogado para o fechamento final.',
  },
  {
    question: 'A Lexa tem integração com meu CRM?',
    answer: 'Sim, integramos nativamente com os principais CRMs do mercado jurídico e plataformas universais. Se tiver API, a Lexa conecta.',
  },
  {
    question: 'Funciona apenas no WhatsApp?',
    answer: 'Atualmente o foco principal é WhatsApp, onde a conversão acontece no Brasil. Estamos expandindo para Instagram Direct e Webchat em breve.',
  },
];

// --- ANIMATION VARIANTS ---

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 50, damping: 20 }
  }
};

const FadeIn = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10%" }}
    transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }} // Custom easing for "premium" feel
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sobreDropdownOpen, setSobreDropdownOpen] = useState(false);
  const [mobileSobreOpen, setMobileSobreOpen] = useState(false);

  // Parallax Hooks
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]); // Background moves slower
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]); // Glows move up
  const opacity = useTransform(scrollY, [0, 300], [1, 0]); // Hero fade out

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <div className={cn("min-h-screen font-sans selection:bg-indigo-500/30 overflow-x-hidden", bgMain, textMain)}>

      {/* Fixed Background with Parallax */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={cn("absolute inset-0 transition-colors duration-700", bgMain)} />

        {/* Tech Grid - Parallax Layer 1 */}
        <motion.div
          style={{ y: y1 }}
          className={cn("absolute inset-0 opacity-[0.03] origin-top", isDark ? "invert" : "")}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(#888 1px, transparent 1px), linear-gradient(90deg, #888 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </motion.div>

        {/* Glows - Parallax Layer 2 */}
        <motion.div style={{ y: y2 }} className="absolute inset-0">
          <div className={cn("absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] rounded-full blur-[120px] opacity-20 animate-pulse-slow", isDark ? "bg-indigo-900" : "bg-indigo-300")} />
          <div className={cn("absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 animate-pulse-slow delay-1000", isDark ? "bg-purple-900" : "bg-purple-300")} />
        </motion.div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">

        {/* HEADER */}
        <header className={cn("fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-xl border-b", scrolled ? glassHeader : "bg-transparent border-transparent")}>
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Logo */}
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

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
              {/* Home */}
              <Link href="/landing" className={cn("transition-colors hover:text-indigo-500 relative group", textMuted)}>
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
              </Link>

              {/* Sobre - Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setSobreDropdownOpen(true)}
                onMouseLeave={() => setSobreDropdownOpen(false)}
              >
                <button className={cn("transition-colors hover:text-indigo-500 relative group flex items-center gap-1", textMuted)}>
                  Sobre
                  <ChevronDown className={cn("w-4 h-4 transition-transform", sobreDropdownOpen ? "rotate-180" : "")} />
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
                </button>

                <AnimatePresence>
                  {sobreDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className={cn("absolute top-full left-0 mt-2 w-56 rounded-2xl border shadow-xl overflow-hidden", cardBg)}
                    >
                      <div className="py-2">
                        <Link href="/trabalhe-conosco" className={cn("block px-4 py-2.5 text-sm transition-colors hover:bg-indigo-500/10", textMain)}>
                          Trabalhe conosco
                        </Link>
                        <a href="#quem-somos" className={cn("block px-4 py-2.5 text-sm transition-colors hover:bg-indigo-500/10", textMain)}>
                          Quem somos
                        </a>
                        <a href="https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa" target="_blank" className={cn("block px-4 py-2.5 text-sm transition-colors hover:bg-indigo-500/10", textMain)}>
                          Agende uma demonstração
                        </a>
                        <div className="border-t border-white/5 my-2" />
                        <div className="px-4 py-2">
                          <p className={cn("text-xs font-semibold mb-2", textMuted)}>Social</p>
                          <div className="flex gap-3">
                            <a href="#" target="_blank" className={cn("p-2 rounded-lg transition-colors hover:bg-indigo-500/10", textMuted)}>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              </svg>
                            </a>
                            <a href="#" target="_blank" className={cn("p-2 rounded-lg transition-colors hover:bg-indigo-500/10", textMuted)}>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                              </svg>
                            </a>
                            <a href="#" target="_blank" className={cn("p-2 rounded-lg transition-colors hover:bg-indigo-500/10", textMuted)}>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quem Somos */}
              <a href="#quem-somos" className={cn("transition-colors hover:text-indigo-500 relative group", textMuted)}>
                Quem Somos
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
              </a>

              {/* Planos */}
              <Link href="/planos" className={cn("transition-colors hover:text-indigo-500 relative group", textMuted)}>
                Planos
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
              </Link>

              {/* Consultoria Comercial */}
              <Link href="/consultoria-comercial" className={cn("transition-colors hover:text-indigo-500 relative group", textMuted)}>
                Consultoria Comercial
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
              </Link>

              {/* Treinamentos */}
              <Link href="/treinamentos-comerciais" className={cn("transition-colors hover:text-indigo-500 relative group", textMuted)}>
                Treinamentos
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
              </Link>

              {/* Services */}
              <Link href="/services" className={cn("transition-colors hover:text-indigo-500 relative group", textMuted)}>
                Lexa Services
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
              </Link>
            </nav>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <button onClick={toggleTheme} className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-slate-100")}>
                {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
              <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95">
                Acessar Plataforma
              </Link>
            </div>

            {/* Mobile Toggle */}
            <div className="lg:hidden flex items-center gap-4">
              <button onClick={toggleTheme}>
                {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn("lg:hidden border-b backdrop-blur-xl", glassHeader)}
              >
                <div className="px-6 py-6 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
                  {/* Home */}
                  <Link href="/landing" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium opacity-80">
                    Home
                  </Link>

                  {/* Sobre - Accordion */}
                  <div>
                    <button
                      onClick={() => setMobileSobreOpen(!mobileSobreOpen)}
                      className="w-full flex items-center justify-between text-base font-medium opacity-80"
                    >
                      Sobre
                      <ChevronDown className={cn("w-4 h-4 transition-transform", mobileSobreOpen ? "rotate-180" : "")} />
                    </button>
                    <AnimatePresence>
                      {mobileSobreOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-4 mt-2 space-y-2 overflow-hidden"
                        >
                          <Link href="/trabalhe-conosco" onClick={() => setMobileMenuOpen(false)} className={cn("block py-1.5 text-sm", textMuted)}>
                            Trabalhe conosco
                          </Link>
                          <a href="#quem-somos" onClick={() => setMobileMenuOpen(false)} className={cn("block py-1.5 text-sm", textMuted)}>
                            Quem somos
                          </a>
                          <a href="#" onClick={() => setMobileMenuOpen(false)} className={cn("block py-1.5 text-sm", textMuted)}>
                            Programa de parcerias
                          </a>
                          <a href="https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa" target="_blank" onClick={() => setMobileMenuOpen(false)} className={cn("block py-1.5 text-sm", textMuted)}>
                            Agende uma demonstração
                          </a>
                          <div className="pt-2">
                            <p className={cn("text-xs font-semibold mb-2", textMuted)}>Social</p>
                            <div className="flex gap-3">
                              <a href="#" target="_blank" className={cn("p-2 rounded-lg transition-colors hover:bg-indigo-500/10", textMuted)}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                              </a>
                              <a href="#" target="_blank" className={cn("p-2 rounded-lg transition-colors hover:bg-indigo-500/10", textMuted)}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                              </a>
                              <a href="#" target="_blank" className={cn("p-2 rounded-lg transition-colors hover:bg-indigo-500/10", textMuted)}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Quem Somos */}
                  <a href="#quem-somos" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium opacity-80">
                    Quem Somos
                  </a>

                  {/* Planos */}
                  <Link href="/planos" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium opacity-80">
                    Planos
                  </Link>

                  {/* Consultoria */}
                  <Link href="/consultoria-comercial" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium opacity-80">
                    Consultoria Comercial
                  </Link>

                  {/* Treinamentos */}
                  <Link href="/treinamentos-comerciais" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium opacity-80">
                    Treinamentos
                  </Link>

                  {/* Services */}
                  <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium opacity-80">
                    Lexa Services
                  </Link>

                  <hr className="border-white/10 my-2" />
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="bg-indigo-600 text-white py-3 rounded-xl text-center font-semibold">
                    Acessar Plataforma
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* HERO with Staggered Entrance */}
        <section className="relative pt-40 pb-32 px-6 min-h-[90vh] flex items-center justify-center">
          <motion.div
            style={{ opacity }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={itemVariants}>
              <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8 border backdrop-blur-md", isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-700")}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Nova Era do Comercial Jurídico
              </div>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
              IA de Atendimento <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                Jurídico Inteligente
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className={cn("text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed", textMuted)}>
              Nossa IA qualifica leads 24/7, agenda reuniões automaticamente e atualiza seu CRM.
              Deixe seus advogados focados em fechar contratos.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="https://wa.me/5541988037508" target="_blank" className="h-14 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 w-full sm:w-auto justify-center">
                Agendar Demonstração <ArrowRight className="w-5 h-5" />
              </a>
              <Link href="/login" className={cn("h-14 px-8 rounded-full border font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto justify-center", isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50")}>
                Ver Como Funciona
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* MAIS HUMANA QUE HUMANOS */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Mais <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">Humana</span> que Humanos
              </h2>
              <p className={cn("text-xl max-w-2xl mx-auto", textMuted)}>
                A Lexa não apenas responde mensagens. Ela vê, ouve, fala e age como um membro real da sua equipe.
              </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Audio Response */}
              <FadeIn delay={0.1}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={cn("group relative p-8 rounded-3xl border transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl h-full overflow-hidden", cardBg)}
                >
                  {/* Glow effect */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Mic className="w-7 h-7 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Escuta e Responde em Áudio</h3>
                    <p className={cn("leading-relaxed mb-4", textMuted)}>
                      Cliente manda áudio? A Lexa escuta, entende e responde em áudio de volta. Conversa natural como se fosse humano.
                    </p>
                    <div className={cn("mt-4 p-3 rounded-xl text-xs font-mono", isDark ? "bg-white/5" : "bg-slate-100")}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className={textMuted}>Processando áudio...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mic className="w-3 h-3 text-purple-500" />
                        <div className="flex-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                        <span className="text-purple-500">0:23</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>

              {/* Document Understanding */}
              <FadeIn delay={0.2}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={cn("group relative p-8 rounded-3xl border transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl h-full overflow-hidden", cardBg)}
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Entende Laudos e Documentos</h3>
                    <p className={cn("leading-relaxed mb-4", textMuted)}>
                      Extrai informações de PDFs, imagens e documentos. Analisa laudos médicos, contratos e qualquer arquivo que o cliente enviar.
                    </p>
                    <div className={cn("mt-4 p-3 rounded-xl", isDark ? "bg-white/5" : "bg-slate-100")}>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className={textMuted}>Laudo_Medico.pdf</span>
                      </div>
                      <div className="mt-2 text-xs text-purple-500 font-medium">
                        ✓ Dados extraídos com sucesso
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>

              {/* Video Sending */}
              <FadeIn delay={0.3}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={cn("group relative p-8 rounded-3xl border transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl h-full overflow-hidden", cardBg)}
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Envia Vídeos Personalizados</h3>
                    <p className={cn("leading-relaxed mb-4", textMuted)}>
                      Compartilha vídeos explicativos, apresentações do escritório e materiais educativos de forma automática e contextual.
                    </p>
                    <div className={cn("mt-4 p-3 rounded-xl relative", isDark ? "bg-white/5" : "bg-slate-100")}>
                      <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>

              {/* Contract Signing */}
              <FadeIn delay={0.4}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={cn("group relative p-8 rounded-3xl border transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl h-full overflow-hidden", cardBg)}
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Assinatura Automática de Contratos</h3>
                    <p className={cn("leading-relaxed mb-4", textMuted)}>
                      Envia contratos via ZapSign e acompanha o processo de assinatura. Do envio à conclusão, tudo automatizado.
                    </p>
                    <div className={cn("mt-4 p-3 rounded-xl space-y-2", isDark ? "bg-white/5" : "bg-slate-100")}>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className={textMuted}>Contrato enviado</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span className={textMuted}>Aguardando assinatura...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>

              {/* Calendar Integration */}
              <FadeIn delay={0.5}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={cn("group relative p-8 rounded-3xl border transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl h-full overflow-hidden", cardBg)}
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-7 h-7 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Agendamento Inteligente</h3>
                    <p className={cn("leading-relaxed mb-4", textMuted)}>
                      Integração direta com Google Calendar. Sugere horários, confirma reuniões e envia Google Meet automaticamente.
                    </p>
                    <div className={cn("mt-4 p-3 rounded-xl", isDark ? "bg-white/5" : "bg-slate-100")}>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className={textMuted}>Próxima reunião</span>
                        <span className="text-purple-500 font-medium">Hoje, 15:00</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3 h-3 text-purple-500" />
                        <span className={textMuted}>Google Meet criado</span>
                        <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>

              {/* Real-time Updates */}
              <FadeIn delay={0.6}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={cn("group relative p-8 rounded-3xl border transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl h-full overflow-hidden", cardBg)}
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Zap className="w-7 h-7 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Atualização em Tempo Real</h3>
                    <p className={cn("leading-relaxed mb-4", textMuted)}>
                      Cada interação atualiza automaticamente seu CRM com dados estruturados, tags e próximos passos.
                    </p>
                    <div className={cn("mt-4 p-3 rounded-xl space-y-2", isDark ? "bg-white/5" : "bg-slate-100")}>
                      <div className="flex items-center gap-2 text-xs">
                        <RefreshCw className="w-3 h-3 text-purple-500 animate-spin" />
                        <span className={textMuted}>Sincronizando CRM...</span>
                      </div>
                      <div className="text-xs text-green-500 font-medium">
                        ✓ Lead qualificado e atualizado
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            </div>

            {/* Bottom CTA */}
            <FadeIn delay={0.7} className="mt-16 text-center">
              <div className={cn("inline-flex items-center gap-3 px-6 py-4 rounded-2xl border", isDark ? "bg-purple-500/5 border-purple-500/20" : "bg-purple-50 border-purple-200")}>
                <p className={cn("text-lg font-medium", textMain)}>
                  Tudo isso funcionando 24/7, sem pausas, sem erros, sem esquecer nada.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* SUPPORT SECTION */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Quem usa a Lexa, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">não pensa em trocar!</span>
              </h2>
              <p className={cn("text-xl max-w-2xl mx-auto", textMuted)}>
                Suporte que realmente funciona. Estamos com você em cada etapa da jornada.
              </p>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* 5 Minute Response */}
              <FadeIn delay={0.1}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={cn("relative p-8 rounded-3xl border transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl text-center overflow-hidden", cardBg)}
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                      <Clock className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">5 Minutos</h3>
                    <p className={cn("leading-relaxed", textMuted)}>
                      Time de suporte que responde em até 5 minutos. Sem espera, sem frustrações.
                    </p>
                  </div>
                </motion.div>
              </FadeIn>

              {/* Humanized Support */}
              <FadeIn delay={0.2}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={cn("relative p-8 rounded-3xl border transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl text-center overflow-hidden", cardBg)}
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Atendimento Humanizado</h3>
                    <p className={cn("leading-relaxed", textMuted)}>
                      Suporte via Google Meet com pessoas reais que entendem seu negócio.
                    </p>
                  </div>
                </motion.div>
              </FadeIn>

              {/* Bi-weekly Hotseats */}
              <FadeIn delay={0.3}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={cn("relative p-8 rounded-3xl border transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl text-center overflow-hidden", cardBg)}
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                      <BarChart3 className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Hotseats Quinzenais</h3>
                    <p className={cn("leading-relaxed", textMuted)}>
                      Sessões de otimização do processo comercial com todos os clientes Lexa.
                    </p>
                  </div>
                </motion.div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section id="comparativo" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Evolua seu Atendimento</h2>
              <p className={cn("text-xl max-w-2xl mx-auto", textMuted)}>A diferença entre perder leads e fechar contratos.</p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
              {/* Traditional (Problem) */}
              <FadeIn className={cn("p-8 md:p-12 rounded-3xl border transition-all duration-500",
                isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50"
              )}>
                <h3 className={cn("text-2xl font-bold mb-8 flex items-center gap-3", textMuted)}>
                  <div className="p-2 rounded-lg bg-slate-500/10"><XCircle className="w-6 h-6" /></div>
                  Tradicional
                </h3>
                <ul className="space-y-6">
                  {comparisonData.traditional.map((item, i) => (
                    <li key={i} className={cn("flex items-center gap-4 text-lg", textMuted)}>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Lexa (Solution) */}
              <FadeIn delay={0.2} className="relative">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={cn("p-8 md:p-12 rounded-3xl border relative overflow-hidden ring-1 ring-indigo-500/20 shadow-2xl",
                    isDark ? "bg-[#0A0A15] border-indigo-500/30 shadow-indigo-900/20" : "bg-white border-indigo-100 shadow-indigo-100"
                  )}
                >
                  {/* Glow Effect */}
                  <div className={cn("absolute -top-20 -right-20 w-64 h-64 blur-[80px] rounded-full pointer-events-none opacity-50",
                    isDark ? "bg-indigo-500/30" : "bg-indigo-400/20"
                  )} />

                  <h3 className="text-2xl font-bold text-indigo-500 mb-8 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10"><CheckCircle2 className="w-6 h-6" /></div>
                    Com a Lexa
                  </h3>
                  <ul className="space-y-6 relative z-10">
                    {comparisonData.lexa.map((item, i) => (
                      <li key={i} className={cn("flex items-center gap-4 text-lg font-medium", textMain)}>
                        <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>

                  {/* Decorative Badge */}
                  <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold tracking-wider uppercase">
                    Recomendado
                  </div>
                </motion.div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="como-funciona" className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Implementação Simples</h2>
              <p className={cn("text-xl max-w-2xl mx-auto", textMuted)}>Em 3 passos seu escritório está rodando com IA.</p>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-[60px] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

              {howItWorks.map((item, i) => (
                <FadeIn key={i} delay={i * 0.2} className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={cn("w-28 h-28 mx-auto rounded-[2rem] flex items-center justify-center text-4xl font-bold mb-8 border-4 border-inherit bg-inherit shadow-2xl z-20 relative", isDark ? "bg-[#05050A] border-indigo-500/20 text-indigo-400" : "bg-white border-indigo-100 text-indigo-600")}
                  >
                    {item.step}
                  </motion.div>
                  <div className={cn("text-center p-8 rounded-3xl border h-full transition-colors hover:border-indigo-500/30", cardBg)}>
                    <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                    <p className={textMuted}>{item.description}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* QUEM SOMOS */}
        <section id="quem-somos" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Quem Somos</h2>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <FadeIn className="space-y-6">
                <p className={cn("text-lg leading-relaxed", textMuted)}>
                  A Lexa foi criada por quem vive, na prática, a realidade de escritórios de advocacia 100% digitais.
                </p>
                <p className={cn("text-lg leading-relaxed", textMuted)}>
                  A empresa nasce da experiência de <span className="text-indigo-500 font-semibold">Samuel Tramontin</span> e <span className="text-indigo-500 font-semibold">Lauro Tramontin</span>, que acumulam milhões de reais em faturamento gerados para escritórios de advocacia, próprios e de terceiros, por meio de funis de marketing e comercial totalmente digitais. Toda a operação foi construída sem dependência de indicações, com foco em tráfego, atendimento, qualificação e conversão.
                </p>
                <p className={cn("text-lg leading-relaxed", textMuted)}>
                  Como sócio investidor, a Lexa conta com <span className="text-indigo-500 font-semibold">Altair Toledo</span>, 28 anos de KPMG, Vice presidente da Federasul, Professor MBA da PUCRS, trazendo visão estratégica e governança para o projeto.
                </p>
                <p className={cn("text-lg leading-relaxed font-medium", textMain)}>
                  A Lexa surge da junção entre experiência real de geração de demanda, operação comercial estruturada e visão técnica de alto nível, aplicada especificamente ao mercado jurídico.
                </p>
              </FadeIn>

              {/* Image */}
              <FadeIn delay={0.2}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={cn("relative rounded-3xl overflow-hidden border aspect-square", cardBg)}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src="/socios.webp"
                      alt="Equipe Lexa"
                      fill
                      className="object-cover rounded-2xl"
                    />
                  </div>
                  {/* Overlay gradient for premium effect */}
                  <div className={cn("absolute inset-0 bg-gradient-to-t from-gray/20 to-transparent pointer-events-none", isDark ? "opacity-50" : "opacity-30")} />
                </motion.div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CLIENTS CAROUSEL */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  Todo mundo escolhe a Lexa!
                </span>
              </h2>
              <p className={cn("text-xl max-w-2xl mx-auto", textMuted)}>
                Previdenciário, Trabalhista, Bancário, Empresarial... Escritórios de todas as áreas confiam na Lexa.
              </p>
            </FadeIn>

            {/* Infinite Carousel */}
            <div className="relative">
              {/* Gradient Overlays */}
              <div className={cn("absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-r", isDark ? "from-[#05050A] to-transparent" : "from-slate-50 to-transparent")} />
              <div className={cn("absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-l", isDark ? "from-[#05050A] to-transparent" : "from-slate-50 to-transparent")} />

              <div className="overflow-hidden">
                <motion.div
                  className="flex gap-8"
                  animate={{
                    x: [0, -1360], // 5 logos * (256px width + 32px gap)
                  }}
                  transition={{
                    x: {
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 25,
                      ease: "linear",
                    },
                  }}
                >
                  {/* First set of logos */}
                  {[
                    { name: 'Correa Advogados', logo: '/escritorios/correa.png' },
                    { name: 'Edilaine Advocacia', logo: '/escritorios/edilaine.png' },
                    { name: 'Hermann Advocacia', logo: '/escritorios/hermann.png' },
                    { name: 'Kruger Advogados', logo: '/escritorios/kruger.png' },
                    { name: 'Vargas Advocacia', logo: '/escritorios/vargas.png' },
                  ].map((client, i) => (
                    <motion.div
                      key={`client-1-${i}`}
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        "flex-shrink-0 w-64 h-40 rounded-2xl border flex items-center justify-center p-6 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-xl",
                        cardBg
                      )}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={client.logo}
                          alt={client.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </motion.div>
                  ))}
                  {/* Duplicate set for seamless loop */}
                  {[
                    { name: 'Correa Advogados', logo: '/escritorios/correa.png' },
                    { name: 'Edilaine Advocacia', logo: '/escritorios/edilaine.png' },
                    { name: 'Hermann Advocacia', logo: '/escritorios/hermann.png' },
                    { name: 'Kruger Advogados', logo: '/escritorios/kruger.png' },
                    { name: 'Vargas Advocacia', logo: '/escritorios/vargas.png' },
                  ].map((client, i) => (
                    <motion.div
                      key={`client-2-${i}`}
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        "flex-shrink-0 w-64 h-40 rounded-2xl border flex items-center justify-center p-6 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-xl",
                        cardBg
                      )}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={client.logo}
                          alt={client.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Stats below carousel */}
            <FadeIn delay={0.3} className="mt-16">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { number: '20+', label: 'Escritórios Ativos' },
                  { number: '5k+', label: 'Leads Atendidos' },
                  { number: '24/7', label: 'Disponibilidade' },
                  { number: '95%', label: 'Satisfação' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-indigo-500 mb-2">{stat.number}</div>
                    <div className={cn("text-sm", textMuted)}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <FadeIn className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Perguntas Frequentes</h2>
            </FadeIn>

            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className={cn("rounded-2xl border overflow-hidden transition-all duration-300", cardBg, openFaq === i ? "border-indigo-500/50 shadow-lg" : "hover:border-indigo-500/30")}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-6 text-left font-medium text-lg focus:outline-none"
                    >
                      {item.question}
                      <ChevronDown className={cn("w-5 h-5 text-indigo-500 transition-transform duration-300", openFaq === i ? "rotate-180" : "")} />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className={cn("px-6 pb-6 pt-0 leading-relaxed text-lg", textMuted)}>{item.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className={cn("relative rounded-[2.5rem] overflow-hidden border px-6 py-20 md:px-24 text-center group transition-all duration-500",
                isDark
                  ? "bg-[#080810] border-white/10 hover:border-indigo-500/30"
                  : "bg-white border-slate-200 hover:border-indigo-200 shadow-2xl"
              )}>

                {/* Dynamic Background Effects */}
                <div className={cn("absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]", isDark ? "invert" : "")} />

                {/* Central Glow */}
                <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none animate-pulse-slow",
                  isDark ? "bg-indigo-600/20" : "bg-indigo-500/10"
                )} />

                {/* Secondary Glows */}
                <div className={cn("absolute -top-32 -left-32 w-96 h-96 blur-[80px] rounded-full pointer-events-none",
                  isDark ? "bg-purple-600/10" : "bg-purple-500/5"
                )} />
                <div className={cn("absolute -bottom-32 -right-32 w-96 h-96 blur-[80px] rounded-full pointer-events-none",
                  isDark ? "bg-indigo-600/10" : "bg-indigo-500/5"
                )} />

                <div className="relative z-10">
                  <h2 className={cn("text-3xl md:text-5xl font-bold mb-8 tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                    Pronto para transformar seu comercial?
                  </h2>
                  <p className={cn("text-xl max-w-2xl mx-auto mb-12 leading-relaxed", isDark ? "text-slate-300" : "text-slate-600")}>
                    Comece agora mesmo a fechar mais contratos com a Lexa. Agende uma demonstração gratuita.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href="https://wa.me/5541988037508" target="_blank" className={cn("px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all flex items-center gap-2 shadow-lg",
                      isDark
                        ? "bg-white text-indigo-950 hover:bg-indigo-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                    )}>
                      <Zap className={cn("w-5 h-5", isDark ? "fill-indigo-600" : "fill-white")} /> Agendar Demonstração
                    </a>
                  </div>
                </div>
              </div>
            </FadeIn>
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
