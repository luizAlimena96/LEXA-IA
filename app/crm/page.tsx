'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useOrganization } from '@/app/contexts/OrganizationContext';
import api from '@/app/lib/api-client';
import KanbanBoard from './components/KanbanBoard';
import LeadFilters from './components/LeadFilters';
import LeadChatModal from './components/LeadChatModal';
import StageModal from './components/StageModal';
import CRMAutomationsManager from './components/CRMAutomationsManager';
import { useCRMRealtime } from '@/app/hooks/useCRMRealtime';
import { Plus, Loader2, RefreshCw, Settings, Zap, Wifi, WifiOff } from 'lucide-react';

interface CRMStage {
    id: string;
    name: string;
    color: string;
    order: number;
    description?: string;
}

interface Lead {
    id: string;
    name: string | null;
    phone: string;
    email?: string;
    status: string;
    currentState?: string;
    conversationSummary?: string;
    extractedData?: any;
    crmStageId?: string;
    agentId: string;
    updatedAt: string;
    conversations?: Array<{
        id: string;
        lastMessageAt?: string;
        unreadCount?: number;
        tags?: Array<{ id: string; name: string; color: string }>;
    }>;
}

interface Tag {
    id: string;
    name: string;
    color: string;
}

export default function CRMPage() {
    const { user } = useAuth();
    const { selectedOrgId } = useOrganization();

    const [stages, setStages] = useState<CRMStage[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showStageModal, setShowStageModal] = useState(false);
    const [editingStage, setEditingStage] = useState<CRMStage | null>(null);
    const [showAutomations, setShowAutomations] = useState(false);

    const organizationId = selectedOrgId;

    // Real-time updates via WebSocket
    const handleRealtimeUpdate = useCallback((event: any) => {
        // Ignore message events as they are handled locally by LeadChatModal
        if (event.type === 'message_received') {
            return;
        }

        console.log('[CRM] Real-time update received:', event.type);
        // Reload data on other CRM events (stage changes, new leads, etc)
        loadDataSilent();
    }, []);

    const { isConnected } = useCRMRealtime({
        organizationId,
        onUpdate: handleRealtimeUpdate,
        enabled: !!organizationId,
    });

    useEffect(() => {
        if (organizationId) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [organizationId, selectedAgentId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load agents first
            const agentsResponse = await api.agents.list(organizationId);
            setAgents(agentsResponse);

            // Verify if selected agent belongs to this organization
            let activeAgentId = selectedAgentId;
            const agentExists = agentsResponse.some((a: any) => a.id === selectedAgentId);

            if (selectedAgentId && !agentExists) {
                console.log('[CRM] Selected agent does not belong to organization, resetting...');
                activeAgentId = '';
            }

            // If no valid agent selected, use first one from the list
            const agentId = activeAgentId || agentsResponse[0]?.id;

            if (!agentId) {
                console.log('[CRM] No agents found for organization');
                setLoading(false);
                return;
            }

            // If we had to change the agent ID (either becase it was invalid or empty)
            if (activeAgentId !== agentId) {
                console.log('[CRM] Switching to agent:', agentId);
                setSelectedAgentId(agentId);
                return; // allow the useEffect to re-trigger with the correct agent
            }

            // Load CRM stages for selected agent
            const stagesResponse = await api.agents.crmStages.list(agentId);
            setStages(stagesResponse.sort((a: CRMStage, b: CRMStage) => a.order - b.order));

            // Load leads for this agent
            const leadsResponse = await api.leads.list({
                organizationId,
                agentId
            });
            setLeads(leadsResponse);

            if (selectedLead) {
                const updatedLead = leadsResponse.find((l: Lead) => l.id === selectedLead.id);
                if (updatedLead) {
                    setSelectedLead(updatedLead);
                }
            }

            // Load tags
            const tagsResponse = await api.tags.list(organizationId);
            setTags(tagsResponse);

        } catch (error) {
            console.error('Error loading CRM data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Silent reload without showing loading spinner (for real-time updates)
    const loadDataSilent = async () => {
        if (!organizationId || !selectedAgentId) return;

        try {
            const [stagesResponse, leadsResponse, tagsResponse] = await Promise.all([
                api.agents.crmStages.list(selectedAgentId),
                api.leads.list({ organizationId, agentId: selectedAgentId }),
                api.tags.list(organizationId),
            ]);

            setStages(stagesResponse.sort((a: CRMStage, b: CRMStage) => a.order - b.order));
            setLeads(leadsResponse);
            setTags(tagsResponse);

            // Update selected lead if it exists
            if (selectedLead) {
                const updatedLead = leadsResponse.find((l: Lead) => l.id === selectedLead.id);
                if (updatedLead) {
                    setSelectedLead(updatedLead);
                }
            }
        } catch (error) {
            console.error('Error refreshing CRM data:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        setShowChatModal(true);
    };

    const handleLeadMove = async (leadId: string, newStageId: string) => {
        try {
            // Optimistic update
            setLeads(prev => prev.map(l =>
                l.id === leadId ? { ...l, crmStageId: newStageId } : l
            ));

            // API call
            await api.leads.update(leadId, { crmStageId: newStageId });
        } catch (error) {
            console.error('Error moving lead:', error);
            // Revert on error
            await loadData();
        }
    };

    const handleCreateStage = () => {
        setEditingStage(null);
        setShowStageModal(true);
    };

    const handleEditStage = (stage: CRMStage) => {
        setEditingStage(stage);
        setShowStageModal(true);
    };

    const handleSaveStage = async (stageData: Partial<CRMStage>) => {
        try {
            if (editingStage) {
                await api.agents.crmStages.update(selectedAgentId, editingStage.id, stageData);
            } else {
                await api.agents.crmStages.create(selectedAgentId, {
                    ...stageData,
                    order: stages.length
                });
            }
            setShowStageModal(false);
            await loadData();
        } catch (error) {
            console.error('Error saving stage:', error);
        }
    };

    const handleDeleteStage = async (stageId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta etapa?')) return;

        try {
            await api.agents.crmStages.delete(selectedAgentId, stageId);
            await loadData();
        } catch (error) {
            console.error('Error deleting stage:', error);
        }
    };

    // Filter leads
    const safeLeads = Array.isArray(leads) ? leads : [];
    const filteredLeads = safeLeads.filter(lead => {
        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const matchesName = lead.name?.toLowerCase().includes(search);
            const matchesPhone = lead.phone.includes(search);
            const matchesEmail = lead.email?.toLowerCase().includes(search);
            if (!matchesName && !matchesPhone && !matchesEmail) return false;
        }

        // Tag filter
        if (selectedTags.length > 0) {
            const leadTags = lead.conversations?.[0]?.tags?.map(t => t.id) || [];
            const hasMatchingTag = selectedTags.some(tagId => leadTags.includes(tagId));
            if (!hasMatchingTag) return false;
        }

        return true;
    });

    // Group leads by stage
    const safeStages = Array.isArray(stages) ? stages : [];
    const leadsByStage = safeStages.reduce((acc, stage) => {
        acc[stage.id] = filteredLeads.filter(l => l.crmStageId === stage.id);
        return acc;
    }, {} as Record<string, Lead[]>);

    // Leads without stage go to first column or "uncategorized"
    const uncategorizedLeads = filteredLeads.filter(l => !l.crmStageId);

    // Get all available data keys from leads extracted data
    const availableDataKeys = Array.from(new Set(
        safeLeads.flatMap(l => l.extractedData ? Object.keys(l.extractedData) : [])
    )).sort();

    if (!organizationId) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center max-w-md">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Selecione uma Organização</h2>
                    <p className="mb-6">
                        Para visualizar o CRM e gerenciar leads, por favor selecione uma organização no menu superior.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Gerencie seus leads e acompanhe o progresso
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* WebSocket connection indicator */}
                            <div
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${isConnected
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}
                                title={isConnected ? 'Conectado - Atualizações em tempo real' : 'Desconectado'}
                            >
                                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                {isConnected ? 'Ao vivo' : 'Offline'}
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                                onClick={() => setShowAutomations(!showAutomations)}
                                className={`p-2 rounded-lg transition-colors ${showAutomations ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-900/60' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                title="Automações"
                            >
                                <Zap className="w-5 h-5" />
                            </button>

                            <button
                                onClick={handleCreateStage}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                                Nova Etapa
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <LeadFilters
                        agents={agents}
                        tags={tags}
                        selectedAgentId={selectedAgentId}
                        selectedTags={selectedTags}
                        searchTerm={searchTerm}
                        onAgentChange={setSelectedAgentId}
                        onTagsChange={setSelectedTags}
                        onSearchChange={setSearchTerm}
                    />
                </div>
            </div>

            {/* Kanban Board with Automations Sidebar */}
            <div className="p-6 flex gap-4">
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {stages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Settings className="w-16 h-16 mb-4 opacity-50" />
                            <h3 className="text-xl font-medium mb-2">Nenhuma etapa configurada</h3>
                            <p className="text-sm mb-4">Crie etapas para organizar seus leads no CRM</p>
                            <button
                                onClick={handleCreateStage}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Criar Primeira Etapa
                            </button>
                        </div>
                    ) : (
                        <KanbanBoard
                            stages={stages}
                            leadsByStage={leadsByStage}
                            uncategorizedLeads={uncategorizedLeads}
                            onLeadClick={handleLeadClick}
                            onLeadMove={handleLeadMove}
                            onEditStage={handleEditStage}
                            onDeleteStage={handleDeleteStage}
                        />
                    )}
                </div>

                {/* Automations Sidebar */}
                {showAutomations && (
                    <div className="w-80 flex-shrink-0">
                        <CRMAutomationsManager
                            key={organizationId} // Force remount on org change
                            agentId={selectedAgentId}
                            organizationId={organizationId || ''}
                            stages={stages}
                            tags={tags}
                            availableDataKeys={availableDataKeys}
                            onRefresh={loadData}
                        />
                    </div>
                )}
            </div>

            {/* Chat Modal */}
            {showChatModal && selectedLead && (
                <LeadChatModal
                    lead={selectedLead}
                    stages={stages}
                    tags={tags}
                    onClose={() => {
                        setShowChatModal(false);
                        setSelectedLead(null);
                    }}
                    onLeadUpdate={loadData}
                    onLeadDelete={() => {
                        setShowChatModal(false);
                        setSelectedLead(null);
                        loadData();
                    }}
                />
            )}

            {/* Stage Modal */}
            {showStageModal && (
                <StageModal
                    stage={editingStage}
                    onSave={handleSaveStage}
                    onClose={() => {
                        setShowStageModal(false);
                        setEditingStage(null);
                    }}
                />
            )}
        </div>
    );
}
