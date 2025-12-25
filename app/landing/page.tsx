'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  DocumentCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: ClockIcon,
    title: 'Atendimento 24/7',
    description: 'Responde leads em segundos, qualquer hora do dia ou noite.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Qualificação Inteligente',
    description: 'Perguntas estratégicas para identificar interesse e urgência.',
  },
  {
    icon: CalendarDaysIcon,
    title: 'Agendamento Automático',
    description: 'Integra com Google Calendar e agenda reuniões automaticamente.',
  },
  {
    icon: CpuChipIcon,
    title: 'Multimodal',
    description: 'Entende áudios, imagens, documentos e responde em áudio.',
  },
  {
    icon: ChartBarIcon,
    title: 'CRM Integrado',
    description: 'Atualização automática do CRM com dados qualificados.',
  },
  {
    icon: DocumentCheckIcon,
    title: 'Follow-up Automático',
    description: 'Acompanhamento personalizado sem esforço manual.',
  },
];

const chatbotComparison = {
  traditional: [
    'Conversão cai',
    'Atendimento engessado',
    'Clientes estressados',
    'Solicitam atendimento humano',
  ],
  lexa: [
    'Atendimento 24/7',
    'Follow-up automático e personalizado',
    'Perguntas estratégicas',
    'Identificação de interesse e urgência',
    'Organização do lead',
    'Agendamento automático',
    'Atualiza o CRM automático',
    'Integração universal',
  ],
};

