'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/app/contexts/OrganizationContext';
import { Settings, Database, Code, GitBranch } from 'lucide-react';
import { CrmConfig, FieldMapping, Automation } from './components/interfaces';
import CrmConfigTab from './components/CrmConfigTab';
import ApiTestTab from './components/ApiTestTab';
import FieldMappingTab from './components/FieldMappingTab';
import AutomationsTab from './components/AutomationsTab';
import api from '@/app/lib/api-client';

export default function CrmIntegrationPage() {
    const { selectedOrgId: orgId } = useOrganization();
    const [activeTab, setActiveTab] = useState('config');
    const [loading, setLoading] = useState(true);

    const [crmConfigs, setCrmConfigs] = useState<CrmConfig[]>([]);
    const [selectedCrmConfig, setSelectedCrmConfig] = useState<string>('');
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
    const [crmName, setCrmName] = useState('');
    const [config, setConfig] = useState({
        crmType: 'custom',
        crmEnabled: true,
        crmWebhookUrl: '',
        crmApiKey: '',
        crmAuthType: 'bearer',
    });

    const [agentStates, setAgentStates] = useState<any[]>([]);
    const [selectedState, setSelectedState] = useState<string>('');
    const [agentId, setAgentId] = useState<string>('');

    useEffect(() => {
        if (orgId) {
            fetchAgent();
            fetchConfig();
            fetchCrmConfigs();
            fetchAgentStates();
        }
    }, [orgId]);

    useEffect(() => {
        if (selectedCrmConfig) {
            fetchAutomations();
        }
    }, [selectedCrmConfig, selectedState]);

    const fetchAgent = async () => {
        try {
            if (!orgId) return;
            const agents = await api.agents.list(orgId);
            if (agents.length > 0) {
                setAgentId(agents[0].id);
            }
        } catch (error) {
            console.error('Error loading agent:', error);
        }
    };

    const fetchConfig = async () => {
        try {
            if (!orgId) return;
            const data = await api.organizations.list();
            const org = data.find(o => o.id === orgId);
            if (org?.crmFieldMapping) {
                setFieldMappings(org.crmFieldMapping);
            }
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCrmConfigs = async () => {
        try {
            if (!orgId) return;
            const data = await api.crm.configs.list(orgId);
            setCrmConfigs(data);
        } catch (error) {
            console.error('Error loading CRM configs:', error);
        }
    };

    const fetchAgentStates = async () => {
        try {
            const data = await api.states.list();
            setAgentStates(data);
        } catch (error) {
            console.error('Error loading agent states:', error);
        }
    };

    const fetchAutomations = async () => {
        try {
            if (!orgId) return;
            const data = await api.crm.automations.list(orgId);
            // Filter by crmConfigId and optionally by stage
            const filtered = data.filter((a: any) => {
                if (a.crmConfigId !== selectedCrmConfig) return false;
                if (selectedState && a.crmStageId !== selectedState) return false;
                return true;
            });
            setAutomations(filtered);
        } catch (error) {
            console.error('Error fetching automations:', error);
            setAutomations([]);
        }
    };

    const handleSaveMappings = async () => {
        try {
            if (!orgId) return;
            await api.organizations.update(orgId, {
                crmFieldMapping: fieldMappings,
            });
            alert('Mapeamento salvo com sucesso!');
        } catch (error) {
            console.error('Error saving mappings:', error);
            alert('Erro ao salvar mapeamento');
        }
    };

    if (loading || !orgId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integração CRM</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Configure a integração com seu CRM, mapeie campos e defina automações.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('config')}
                    className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors ${activeTab === 'config'
                        ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                >
                    <Settings className="w-4 h-4" />
                    Configuração
                </button>
                <button
                    onClick={() => setActiveTab('test')}
                    className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors ${activeTab === 'test'
                        ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                >
                    <Code className="w-4 h-4" />
                    Testar API
                </button>
                <button
                    onClick={() => setActiveTab('mapping')}
                    className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors ${activeTab === 'mapping'
                        ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                >
                    <Database className="w-4 h-4" />
                    Mapeamento de Campos
                </button>
                <button
                    onClick={() => setActiveTab('automations')}
                    className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors ${activeTab === 'automations'
                        ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                >
                    <GitBranch className="w-4 h-4" />
                    Automações
                </button>
            </div>

            <div className="space-y-6">
                {activeTab === 'config' && (
                    <CrmConfigTab
                        crmConfigs={crmConfigs}
                        fetchCrmConfigs={fetchCrmConfigs}
                        selectedCrmConfig={selectedCrmConfig}
                        setSelectedCrmConfig={setSelectedCrmConfig}
                        orgId={orgId as string}
                        config={config}
                        setConfig={setConfig}
                        crmName={crmName}
                        setCrmName={setCrmName}
                    />
                )}

                {activeTab === 'test' && (
                    <ApiTestTab
                        crmWebhookUrl={config.crmWebhookUrl}
                        crmApiKey={config.crmApiKey}
                        crmAuthType={config.crmAuthType}
                        fieldMappings={fieldMappings}
                    />
                )}

                {activeTab === 'mapping' && (
                    <FieldMappingTab
                        fieldMappings={fieldMappings}
                        setFieldMappings={setFieldMappings}
                        onSave={handleSaveMappings}
                    />
                )}

                {activeTab === 'automations' && (
                    <AutomationsTab
                        agentId={agentId}
                        organizationId={orgId as string}
                        crmConfigs={crmConfigs}
                        selectedCrmConfig={selectedCrmConfig}
                        setSelectedCrmConfig={setSelectedCrmConfig}
                        selectedCrmStage={selectedState}
                        setSelectedCrmStage={setSelectedState}
                        automations={automations}
                        setAutomations={setAutomations}
                        fetchAutomations={fetchAutomations}
                    />
                )}
            </div>
        </div>
    );
}
