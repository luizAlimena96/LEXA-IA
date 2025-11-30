# 📡 Documentação de APIs - LEXA IA

Este documento contém todas as chamadas de API necessárias para popular o site LEXA IA, incluindo endpoints, métodos, payloads e respostas esperadas.

---

## 🔧 Configuração Base

### Variável de Ambiente
```env
NEXT_PUBLIC_API_URL=https://sua-api.lexa-ia.com
```

### Headers Padrão
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

---

## 🔐 Autenticação

### 1. Login
**Endpoint:** `POST /webhook/login`  
**URL Atual:** `https://webhook1.lexa-ia.com/webhook/login`  
**Arquivo:** [login/page.tsx](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/login/page.tsx#L19-L26)

**Request:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response Success:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "usuario@exemplo.com"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Credenciais inválidas"
}
```

---

### 2. Recuperar Senha
**Endpoint:** `POST /webhook/reset-password`  
**Arquivo:** [esqueceu-senha/page.tsx](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/esqueceu-senha/page.tsx#L25-L29)

**Request:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "E-mail de recuperação enviado"
}
```

---

## 📊 Dashboard

### 3. Obter Métricas do Dashboard
**Endpoint:** `GET /dashboard/metrics`  
**Arquivo:** [services/dashboardService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/dashboardService.ts#L26-L31)

**Response:**
```json
{
  "totalConversations": 1234,
  "activeUsers": 856,
  "avgResponseTime": "2.5min",
  "satisfactionRate": 94.5
}
```

---

### 4. Obter Dados de Performance
**Endpoint:** `GET /dashboard/performance`  
**Arquivo:** [services/dashboardService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/dashboardService.ts#L33-L38)

**Response:**
```json
{
  "labels": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
  "datasets": [
    {
      "label": "Conversas",
      "data": [120, 190, 150, 220, 180, 250],
      "borderColor": "rgb(99, 102, 241)",
      "backgroundColor": "rgba(99, 102, 241, 0.1)"
    },
    {
      "label": "Satisfação",
      "data": [85, 88, 92, 90, 94, 95],
      "borderColor": "rgb(34, 197, 94)",
      "backgroundColor": "rgba(34, 197, 94, 0.1)"
    }
  ]
}
```

---

## 💬 Conversas (WhatsApp)

### 5. Listar Conversas
**Endpoint:** `GET /chats`  
**Arquivo:** [services/whatsappService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/whatsappService.ts#L47-L52)

**Response:**
```json
[
  {
    "id": 1,
    "name": "Maria Santos",
    "avatar": "MS",
    "lastMessage": "Obrigada pelo atendimento!",
    "time": "10:30",
    "unread": 2,
    "online": true
  },
  {
    "id": 2,
    "name": "João Silva",
    "avatar": "JS",
    "lastMessage": "Quando posso agendar?",
    "time": "09:15",
    "unread": 0,
    "online": false
  }
]
```

---

### 6. Obter Mensagens de uma Conversa
**Endpoint:** `GET /chats/{chatId}/messages`  
**Arquivo:** [services/whatsappService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/whatsappService.ts#L54-L59)

**Response:**
```json
[
  {
    "id": 1,
    "text": "Olá! Como posso ajudar?",
    "sent": false,
    "time": "10:25",
    "read": true
  },
  {
    "id": 2,
    "text": "Preciso de informações sobre o produto",
    "sent": true,
    "time": "10:26",
    "read": true
  }
]
```

---

### 7. Enviar Mensagem
**Endpoint:** `POST /chats/{chatId}/messages`  
**Arquivo:** [services/whatsappService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/whatsappService.ts#L61-L68)

**Request:**
```json
{
  "text": "Claro! Vou te ajudar com isso."
}
```

**Response:**
```json
{
  "id": 3,
  "text": "Claro! Vou te ajudar com isso.",
  "sent": true,
  "time": "10:30",
  "read": false
}
```

---

## 📅 Calendário

### 8. Listar Eventos
**Endpoint:** `GET /calendar/events`  
**Arquivo:** [services/calendarService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/calendarService.ts#L43-L48)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Reunião com Cliente",
    "date": "2024-01-15T14:00:00Z",
    "time": "14:00",
    "duration": "1h",
    "type": "meeting",
    "attendees": 5,
    "location": "Sala 3",
    "color": "bg-blue-500"
  },
  {
    "id": 2,
    "title": "Chamada de Acompanhamento",
    "date": "2024-01-16T10:00:00Z",
    "time": "10:00",
    "duration": "30min",
    "type": "call",
    "attendees": 2,
    "color": "bg-green-500"
  }
]
```

---

### 9. Criar Evento
**Endpoint:** `POST /calendar/events`  
**Arquivo:** [services/calendarService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/calendarService.ts#L50-L55)

**Request:**
```json
{
  "title": "Reunião com Equipe",
  "date": "2024-01-20T15:00:00Z",
  "time": "15:00",
  "duration": "2h",
  "type": "meeting",
  "attendees": 8,
  "location": "Sala de Conferências",
  "meetingLink": "https://meet.google.com/abc-defg-hij"
}
```

**Response:**
```json
{
  "id": 3,
  "title": "Reunião com Equipe",
  "date": "2024-01-20T15:00:00Z",
  "time": "15:00",
  "duration": "2h",
  "type": "meeting",
  "attendees": 8,
  "location": "Sala de Conferências",
  "meetingLink": "https://meet.google.com/abc-defg-hij",
  "color": "bg-blue-500"
}
```

---

## ⭐ Feedback (Problemas Reportados)

### 10. Listar Feedbacks
**Endpoint:** `GET /feedback`  
**Arquivo:** [services/feedbackService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/feedbackService.ts#L62-L67)

**Response:**
```json
[
  {
    "id": 1,
    "customer": "Maria Santos",
    "message": "Sistema muito lento durante o horário de pico",
    "date": "2024-01-10",
    "status": "pending",
    "severity": "high",
    "category": "performance"
  },
  {
    "id": 2,
    "customer": "João Silva",
    "message": "Erro ao fazer login pelo celular",
    "date": "2024-01-12",
    "status": "resolved",
    "severity": "critical",
    "category": "bug"
  }
]
```

**Status possíveis:** `pending`, `in_progress`, `resolved`  
**Severity possíveis:** `low`, `medium`, `high`, `critical`  
**Category possíveis:** `bug`, `feature`, `performance`, `ui`, `other`

---

### 11. Obter Métricas de Feedback
**Endpoint:** `GET /feedback/metrics`  
**Arquivo:** [services/feedbackService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/feedbackService.ts#L69-L74)

**Response:**
```json
{
  "total": 156,
  "pending": 23,
  "resolved": 120,
  "avgResponseTime": "4.2h"
}
```

---

### 12. Responder Feedback
**Endpoint:** `POST /feedback/{id}/respond`  
**Arquivo:** [services/feedbackService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/feedbackService.ts#L76-L83)

**Request:**
```json
{
  "message": "Obrigado pelo feedback! Já identificamos o problema e estamos trabalhando na correção.",
  "images": [
    "base64_encoded_image_1",
    "base64_encoded_image_2"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Resposta enviada com sucesso"
}
```

---

### 13. Marcar Feedback como Resolvido
**Endpoint:** `PUT /feedback/{id}/resolve`  
**Arquivo:** [services/feedbackService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/feedbackService.ts#L85-L90)

**Response:**
```json
{
  "success": true,
  "feedback": {
    "id": 1,
    "status": "resolved",
    "resolvedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📈 Relatórios

### 14. Listar Relatórios
**Endpoint:** `GET /reports`  
**Arquivo:** [services/reportService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/reportService.ts#L67-L72)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Relatório de Conversas - Janeiro",
    "type": "Conversas",
    "period": "Mensal",
    "createdAt": "2024-01-15",
    "format": "PDF",
    "size": "2.4 MB"
  },
  {
    "id": 2,
    "title": "Performance Trimestral",
    "type": "Performance",
    "period": "Trimestral",
    "createdAt": "2024-01-10",
    "format": "Excel",
    "size": "1.8 MB"
  }
]
```

---

### 15. Obter Métricas de Relatórios
**Endpoint:** `GET /reports/metrics`  
**Arquivo:** [services/reportService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/reportService.ts#L74-L79)

**Response:**
```json
{
  "totalReports": 45,
  "thisMonth": 8,
  "avgGenerationTime": "3.2s",
  "totalSize": "124 MB"
}
```

---

### 16. Gerar Relatório
**Endpoint:** `POST /reports/generate`  
**Arquivo:** [services/reportService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/reportService.ts#L81-L88)

**Request:**
```json
{
  "title": "Relatório de Atendimento - Fevereiro",
  "type": "Atendimento",
  "period": "Mensal",
  "startDate": "2024-02-01",
  "endDate": "2024-02-29",
  "format": "PDF",
  "includeGraphs": true,
  "includeDetails": true
}
```

**Tipos possíveis:** `Conversas`, `Feedback`, `Performance`, `Atendimento`, `Geral`  
**Períodos possíveis:** `Semanal`, `Mensal`, `Trimestral`, `Anual`, `Personalizado`  
**Formatos possíveis:** `PDF`, `Excel`, `CSV`

**Response:**
```json
{
  "success": true,
  "reportId": 46,
  "downloadUrl": "https://api.lexa-ia.com/reports/46/download",
  "message": "Relatório gerado com sucesso"
}
```

---

### 17. Baixar Relatório
**Endpoint:** `GET /reports/{id}/download`  
**Arquivo:** [services/reportService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/reportService.ts#L90-L95)

**Response:** Arquivo binário (PDF, Excel ou CSV)

---

## 👤 Perfil

### 18. Obter Dados do Perfil
**Endpoint:** `GET /profile`  
**Arquivo:** [services/profileService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/profileService.ts#L39-L44)

**Response:**
```json
{
  "name": "João Silva",
  "email": "joao.silva@empresa.com",
  "phone": "(11) 98765-4321",
  "company": "Empresa LTDA",
  "role": "Gerente de Atendimento",
  "avatar": "https://api.lexa-ia.com/avatars/joao-silva.jpg"
}
```

---

### 19. Atualizar Perfil
**Endpoint:** `PUT /profile`  
**Arquivo:** [services/profileService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/profileService.ts#L46-L51)

**Request:**
```json
{
  "name": "João Silva Santos",
  "email": "joao.silva@empresa.com",
  "phone": "(11) 98765-4321",
  "company": "Empresa LTDA",
  "role": "Gerente de Atendimento"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "profile": {
    "name": "João Silva Santos",
    "email": "joao.silva@empresa.com",
    "phone": "(11) 98765-4321",
    "company": "Empresa LTDA",
    "role": "Gerente de Atendimento"
  }
}
```

---

### 20. Alterar Senha
**Endpoint:** `PUT /profile/password`  
**Arquivo:** [services/profileService.ts](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/profileService.ts#L53-L58)

**Request:**
```json
{
  "currentPassword": "senhaAtual123",
  "newPassword": "novaSenha456",
  "confirmPassword": "novaSenha456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

---

## 📝 Resumo de Endpoints

| # | Método | Endpoint | Descrição |
|---|--------|----------|-----------|
| 1 | POST | `/webhook/login` | Login do usuário |
| 2 | POST | `/webhook/reset-password` | Recuperar senha |
| 3 | GET | `/dashboard/metrics` | Métricas do dashboard |
| 4 | GET | `/dashboard/performance` | Dados de performance |
| 5 | GET | `/chats` | Listar conversas |
| 6 | GET | `/chats/{id}/messages` | Mensagens de uma conversa |
| 7 | POST | `/chats/{id}/messages` | Enviar mensagem |
| 8 | GET | `/calendar/events` | Listar eventos |
| 9 | POST | `/calendar/events` | Criar evento |
| 10 | GET | `/feedback` | Listar feedbacks |
| 11 | GET | `/feedback/metrics` | Métricas de feedback |
| 12 | POST | `/feedback/{id}/respond` | Responder feedback |
| 13 | PUT | `/feedback/{id}/resolve` | Resolver feedback |
| 14 | GET | `/reports` | Listar relatórios |
| 15 | GET | `/reports/metrics` | Métricas de relatórios |
| 16 | POST | `/reports/generate` | Gerar relatório |
| 17 | GET | `/reports/{id}/download` | Baixar relatório |
| 18 | GET | `/profile` | Obter perfil |
| 19 | PUT | `/profile` | Atualizar perfil |
| 20 | PUT | `/profile/password` | Alterar senha |

---

## 🔄 Fluxo de Integração

### Passo 1: Configurar Variável de Ambiente
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://sua-api.lexa-ia.com
```

### Passo 2: Descomentar Chamadas de API
Em cada arquivo de serviço ([`app/services/`](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/)), descomentar as linhas marcadas com `// TODO: Replace with actual API call`

### Passo 3: Remover Dados Mockados
Após confirmar que a API está funcionando, remover os dados mockados de cada serviço.

### Passo 4: Testar Endpoints
Usar ferramentas como Postman ou Insomnia para testar cada endpoint antes de integrar.

---

## ⚠️ Notas Importantes

1. **Autenticação**: Todos os endpoints (exceto login e recuperar senha) requerem token JWT no header `Authorization: Bearer {token}`

2. **Paginação**: Para endpoints que retornam listas, considere adicionar parâmetros de paginação:
   ```
   GET /chats?page=1&limit=20
   GET /feedback?page=1&limit=50
   ```

3. **Filtros**: Endpoints de listagem podem aceitar filtros:
   ```
   GET /feedback?status=pending&severity=high
   GET /reports?type=Conversas&period=Mensal
   ```

4. **Upload de Imagens**: Para o feedback, as imagens devem ser enviadas em base64 ou usar multipart/form-data

5. **Datas**: Todas as datas devem estar no formato ISO 8601: `2024-01-15T14:00:00Z`

6. **Tratamento de Erros**: Todos os endpoints devem retornar códigos HTTP apropriados:
   - `200` - Sucesso
   - `201` - Criado
   - `400` - Requisição inválida
   - `401` - Não autenticado
   - `403` - Sem permissão
   - `404` - Não encontrado
   - `500` - Erro no servidor

---

## 📞 Suporte

Para dúvidas sobre a integração, consulte os arquivos de serviço em [`app/services/`](file:///c:/Users/Luiz/OneDrive/Documentos/LEXA/lexa/app/services/) onde estão os exemplos de uso e estruturas de dados esperadas.
