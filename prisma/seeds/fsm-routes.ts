// Configuração completa das rotas FSM para cada estado
export const fsmRoutes = {
    INICIO: {
        rota_de_sucesso: [
            { estado: 'VALOR_DIVIDA', descricao: 'Cliente informou seu nome' },
        ],
        rota_de_persistencia: [
            { estado: 'INICIO', descricao: 'Cliente não informou o nome, insistir' },
        ],
        rota_de_escape: [],
    },

    VALOR_DIVIDA: {
        rota_de_sucesso: [
            { estado: 'BANCO_LEAD', descricao: 'Dívida >= 60 mil reais' },
            { estado: 'DESCARTE', descricao: 'Dívida < 60 mil reais' },
        ],
        rota_de_persistencia: [
            { estado: 'VALOR_DIVIDA', descricao: 'Cliente não informou valor válido, insistir' },
        ],
        rota_de_escape: [],
    },

    BANCO_LEAD: {
        rota_de_sucesso: [
            { estado: 'MODALIDADE_DIV', descricao: 'Cliente mencionou um banco da lista permitida' },
            { estado: 'MULTIPLOS_BANCOS', descricao: 'Cliente mencionou múltiplos bancos' },
            { estado: 'DESCARTE', descricao: 'Banco não está na lista permitida' },
        ],
        rota_de_persistencia: [
            { estado: 'BANCO_LEAD', descricao: 'Cliente não informou banco, insistir' },
        ],
        rota_de_escape: [],
    },

    MODALIDADE_DIV: {
        rota_de_sucesso: [
            { estado: 'ATRASO_DIV', descricao: 'Cliente informou modalidade válida (não apenas cheque especial)' },
            { estado: 'DESCARTE', descricao: 'Cliente informou apenas cheque especial' },
        ],
        rota_de_persistencia: [
            { estado: 'MODALIDADE_DIV', descricao: 'Cliente não informou modalidade, insistir' },
        ],
        rota_de_escape: [],
    },

    ATRASO_DIV: {
        rota_de_sucesso: [
            { estado: 'GARANTIA_DIV', descricao: 'Cliente confirmou que está em atraso' },
            { estado: 'FICAR_ATRASO', descricao: 'Cliente informou que não está em atraso' },
        ],
        rota_de_persistencia: [
            { estado: 'ATRASO_DIV', descricao: 'Cliente não respondeu claramente, insistir' },
        ],
        rota_de_escape: [],
    },

    FICAR_ATRASO: {
        rota_de_sucesso: [
            { estado: 'EXPLICAR_METODO', descricao: 'Cliente vai manter pagamentos em dia' },
            { estado: 'GARANTIA_DIV', descricao: 'Cliente pode ficar em atraso' },
        ],
        rota_de_persistencia: [
            { estado: 'FICAR_ATRASO', descricao: 'Cliente não respondeu claramente' },
        ],
        rota_de_escape: [
            { estado: 'DESCARTE', descricao: 'Cliente não tem interesse' },
        ],
    },

    EXPLICAR_METODO: {
        rota_de_sucesso: [
            { estado: 'GARANTIA_DIV', descricao: 'Cliente demonstra abertura e entendimento do método' },
        ],
        rota_de_persistencia: [
            { estado: 'EXPLICAR_METODO', descricao: 'Cliente não entendeu ou não respondeu' },
        ],
        rota_de_escape: [
            { estado: 'DESCARTE', descricao: 'Cliente não tem interesse no método' },
        ],
    },

    GARANTIA_DIV: {
        rota_de_sucesso: [
            { estado: 'OFERTA_REUNIAO', descricao: 'Cliente informou sobre garantias (sim ou não)' },
        ],
        rota_de_persistencia: [
            { estado: 'GARANTIA_DIV', descricao: 'Cliente não respondeu claramente' },
        ],
        rota_de_escape: [],
    },

    OFERTA_REUNIAO: {
        rota_de_sucesso: [
            { estado: 'AGENDAMENTO_INICIAR_E_SUGERIR', descricao: 'Cliente demonstra interesse e sugere período (manhã/tarde)' },
            { estado: 'AGENDAMENTO_VERIFICAR_DISPONIBILIDADE', descricao: 'Cliente sugere dia e horário específico' },
        ],
        rota_de_persistencia: [
            { estado: 'OFERTA_REUNIAO', descricao: 'Cliente não respondeu claramente' },
        ],
        rota_de_escape: [
            { estado: 'DESCARTE', descricao: 'Cliente não tem interesse em reunião' },
        ],
    },

    AGENDAMENTO_INICIAR_E_SUGERIR: {
        rota_de_sucesso: [
            { estado: 'AGENDAMENTO_CONFIRMAR_E_CRIAR', descricao: 'Cliente aceita um dos horários sugeridos' },
            { estado: 'AGENDAMENTO_VERIFICAR_DISPONIBILIDADE', descricao: 'Cliente sugere outro horário específico' },
        ],
        rota_de_persistencia: [
            { estado: 'AGENDAMENTO_INICIAR_E_SUGERIR', descricao: 'Cliente não escolheu horário, reoferecer' },
        ],
        rota_de_escape: [
            { estado: 'DESCARTE', descricao: 'Cliente desistiu do agendamento' },
        ],
    },

    AGENDAMENTO_VERIFICAR_DISPONIBILIDADE: {
        rota_de_sucesso: [
            { estado: 'AGENDAMENTO_CONFIRMAR_E_CRIAR', descricao: 'Horário está disponível' },
        ],
        rota_de_persistencia: [
            { estado: 'AGENDAMENTO_INICIAR_E_SUGERIR', descricao: 'Horário não disponível, sugerir outros' },
        ],
        rota_de_escape: [],
    },

    AGENDAMENTO_CONFIRMAR_E_CRIAR: {
        rota_de_sucesso: [
            { estado: 'AGENDAMENTO_CONFIRMADO', descricao: 'Agendamento criado e confirmado com sucesso' },
        ],
        rota_de_persistencia: [
            { estado: 'AGENDAMENTO_CONFIRMAR_E_CRIAR', descricao: 'Aguardando confirmação final do cliente' },
        ],
        rota_de_escape: [
            { estado: 'AGENDAMENTO_INICIAR_E_SUGERIR', descricao: 'Cliente mudou de ideia sobre o horário' },
        ],
    },

    AGENDAMENTO_CONFIRMADO: {
        rota_de_sucesso: [],
        rota_de_persistencia: [
            { estado: 'AGENDAMENTO_CONFIRMADO', descricao: 'Manter no estado final' },
        ],
        rota_de_escape: [],
    },

    DESCARTE: {
        rota_de_sucesso: [],
        rota_de_persistencia: [
            { estado: 'DESCARTE', descricao: 'Manter no estado de descarte' },
        ],
        rota_de_escape: [],
    },

    MULTIPLOS_BANCOS: {
        rota_de_sucesso: [
            { estado: 'MODALIDADE_DIV', descricao: 'Cliente informou o banco principal' },
        ],
        rota_de_persistencia: [
            { estado: 'MULTIPLOS_BANCOS', descricao: 'Cliente não informou banco principal' },
        ],
        rota_de_escape: [],
    },
};