const faqItems = [
  {
    question: 'A Lexa substitui o atendimento humano?',
    answer:
      'Sim e não. A Lexa pode automatizar do primeiro contato até a assinatura (recomendado para escritórios que trabalham com processos em massa para público D e E). Mas na maioria dos casos, recomendamos utilizá-la com o primeiro atendimento, qualificação e agendamento para contato em reunião com advogado ou closer.',
  },
  {
    question: 'A IA funciona para qualquer área do direito?',
    answer:
      'Funciona, desde que o fluxo seja configurado para os serviços oferecidos pelo escritório.',
  },
  {
    question: 'A Lexa fecha contratos sozinha?',
    answer: 'Sim. O fechamento depende da estratégia e configuração do escritório.',
  },
  {
    question: 'A Lexa tem CRM?',
    answer:
      'Sim, temos um CRM que está 100% integrado com as mensagens da IA. Se o lead é qualificado, a pipeline atualiza automaticamente.',
  },
  {
    question: 'A Lexa integra com o meu CRM?',
    answer:
      'Sim, integramos com a maioria dos CRMs do mercado. Agende uma demonstração para consultar esse serviço.',
  },
  {
    question: 'A Lexa funciona só no WhatsApp?',
    answer:
      'Sim. Mas estamos em desenvolvimento para automatização do atendimento no Instagram com tudo integrado!',
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('landing-theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('landing-theme', newTheme ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark
        ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-indigo-50 to-white'
      }`}>
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? isDark
              ? 'bg-slate-950/90 backdrop-blur-md shadow-lg'
              : 'bg-white/90 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
          }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/landing" className="flex items-center gap-2">
                <Image
                  src="/lexa-logo.png"
                  alt="Lexa Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl object-contain"
                />
                <span className={`font-bold text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Lexa</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Recursos
              </a>
              <a href="#comparativo" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Comparativo
              </a>
              <a href="#como-funciona" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Como Funciona
              </a>
              <a href="#quem-somos" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                Quem Somos
              </a>
              <a href="#faq" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                FAQ
              </a>
            </div>

            {/* CTA Buttons + Theme Toggle */}
            <div className="hidden md:flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${isDark
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                aria-label="Toggle theme"
              >
                {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <a
                href="https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa"
                target="_blank"
                rel="noopener noreferrer"
                className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                Agendar Demo
              </a>
              <Link
                href="/login"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-full font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-indigo-500/25"
              >
                Acessar Plataforma
              </Link>
            </div>

            {/* Mobile menu button + Theme Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${isDark
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                aria-label="Toggle theme"
              >
                {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button
                className={`p-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className={`md:hidden backdrop-blur-md rounded-2xl mt-2 p-4 border ${isDark
                ? 'bg-slate-900/95 border-white/10'
                : 'bg-white/95 border-gray-200'
              }`}>
              <div className="flex flex-col gap-4">
                <a href="#features" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors py-2`}>
                  Recursos
                </a>
                <a href="#comparativo" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors py-2`}>
                  Comparativo
                </a>
                <a href="#como-funciona" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors py-2`}>
                  Como Funciona
                </a>
                <a href="#quem-somos" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors py-2`}>
                  Quem Somos
                </a>
                <a href="#faq" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors py-2`}>
                  FAQ
                </a>
                <hr className={isDark ? 'border-white/10' : 'border-gray-200'} />
                <a
                  href="https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors py-2`}
                >
                  Agendar Demo
                </a>
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold text-center"
                >
                  Acessar Plataforma
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-wave ${isDark ? 'bg-indigo-500/30' : 'bg-indigo-400/20'
            }`} />
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-wave-slow ${isDark ? 'bg-purple-500/30' : 'bg-purple-400/20'
            }`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-wave-reverse ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-300/20'
            }`} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`inline-flex items-center gap-2 backdrop-blur-md border rounded-full px-4 py-2 mb-8 ${isDark
              ? 'bg-white/10 border-white/20'
              : 'bg-indigo-100/80 border-indigo-200'
            }`}>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tecnologia de ponta para escritórios de advocacia</span>
          </div>

          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            IA de atendimento comercial
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              para escritórios de advocacia
            </span>
          </h1>

          <p className={`text-xl md:text-2xl max-w-3xl mx-auto mb-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Responde leads em segundos, qualifica automaticamente, fecha contratos e agenda reuniões
            para o seu time comercial.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl hover:shadow-indigo-500/25 flex items-center gap-2"
            >
              Agendar Demonstração
              <ArrowRightIcon className="w-5 h-5" />
            </a>
            <Link
              href="/login"
              className={`backdrop-blur-md border px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center gap-2 ${isDark
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100 shadow-lg'
                }`}
            >
              Acessar Plataforma
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Aumente sua conversão com tecnologia e IA
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              A Lexa automatiza o primeiro contato comercial do seu escritório.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 ${isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50'
                    : 'bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm hover:shadow-lg'
                  }`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparativo" className={`py-20 md:py-32 ${isDark
          ? 'bg-gradient-to-b from-transparent via-indigo-950/50 to-transparent'
          : 'bg-gradient-to-b from-transparent via-indigo-100/50 to-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Muito mais que um chatbot
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Tudo estruturado para processo comercial, não apenas atendimento.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Traditional Chatbots */}
            <div className={`backdrop-blur-md border rounded-2xl p-8 ${isDark
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-red-50 border-red-200'
              }`}>
              <h3 className="text-2xl font-bold text-red-500 mb-6">Chatbots Tradicionais</h3>
              <ul className="space-y-4">
                {chatbotComparison.traditional.map((item, index) => (
                  <li key={index} className={`flex items-center gap-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Lexa */}
            <div className={`backdrop-blur-md border rounded-2xl p-8 ${isDark
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-green-50 border-green-200'
              }`}>
              <h3 className="text-2xl font-bold text-green-500 mb-6">Lexa</h3>
              <ul className="space-y-4">
                {chatbotComparison.lexa.map((item, index) => (
                  <li key={index} className={`flex items-center gap-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Como ter a Lexa no seu Comercial?
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Em poucos passos sua equipe recebe leads qualificados e prontos para fechar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Escolha seu plano',
                description: 'SellerIA prontas plug and play ou implementação personalizada.',
              },
              {
                step: '2',
                title: 'Agende demonstração',
                description: 'Validamos fluxos, integrações e usabilidade com você.',
              },
              {
                step: '3',
                title: 'Receba leads prontos',
                description: 'O comercial recebe leads qualificados e prontos para fechar.',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className={`backdrop-blur-md border rounded-2xl p-8 h-full ${isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6 text-white font-bold text-xl">
                    {item.step}
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRightIcon className="w-8 h-8 text-indigo-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="quem-somos" className={`py-20 md:py-32 ${isDark
          ? 'bg-gradient-to-b from-transparent via-purple-950/30 to-transparent'
          : 'bg-gradient-to-b from-transparent via-purple-100/30 to-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quem Somos</h2>
            </div>

            <div className={`backdrop-blur-md border rounded-2xl p-8 md:p-12 ${isDark
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-gray-200 shadow-lg'
              }`}>
              <p className={`text-lg leading-relaxed mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                A Lexa foi criada por quem vive, na prática, a realidade de escritórios de advocacia
                100% digitais.
              </p>
              <p className={`text-lg leading-relaxed mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                A empresa nasce da experiência de <strong className={isDark ? 'text-white' : 'text-gray-900'}>Samuel Tramontin</strong> e{' '}
                <strong className={isDark ? 'text-white' : 'text-gray-900'}>Lauro Tramontin</strong>, que acumulam milhões de reais em
                faturamento gerados para escritórios de advocacia, próprios e de terceiros, por meio de
                funis de marketing e comercial totalmente digitais.
              </p>
              <p className={`text-lg leading-relaxed mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Como sócio investidor, a Lexa conta com <strong className={isDark ? 'text-white' : 'text-gray-900'}>Altair Toledo</strong>,
                28 anos de KPMG, Vice presidente da Federasul, Professor MBA da PUCRS, trazendo visão
                estratégica e governança para o projeto.
              </p>
              <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                A Lexa surge da junção entre experiência real de geração de demanda, operação comercial
                estruturada e visão técnica de alto nível, aplicada especificamente ao mercado jurídico.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Perguntas Frequentes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className={`backdrop-blur-md border rounded-xl overflow-hidden ${isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-gray-200 shadow-sm'
                  }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className={`text-lg font-medium pr-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.question}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-indigo-500 flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''
                      }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-96' : 'max-h-0'
                    }`}
                >
                  <p className={`px-6 pb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Pronto para transformar seu comercial?
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
                Comece agora mesmo a fechar mais contratos com a Lexa.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://wa.me/5541988037508?text=Olá!%20Tenho%20interesse%20em%20saber%20mais%20sobre%20a%20Lexa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl flex items-center gap-2"
                >
                  Agendar Demonstração
                  <ArrowRightIcon className="w-5 h-5" />
                </a>
                <Link
                  href="/login"
                  className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  Acessar Plataforma
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Image
                src="/lexa-logo.png"
                alt="Lexa Logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg object-contain"
              />
              <span className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Lexa</span>
            </div>

            <div className={`flex items-center gap-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Link href="/terms" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>
                Política de Privacidade
              </Link>
              <a
                href="https://www.instagram.com/lexaatendimento/"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}
              >
                Instagram
              </a>
              <a
                href="https://www.linkedin.com/company/lexaatendimento/"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}
              >
                LinkedIn
              </a>
            </div>

            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              © {new Date().getFullYear()} Lexa. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
