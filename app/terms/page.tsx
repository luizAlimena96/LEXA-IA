"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, FileText, Scale } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] text-gray-900 dark:text-gray-100 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-[#12121d] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <img src="/lexa-logo.png" alt="LEXA Logo" className="w-8 h-8 object-contain" />
                            <span className="font-semibold text-lg">Termos e Privacidade</span>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Atualizado em: {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="space-y-12">

                    {/* Introdução Visual */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg mb-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <img src="/lexa-logo.png" alt="LEXA Watermark" className="w-64 h-64 object-contain" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <img src="/lexa-logo.png" alt="LEXA Logo" className="w-12 h-12 object-contain bg-white/10 rounded-lg p-2 backdrop-blur-sm" />
                                <ShieldCheck className="w-8 h-8 opacity-90" />
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Política de Privacidade & Termos de Uso</h1>
                        </div>
                        <p className="opacity-90 max-w-2xl relative z-10">
                            Transparência total sobre como tratamos seus dados e as regras para uso da nossa plataforma.
                            Leia atentamente os termos abaixo.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#12121d] rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-800/50">
                        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
                            <Lock className="w-6 h-6" />
                            POLÍTICA DE PRIVACIDADE PLATAFORMA "LEXA"
                        </h2>

                        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed text-sm text-justify">
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">1. Cláusula Primeira – INFORMAÇÕES GERAIS</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Objeto.</strong> O presente Aviso de Privacidade contém informações a respeito do modo como tratamos, total ou parcialmente, de forma automatizada ou não, os dados pessoais dos Usuários que acessam nossa Plataforma. Seu objetivo é esclarecer quanto aos tipos de dados coletados, os motivos da coleta e a forma como o Usuário poderá atualizar, gerenciar ou excluir estas informações.
                                    </li>
                                    <li>
                                        <strong>Controlador de Dados.</strong> Todos os dados eventualmente coletados para a realização dos serviços prestados pela LEXA AI LTDA.
                                    </li>
                                    <li>
                                        <strong>Legislação Base.</strong> Este Aviso de Privacidade foi elaborado em conformidade com a Lei Federal n. 12.965 de 23 de abril de 2014 (Marco Civil da Internet), com a Lei Federal n. 13.709, de 14 de agosto de 2018 (Lei de Proteção de Dados Pessoais) e com o Regulamento UE n. 2016/679 de 27 de abril de 2016 (Regulamento Geral Europeu de Proteção de Dados Pessoais - RGDP).
                                    </li>
                                    <li>
                                        <strong>Finalidade do Tratamento de Dados.</strong> Os dados pessoais coletados são tratados com a finalidade exclusiva de viabilizar o cumprimento do contrato firmado entre as partes e garantir a adequada prestação dos serviços contratados. O tratamento inclui atividades como gestão cadastral, comunicação, execução dos serviços, faturamento, suporte técnico e demais ações necessárias para o pleno atendimento das obrigações contratuais. O tratamento dos dados será realizado conforme o disposto neste Aviso de Privacidade, de acordo com a legislação aplicável, assegurando a confidencialidade, integridade e segurança das informações.
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">2. Cláusula Segunda – DIREITOS DO USUÁRIO</h3>
                                <p>O Usuário da Plataforma LEXA possui os seguintes direitos (Confirmação e acesso, Retificação, Eliminação, Oposição e Portabilidade).</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">3. Cláusula Terceira – DAS INFORMAÇÕES COLETADAS</h3>
                                <p>Dados de identificação (nome, e-mail, redes sociais, telefone, CPF/CNPJ), formulário de contato, execução de contratos, registros de acesso (mínimo 6 meses) e newsletter.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">4. Cláusula Quarta – DO TRATAMENTO DOS DADOS PESSOAIS</h3>
                                <p>Responsável pelo tratamento: Controlador. Encarregado de Proteção de Dados (DPO): Equipe de Privacidade (privacidade@lexa-ia.com.br).</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">5. Cláusula Quinta – DA SEGURANÇA NO TRATAMENTO</h3>
                                <p>Utilização de certificado SSL e medidas técnicas para proteção contra acessos não autorizados.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">6. Cláusula Sexta – DADOS DE NAVEGAÇÃO (COOKIES)</h3>
                                <p>Uso de cookies para melhorar a experiência, incluindo de redes sociais (Facebook, Twitter, Instagram, etc).</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#12121d] rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-800/50">
                        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-6 flex items-center gap-2">
                            <Scale className="w-6 h-6" />
                            TERMOS E CONDIÇÕES GERAIS DE USO "LEXA"
                        </h2>

                        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed text-sm text-justify">
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">1. Cláusula Primeira – DO OBJETO</h3>
                                <p>A Plataforma caracteriza-se pela prestação de serviço de aproximação de Usuários e Clientes para aprimoramento e recuperação de vendas via ferramenta de automação e inteligência artificial para canais de atendimento.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">2. Cláusula Segunda – DA LICENÇA E USO</h3>
                                <p>Licença de uso de software como serviço (SaaS). O uso implica aceitação integral das normas.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">3. Cláusula Terceira – DESCRIÇÃO E GARANTIAS</h3>
                                <p>A LEXA opera conforme as diretrizes das plataformas integradas (WhatsApp, Instagram, etc) e não se responsabiliza por bloqueios decorrentes de mau uso ou violação das políticas dessas plataformas terceiras por parte do Usuário.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">4. Cláusula Quarta – DA NAVEGAÇÃO</h3>
                                <p>Compromisso de disponibilidade, salvo manutenções programadas ou falhas em serviços de terceiros.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">5. Cláusula Quinta – DA GESTÃO</h3>
                                <p>Direito de suspender ou limitar acesso para manutenção ou segurança.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">6. Cláusula Sexta – DO CADASTRO</h3>
                                <p>Apenas para pessoas plenamente capazes. Dados devem ser verídicos.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">7. Cláusula Sétima – DIREITOS AUTORAIS</h3>
                                <p>Toda a estrutura, código, IA e conteúdos são de propriedade exclusiva da LEXA.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">8. Cláusula Oitava – PREÇOS E PAGAMENTO</h3>
                                <p>Conforme plano contratado. Renovação automática salvo cancelamento prévio.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">9. Cláusula Nona – DO CANCELAMENTO</h3>
                                <p>Usuário pode cancelar a qualquer tempo. O acesso permanece ativo até o fim do ciclo pago.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">10. Cláusula Décima – SUPORTE</h3>
                                <p>E-mail: suporte@lexa-ia.com.br.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">11. Cláusula Onze – DO FORO</h3>
                                <p>Foro da comarca da sede da LEXA para dirimir litígios.</p>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-12 text-center text-xs text-gray-400 dark:text-gray-500">
                    &copy; {new Date().getFullYear()} LEXA IA. Todos os direitos reservados.
                </div>
            </div>
        </div>
    );
}
