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
            {/* Logo + Nav */}
            <div className="flex items-center gap-12">
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

              <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                {['Recursos', 'Comparativo', 'Como Funciona', 'FAQ'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className={cn("transition-colors hover:text-indigo-500 relative group", textMuted)}>
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
                  </a>
                ))}
              </nav>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button onClick={toggleTheme} className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-slate-100")}>
                {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
              <a href="https://wa.me/5541988037508" target="_blank" className={cn("text-sm font-medium transition-colors hover:text-indigo-500", textMain)}>
                Falar com Nossa IA
              </a>
              <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95">
                Acessar Plataforma
              </Link>
            </div>

            {/* Mobile Toggle */}
            <div className="md:hidden flex items-center gap-4">
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
                className={cn("md:hidden border-b backdrop-blur-xl", glassHeader)}
              >
                <div className="px-6 py-6 flex flex-col gap-4">
                  {['Recursos', 'Comparativo', 'Como Funciona', 'FAQ'].map((item) => (
                    <a key={item} onClick={() => setMobileMenuOpen(false)} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-lg font-medium opacity-80">
                      {item}
                    </a>
                  ))}
                  <hr className="border-white/10 my-2" />
                  <Link href="/login" className="bg-indigo-600 text-white py-3 rounded-xl text-center font-semibold">
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

        {/* FEATURES with Hover Effects */}
        <section id="recursos" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Tecnologia que <span className="text-indigo-500">Converte</span></h2>
              <p className={cn("text-xl max-w-2xl mx-auto", textMuted)}>Todas as ferramentas que um escritório moderno precisa para escalar.</p>
            </FadeIn>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -10, transition: { duration: 0.2 } }}
                    className={cn("group p-8 rounded-3xl border transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl h-full", cardBg)}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-7 h-7 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className={cn("leading-relaxed", textMuted)}>{feature.description}</p>
                  </motion.div>
                </FadeIn>
              ))}
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
