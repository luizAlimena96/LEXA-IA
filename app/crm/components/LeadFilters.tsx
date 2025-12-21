'use client';

import { Search, X } from 'lucide-react';

interface Tag {
    id: string;
    name: string;
    color: string;
}

interface Agent {
    id: string;
    name: string;
}

interface LeadFiltersProps {
    agents: Agent[];
    tags: Tag[];
    selectedAgentId: string;
    selectedTags: string[];
    searchTerm: string;
    onAgentChange: (agentId: string) => void;
    onTagsChange: (tagIds: string[]) => void;
    onSearchChange: (term: string) => void;
}

export default function LeadFilters({
    agents,
    tags,
    selectedAgentId,
    selectedTags,
    searchTerm,
    onAgentChange,
    onTagsChange,
    onSearchChange
}: LeadFiltersProps) {
    const handleTagToggle = (tagId: string) => {
        if (selectedTags.includes(tagId)) {
            onTagsChange(selectedTags.filter(t => t !== tagId));
        } else {
            onTagsChange([...selectedTags, tagId]);
        }
    };

    const handleClearTags = () => {
        onTagsChange([]);
    };

    return (
        <div className="mt-4 flex flex-wrap items-center gap-4">
            {/* Agent Selector */}
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 dark:text-gray-400">Agente:</label>
                <select
                    value={selectedAgentId}
                    onChange={(e) => onAgentChange(e.target.value)}
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                    {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                            {agent.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar por nome, telefone..."
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {searchTerm && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Tags Filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tags:</span>

                {tags.map(tag => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                        <button
                            key={tag.id}
                            onClick={() => handleTagToggle(tag.id)}
                            className={`text-xs px-2 py-1 rounded-full transition-all border ${isSelected
                                ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 border-transparent'
                                : 'opacity-60 hover:opacity-100 border-transparent'
                                }`}
                            style={{
                                backgroundColor: tag.color + '40',
                                color: tag.color,
                                borderColor: isSelected ? 'transparent' : tag.color + '40'
                            }}
                        >
                            {tag.name}
                        </button>
                    );
                })}

                {selectedTags.length > 0 && (
                    <button
                        onClick={handleClearTags}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                    >
                        Limpar
                    </button>
                )}

                {tags.length === 0 && (
                    <span className="text-xs text-gray-500">Nenhuma tag criada</span>
                )}
            </div>
        </div>
    );
}
