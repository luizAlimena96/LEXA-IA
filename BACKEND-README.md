# 🚀 LEXA IA - Backend Setup

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Yarn ou npm

## 🔧 Instalação

### 1. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 2. Configurar Banco de Dados

Crie um banco PostgreSQL:

```sql
CREATE DATABASE lexa_db;
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lexa_db?schema=public"

# OpenAI
OPENAI_API_KEY="sk-..."

# Evolution API (WhatsApp)
EVOLUTION_API_URL="https://evolutionapi.eduardofischborn.com.br"
EVOLUTION_API_KEY="your-key-here"

# App
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 4. Executar Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Gerar Prisma Client

```bash
npx prisma generate
```

### 6. (Opcional) Popular Banco com Dados de Teste

```bash
npx prisma db seed
```

## 🏃 Executar

```bash
npm run dev
# ou
yarn dev
```

Acesse: http://localhost:3000

## 📡 APIs Disponíveis

### WhatsApp Webhook
```
POST /api/webhooks/whatsapp
```
Recebe mensagens do Evolution API

### Agents
```
GET    /api/agents
POST   /api/agents
GET    /api/agents/[id]
PUT    /api/agents/[id]
DELETE /api/agents/[id]
PUT    /api/agents/[id]/status
```

### Leads
```
GET    /api/leads
POST   /api/leads
GET    /api/leads/[id]
PUT    /api/leads/[id]
DELETE /api/leads/[id]
```

### Conversations
```
GET    /api/conversations
GET    /api/conversations/[id]
GET    /api/conversations/[id]/messages
POST   /api/conversations/[id]/messages
DELETE /api/conversations/[id]/memory
```

### Knowledge Base
```
GET    /api/knowledge
POST   /api/knowledge/upload
DELETE /api/knowledge/[id]
```

### Matrix
```
GET    /api/matrix
POST   /api/matrix
PUT    /api/matrix/[id]
DELETE /api/matrix/[id]
```

## 🗄️ Schema do Banco

O schema Prisma está em `prisma/schema.prisma` e inclui:

- **User** - Usuários do sistema
- **Agent** - Agentes de IA
- **Knowledge** - Base de conhecimento
- **MatrixItem** - Matriz de interações
- **Followup** - Follow-ups automáticos
- **Reminder** - Lembretes
- **Lead** - Leads/Clientes
- **Conversation** - Conversas
- **Message** - Mensagens
- **Memory** - Memória do agente (contexto AI)
- **Appointment** - Agendamentos
- **Feedback** - Feedbacks
- **Report** - Relatórios
- **FlowRule** - Regras de fluxo

## 🔄 Migração dos Fluxos n8n

Os fluxos JSON do n8n foram analisados e convertidos para código TypeScript com Prisma.

**Melhorias implementadas:**
- ✅ Schema tipado e validado
- ✅ Relacionamentos claros entre entidades
- ✅ Índices para performance
- ✅ Migrations versionadas
- ✅ Código testável e manutenível
- ✅ Multi-tenant (vários agentes)
- ✅ Logs estruturados

## 🛠️ Comandos Úteis

```bash
# Ver banco de dados no Prisma Studio
npx prisma studio

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Resetar banco (CUIDADO!)
npx prisma migrate reset

# Formatar schema
npx prisma format
```

## 📝 Próximos Passos

1. Configurar Evolution API para apontar webhook para `/api/webhooks/whatsapp`
2. Criar primeiro agente via API ou Prisma Studio
3. Testar envio de mensagem pelo WhatsApp
4. Integrar OpenAI para respostas inteligentes
5. Implementar lógica de matriz de interações
6. Configurar follow-ups automáticos

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique se PostgreSQL está rodando
- Confirme credenciais no `.env`
- Teste conexão: `psql -U user -d lexa_db`

### Prisma Client não encontrado
```bash
npx prisma generate
```

### Migrations falhando
```bash
npx prisma migrate reset
npx prisma migrate dev
```

## 📚 Documentação

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Evolution API](https://doc.evolution-api.com/)
