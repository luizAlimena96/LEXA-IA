'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Moon, Sun, ArrowLeft, Briefcase, Upload, CheckCircle, User, Mail, Phone, FileText, Linkedin } from 'lucide-react';
import api from '../lib/api-client';

export default function TrabalheConoscoPage() {
    const [isDark, setIsDark] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        linkedin: '',
        position: '',
        message: '',
        resume: null as File | null,
    });

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
    const cardBg = isDark ? 'bg-white/[0.03] border-white/[0.05]' : 'bg-white border-slate-200 shadow-sm';
    const glassHeader = isDark ? 'bg-[#05050A]/80 border-white/5' : 'bg-white/80 border-slate-200';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('O arquivo deve ter no máximo 5MB');
                return;
            }
            if (!file.type.includes('pdf')) {
                setError('Apenas arquivos PDF são permitidos');
                return;
            }
            setFormData({ ...formData, resume: file });
            setFileName(file.name);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('linkedin', formData.linkedin);
            submitData.append('position', formData.position);
            submitData.append('message', formData.message);
            if (formData.resume) {
                submitData.append('resume', formData.resume);
            }

            // Usando o endpoint de contato/carreiras
            await api.post('/contact/careers', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setIsSubmitted(true);
        } catch (error: any) {
            console.error('Error:', error);
            setError(error.response?.data?.message || 'Erro ao enviar candidatura. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

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
                <div className={cn("absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] rounded-full blur-[120px] opacity-20", isDark ? "bg-indigo-900" : "bg-indigo-300")} />
                <div className={cn("absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] opacity-20", isDark ? "bg-purple-900" : "bg-purple-300")} />
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
                            <Link href="/landing" className={cn("text-sm font-medium transition-colors hover:text-indigo-500", textMain)}>
                                Voltar
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <section className="pt-32 pb-24 px-6">
                    <div className="max-w-4xl mx-auto">
                        {!isSubmitted ? (
                            <>
                                {/* Header */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="text-center mb-12"
                                >
                                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                        Trabalhe Conosco
                                    </h1>
                                    <p className={cn("text-xl max-w-2xl mx-auto", textMuted)}>
                                        Faça parte do time que está transformando o comercial jurídico com tecnologia e IA.
                                    </p>
                                </motion.div>

                                {/* Form */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className={cn("rounded-3xl border p-8 md:p-10", cardBg)}
                                >
                                    {error && (
                                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <p className="text-red-500 text-sm">{error}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Nome */}
                                        <div>
                                            <label className={cn("block text-sm font-medium mb-2", textMain)}>
                                                Nome Completo *
                                            </label>
                                            <div className="relative">
                                                <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", textMuted)} />
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                    placeholder="Seu nome completo"
                                                    className={cn("w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDark ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900")}
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className={cn("block text-sm font-medium mb-2", textMain)}>
                                                Email *
                                            </label>
                                            <div className="relative">
                                                <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", textMuted)} />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    required
                                                    placeholder="seu@email.com"
                                                    className={cn("w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDark ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900")}
                                                />
                                            </div>
                                        </div>

                                        {/* Telefone */}
                                        <div>
                                            <label className={cn("block text-sm font-medium mb-2", textMain)}>
                                                Telefone *
                                            </label>
                                            <div className="relative">
                                                <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", textMuted)} />
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    required
                                                    placeholder="(00) 00000-0000"
                                                    className={cn("w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDark ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900")}
                                                />
                                            </div>
                                        </div>

                                        {/* LinkedIn */}
                                        <div>
                                            <label className={cn("block text-sm font-medium mb-2", textMain)}>
                                                LinkedIn
                                            </label>
                                            <div className="relative">
                                                <Linkedin className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", textMuted)} />
                                                <input
                                                    type="url"
                                                    value={formData.linkedin}
                                                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                                    placeholder="https://linkedin.com/in/seu-perfil"
                                                    className={cn("w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDark ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900")}
                                                />
                                            </div>
                                        </div>

                                        {/* Cargo Pretendido */}
                                        <div>
                                            <label className={cn("block text-sm font-medium mb-2", textMain)}>
                                                Cargo Pretendido *
                                            </label>
                                            <div className="relative">
                                                <Briefcase className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none", textMuted)} />
                                                <select
                                                    value={formData.position}
                                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                                    required
                                                    className={cn("w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer", isDark ? "bg-white/5 border-white/10 text-white [&>option]:bg-slate-800 [&>option]:text-white" : "bg-white border-slate-200 text-slate-900 [&>option]:bg-white [&>option]:text-slate-900")}
                                                >
                                                    <option value="" disabled>Selecione o cargo desejado</option>
                                                    <option value="Desenvolvedor Full Stack">Desenvolvedor Full Stack</option>
                                                    <option value="Desenvolvedor Backend">Desenvolvedor Backend</option>
                                                    <option value="Desenvolvedor Frontend">Desenvolvedor Frontend</option>
                                                    <option value="SDR (Representante de Desenvolvimento de Vendas)">SDR (Representante de Desenvolvimento de Vendas)</option>
                                                    <option value="Gestor de Tráfego">Gestor de Tráfego</option>
                                                    <option value="Closer">Closer</option>
                                                </select>
                                                <svg className={cn("absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none", textMuted)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Carta de Apresentação */}
                                        <div>
                                            <label className={cn("block text-sm font-medium mb-2", textMain)}>
                                                Carta de Apresentação *
                                            </label>
                                            <div className="relative">
                                                <FileText className={cn("absolute left-3 top-3 w-5 h-5", textMuted)} />
                                                <textarea
                                                    value={formData.message}
                                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                    required
                                                    rows={5}
                                                    placeholder="Conte-nos um pouco sobre você, suas experiências e por que quer fazer parte da Lexa..."
                                                    className={cn("w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none", isDark ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900")}
                                                />
                                            </div>
                                        </div>

                                        {/* Upload Currículo */}
                                        <div>
                                            <label className={cn("block text-sm font-medium mb-2", textMain)}>
                                                Currículo (PDF) *
                                            </label>
                                            <div className={cn("relative border-2 border-dashed rounded-xl p-6 transition-all hover:border-indigo-500/50", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={handleFileChange}
                                                    required
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="text-center">
                                                    <Upload className={cn("w-10 h-10 mx-auto mb-3", textMuted)} />
                                                    {fileName ? (
                                                        <p className={cn("text-sm font-medium", textMain)}>{fileName}</p>
                                                    ) : (
                                                        <>
                                                            <p className={cn("text-sm font-medium mb-1", textMain)}>
                                                                Clique para fazer upload ou arraste o arquivo
                                                            </p>
                                                            <p className={cn("text-xs", textMuted)}>
                                                                PDF até 5MB
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-4 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-indigo-500/25"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Enviando...
                                                </span>
                                            ) : (
                                                'Enviar Candidatura'
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="text-center py-16"
                            >
                                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                    Candidatura Enviada!
                                </h2>
                                <p className={cn("text-xl mb-8 max-w-2xl mx-auto", textMuted)}>
                                    Obrigado pelo interesse em fazer parte da Lexa! Recebemos sua candidatura e entraremos em contato em breve.
                                </p>
                                <Link
                                    href="/landing"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-indigo-500/25"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Voltar para Home
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
