# Integração CRM - Guia de Uso

## Como Integrar Webhooks no Fluxo da Aplicação

### 1. Importar o Service

```typescript
import { processEvent } from '@/app/services/crmService';
```

### 2. Disparar Eventos

#### Quando um Lead é Criado

```typescript
// Em qualquer lugar que cria um lead
const lead = await prisma.lead.create({
    data: leadData,
});

// Disparar webhooks
await processEvent('lead.created', lead.organizationId, {
    lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        notes: lead.notes,
    },
});
```

#### Quando um Lead é Atualizado

```typescript
const lead = await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
});

await processEvent('lead.updated', lead.organizationId, {
    lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
    },
});
```

#### Quando Status da Conversação Muda

```typescript
const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: newStatus },
    include: { lead: true },
});

await processEvent('conversation.status_changed', conversation.organizationId, {
    conversation: {
        id: conversation.id,
        status: conversation.status,
    },
    lead: conversation.lead ? {
        id: conversation.lead.id,
        name: conversation.lead.name,
        phone: conversation.lead.phone,
    } : undefined,
});
```

#### Quando uma Mensagem é Recebida

```typescript
await processEvent('message.received', organizationId, {
    message: {
        content: messageContent,
        from: phoneNumber,
    },
    lead: {
        id: lead.id,
        name: lead.name,
    },
});
```

---

## Eventos Disponíveis

- `lead.created` - Novo lead criado
- `lead.updated` - Lead atualizado
- `lead.deleted` - Lead deletado
- `conversation.started` - Nova conversação iniciada
- `conversation.status_changed` - Status da conversação mudou
- `conversation.ended` - Conversação finalizada
- `message.received` - Mensagem recebida do cliente
- `message.sent` - Mensagem enviada pelo agente

---

## Templates Pré-configurados

### DataCrazy

```json
{
  "headers": {
    "Authorization": "Bearer {apiKey}",
    "Content-Type": "application/json"
  },
  "body": {
    "name": "{lead.name}",
    "email": "{lead.email}",
    "phone": "{lead.phone}",
    "source": "{lead.source}",
    "status": "{lead.status}",
    "custom_fields": {
      "whatsapp": "{lead.phone}",
      "origin": "LEXA"
    }
  }
}
```

### RD Station

```json
{
  "body": {
    "event_type": "CONVERSION",
    "event_family": "CDP",
    "payload": {
      "conversion_identifier": "lead-whatsapp",
      "email": "{lead.email}",
      "name": "{lead.name}",
      "mobile_phone": "{lead.phone}",
      "cf_source": "{lead.source}"
    }
  }
}
```

---

## Múltiplos CRMs

O sistema suporta **múltiplos webhooks ativos simultaneamente**. Quando um evento é disparado, **TODOS** os webhooks configurados para aquele evento serão executados em paralelo.

**Exemplo:** Uma organização pode ter:
- Webhook 1: DataCrazy (lead.created)
- Webhook 2: RD Station (lead.created)
- Webhook 3: Sistema Interno (lead.created)

Quando `processEvent('lead.created', ...)` é chamado, os 3 webhooks serão disparados ao mesmo tempo!

---

## Variáveis Disponíveis

Use `{variavel}` nos templates:

### Lead
- `{lead.id}`
- `{lead.name}`
- `{lead.email}`
- `{lead.phone}`
- `{lead.source}`
- `{lead.status}`
- `{lead.notes}`

### Conversation
- `{conversation.id}`
- `{conversation.status}`

### Message
- `{message.content}`
- `{message.from}`

### System
- `{event}` - Nome do evento
- `{timestamp}` - Data/hora ISO
- `{organizationId}` - ID da organização

---

## Logs

Todas as execuções de webhooks são automaticamente logadas em `CrmWebhookLog` com:
- Payload enviado
- Response recebida
- Status code
- Success/Error
- Error message (se houver)

Acesse via API: `GET /api/organizations/:id/crm/logs`
