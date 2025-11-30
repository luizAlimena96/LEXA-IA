INSERT INTO "public"."adrial_regras_fluxo" ("id", "created_at", "funil", "nome_estado", "missao_prompt", "rotas_disponiveis", "dados", "dado_descricao", "dado_tipo", "midia", "ferramentas", "crm") VALUES ('3', '2025-10-01 02:47:57.153435+00', null, 'INICIO', 'Perguntar o nome do cliente iniciando com a seguinte mensagem: "Para darmos continuidade ao atendimento, pode me informar o seu nome?"', '{
"rota_de_sucesso":
[{"estado":"DESCONTOS_INDEV","descricao":"o cliente  informou o seu nome."}],

"rota_de_persistencia":
[{"estado":"INICIO","descricao":"Use essa rota se você precisar persistir na missão atual para perguntar o que o nome do cliente."}],

"rota_de_escape":
[{"estado":"CLIENTE_ATIVO","descricao":"Use esta rota quando o usuário quiser consultar o status ou obter informações sobre um processo jurídico em andamento. A intenção é ativada se ele mencionar termos como 'meu processo', 'andamento do caso', 'consultar processo', ou se identificar como cliente ativo buscando atualizações. Respostas como: "Meu nome está na lista" não devem ser consideradas de cliente ativo mas sim de um cliente buscando saber se o nome está na lista do meu inss."}]
}', 'nome_cliente', 'Armazena o nome do lead, já corrigido e formatado (primeira letra maiúscula, sem números, emojis ou símbolos). A IA deve tentar ajustar erros simples de digitação e capitalização automaticamente. Se o nome for inválido, genérico ou não puder ser corrigido, a IA deve pedir novamente antes de salvar.  Exemplo:  Entrada: "joao" → Salva: "João"  Entrada: "mARIA CLARA" → Salva: "Maria Clara"  Entrada: "sim" ou "teste" → não salva, pede novamente.', 'string', 'vazio', '/', 'crm_'), ('4', '2025-10-01 02:48:38.586389+00', null, 'CLIENTE_ATIVO', 'A missão desta IA é identificar o cliente e encaminhá-lo para o atendimento humano.
Para isso, deve coletar o nome completo e o CPF do cliente de forma acolhedora, profissional e clara.

Exemplo de mensagem inicial:

"Para que possamos dar continuidade ao seu atendimento com um de nossos consultores jurídicos, preciso confirmar alguns dados.

Por favor, poderia me informar seu nome completo e o CPF?"', '{
"rota_de_sucesso":
[{"estado":"ATENDIMENTO_HUMANO","descricao":"O cliente informou o nome completo e cpf."}],


"rota_de_persistencia":
[{"estado":"CLIENTE_ATIVO","descricao":"Use essa rota se você precisar persistir na missão atual para retomar os dados faltantes."}],

"rota_de_escape":
[]
}', 'nome_completo_cpf', 'O campo Nome Completo deve registrar o nome informado pelo lead sempre com iniciais maiúsculas (exemplo: João da Silva). Já o campo CPF deve armazenar apenas números, com 11 dígitos, e ser exibido automaticamente no formato(exemplo: 123.456.789-01).', 'string', 'vazio', '/', 'crm_'), ('5', '2025-10-01 02:57:19.742682+00', null, 'OUTRAS_AREAS', 'A missão da IA é obter a CHAVE_DE_VALIDAÇÃO *ajuda* iniciando com a seguinte mensagem: “
Esse número, é exclusivo para falarmos sobre os descontos indevidos do INSS, logo nossa equipe entrará em contato com algum desse números.

Importante: salve nossos contatos, pois ligações e mensagens são sempre por estes números oficiais:
• 11 2429 - 5306
• 11 97587 - 4721
• 11 2780 - 1315
• 11 2780 - 0149
• 11 2780 - 0289
• 11 2780 - 0368
• 11 2780 - 0365

Ajudo em algo mais? ', '{
"rota_de_sucesso":
[{"estado":"ATENDIMENTO_HUMANO","descricao":"Use essa rota após cumprir a missão do objetivo atual."}],


"rota_de_persistencia":
[{"estado":"OUTRAS_AREAS","descricao":"Use essa rota se você precisar persistir na missão atual."}],

"rota_de_escape":
[]
}', 'ajuda', 'Reposta do cliente pós enviarmos os números oficiais do escritório informando que iremos entrar em contato.', 'string', 'vazio', '/', 'crm_ATENDIMENTO HUMANO'), ('6', '2025-10-01 02:58:05.636045+00', null, 'DESCONTOS_INDEV', 'A missão da IA é confirmar se o cliente esta buscando saber sobre os descontos indevidos de um beneficio do INSS ou se ele é cliente ativo do escritorio com a seguinte pergunta: “<nome> para facilitar nosso atendimento, você deseja falar sobre Descontos Indevidos no benefício do INSS ou você já é Nosso Cliente?”', '{
"rota_de_sucesso":
[{"estado":"MEU_INSS","descricao":"O cliente informou que deseja falar sobre descontos indevidos, que acha que está sendo roubado, que pede se o nome está lista ou diz que quer ver de um benefício."},

{"estado":"CLIENTE_ATIVO","descricao":"Use esta rota quando o usuário quiser consultar o status ou obter informações sobre um processo jurídico em andamento. A intenção é ativada se ele mencionar termos como 'meu processo', 'andamento do caso', 'consultar processo', ou se identificar como cliente ativo buscando atualizações. Respostas como: "Meu nome está na lista" não devem ser consideradas de cliente ativo mas sim de um cliente buscando saber se o nome está na lista do meu inss."}],


"rota_de_persistencia":
[{"estado":"DESCONTOS_INDEV","descricao":"Use essa rota se você precisar persistir na missão atual."}],

"rota_de_escape":
[]
}', 'perg_aberta', 'O cliente informou se deseja falar sobre Descontos Indevidos no benefício do INSS ou se já é Nosso Cliente e quer saber sobre um processo em andamento. Exemplos de Resposta: Para MEU_INSS (Descontos Indevidos): "Quero falar sobre descontos indevidos", "Acho que estou sendo roubado", "Meu nome está na lista", "Quero ver de um benefício". Para CLIENTE_ATIVO (Processo em Andamento): "Quero saber do meu processo", "Tenho um processo aí em andamento", "Já sou cliente", "Como está meu processo?".', 'string', 'vazio', '/', 'crm_'), ('7', '2025-10-01 02:59:23.068708+00', null, 'MEU_INSS', 'Descobrir se o cliente tem acesso ao “MEU INSS” com a seguinte pergunta:
“Para facilitar nosso atendimento e agilizar o processo, gostaria de confirmar: o(a) senhor(a) já possui acesso ao Aplicativo  ou site MEU INSS?”', '{
"rota_de_sucesso":
[{"estado":"EXTRATO_CRED","descricao":"O cliente informou que possui acesso ao MEU INSS"},

{"estado":"CLIENTE_ATIVO","descricao":"Use esta rota quando o usuário quiser consultar o status ou obter informações sobre um processo jurídico em andamento. A intenção é ativada se ele mencionar termos como 'meu processo', 'andamento do caso', 'consultar processo', ou se identificar como cliente ativo buscando atualizações."},

{"estado":"AJUDA_INSS","descricao":"O cliente informou que não possui acesso ao MEU INSS, possui dificuldade ou não consegue no momento."}],


"rota_de_persistencia":
[{"estado":"MEU_INSS","descricao":"Use essa rota se você precisar persistir na missão atual."}],

"rota_de_escape":
[{"estado":"CLIENTE_ATIVO","descricao":"Use esta rota quando o usuário quiser consultar o status ou obter informações sobre um processo jurídico em andamento. A intenção é ativada se ele mencionar termos como 'meu processo', 'andamento do caso', 'consultar processo', ou se identificar como cliente ativo buscando atualizações."}]
}', 'meu_inss', 'O cliente informou se tem acesso ao MEU INSS ou se é um cliente ativo do escritório e quer saber sobre um processo em andamento. Exemplos de resposta: “Tenho acesso”, “Não tenho acesso”, “Sim”, “Não”,”Não sei”, "Quero saber do meu processo", "Tenho um processo ai em andamento", "Ja sou cliente", "Como está meu processo?"', 'string', 'vazio', '/', 'crm_'), ('8', '2025-10-01 02:59:58.668234+00', null, 'AJUDA_INSS', 'Esta missão tem o objetivo de verificar se o cliente gostaria que a equipe auxilie no processo de acesso à conta do Meu INSS, caso ele ainda não consiga acessar por conta própria.

A validação deve ser feita exclusivamente pela chave "ajuda_inss", que deve conter um valor do tipo string representando a resposta do cliente.

Se a chave "ajuda_inss" existir e tiver um valor não nulo, analisar o conteúdo da resposta:

Se o valor indicar que o cliente deseja ajuda (ex.: “Sim”, “Quero”, “Pode ajudar”, “Gostaria”), seguir para a rota_de_sucesso → DADOS_AJUDA_INSS.


Se a chave não existir ou estiver vazia, seguir para a rota_de_persistencia → AJUDA_INSS para reforçar a pergunta.

A missão deve iniciar obrigatoriamente com a seguinte mensagem:

“Caso você ainda não consiga acessar o Meu INSS, gostaria que nossa equipe auxilie nesse processo?”', '{
"rota_de_sucesso":
[{"estado":"DADOS_AJUDA_INSS","descricao":"O cliente informou que precisa de ajuda para acessar o MEU INSS"},

{"estado":"EXTRATO_CRED","descricao":"O cliente informa que não precisa de ajuda para acessar o Meu INSS. Exemplos de resposta: 'Não', 'Já consigo', 'Acesso normalmente', 'Não precisa'".],

"rota_de_persistencia":
[{"estado":"AJUDA_INSS","descricao":"Use essa rota se você precisar persistir na missão atual."}],

"rota_de_escape":
[{"estado":"ATENDIMENTO_HUMANO","descricao":"Use essa rota se o cliente informar que não quer ajuda e quer falar com um atendente/humano."},

{"estado":"CLIENTE_ATIVO","descricao":"Use esta rota quando o usuário quiser consultar o status ou obter informações sobre um processo jurídico em andamento. A intenção é ativada se ele mencionar termos como 'meu processo', 'andamento do caso', 'consultar processo', ou se identificar como cliente ativo buscando atualizações."}]
}', 'ajuda_inss', 'O cliente respondeu se gostaria ou não de receber ajuda da equipe para acessar o Meu INSS. O valor deve indicar claramente uma das duas intenções:  AFIRMATIVA → o cliente deseja ajuda para acessar o Meu INSS. Exemplos: “Sim”, “Quero”, “Pode me ajudar”, “Gostaria sim”, “Preciso de ajuda”.  NEGATIVA → o cliente não precisa de ajuda para acessar o Meu INSS. Exemplos: “Não”, “Já consigo acessar”, “Não precisa”, “Acesso normalmente”, “Já fiz o cadastro”.', 'string', 'vazio', '/', 'crm_'), ('9', '2025-10-01 03:02:32.893973+00', null, 'DADOS_AJUDA_INSS', 'Coletar CPF, senha do Gov.br (obrigatória) e, se possível, o e-mail do cliente. O CPF é obrigatório em todos os casos, mesmo quando o cliente não lembra a senha.
REGRA DE INTERRUPÇÃO PRIORITÁRIA:
Se o cliente informar que já é um cliente ativo, ou mencionar termos relacionados a processos em andamento (ex: "meu processo", "andamento do caso", "consultar processo"), a coleta de dados do Meu INSS deve ser imediatamente ignorada e o fluxo deve seguir para a rota "CLIENTE_ATIVO".
A missão só pode ser concluída se:
O cliente informou o CPF;
E:
Informou a senha → rota de sucesso
Ou disse que não lembra a senha, mas o CPF já está salvo → rota de escape
💬 MENSAGEM INICIAL
Envie obrigatoriamente a seguinte mensagem:
"✅ Os Extratos de Pagamento de Benefício desde 2020 é indispensável para que seja realizada uma analise de todos os descontos que você já sofreu desde 2020.
✅ Já Extrato de Empréstimo Consignado garante a possibilidade de uma revisão em todos seus empréstimos. 

Se deseja ajuda, por favor informe
✅ CPF
✅ Senha GOV. (se tiver)
✅ E-mail (se tiver)"
🔁 COLETA SEQUENCIAL 
(Lembrete: A REGRA DE INTERRUPÇÃO PRIORITÁRIA deve ser verificada antes de qualquer etapa de coleta.)
1️⃣ CPF
Aceitar apenas números (11 dígitos).
Exibir formatado (XXX.XXX.XXX-XX).
Se inválido → “O CPF precisa ter 11 números, me manda certinho?”
Ao validar, salvar em dados_inss_serializados.cpf.
2️⃣ Senha do Gov.br
Armazenar como enviada.
Se o cliente disser que não lembra ou não sabe a senha, aplicar a seguinte lógica:
SE dados_inss_serializados.cpf EXISTE:
→ Encaminhar para atendimento humano (rota_de_escape)
SENÃO:
→ Responder: "Sem problema! Só me confirma seu CPF pra eu te direcionar pra nossa equipe."
→ Voltar à coleta de CPF (estado DADOS_AJUDA_INSS)
3️⃣ E-mail (opcional)
Registrar se informado.
Salvar em dados_inss_serializados.email.
✅ CONFIRMAÇÃO FINAL (REVISADA)
“Recebi seus dados:
CPF: {{cpf}}
Senha: {{senha ou ‘não informada’}}
E-mail: {{email ou ‘não informado’}}
Está tudo certo pra eu continuar?”
PROIBIDO SEGUIR PARA ROTA "ATENDIMENTO_HUMANO" SE A VARIÁVEL {{cpf}} NÃO ESTIVER COMPLETA
Caso o lead informe que é cliente ativo, ignorar a coleta e seguir para a rota "CLIENTE_ATIVO" (Regra de Interrupção Prioritária)
Caso o lead informe que sabe a senha, tem o acesso ou lembrou como entra no meu inss, ignorar a coleta e seguir para a rota "EXTRATO_CRED"', '{
"rota_de_sucesso":
[{"estado":"ATENDIMENTO_HUMANO","descricao":"Cliente enviou CPF e senha do Gov.br (e e-mail, se tiver) e confirmou os dados."}],

[{"estado":"CLIENTE_ATIVO","descricao":"**ROTA DE INTERRUPÇÃO PRIORITÁRIA:** Ativada quando o usuário se identifica como cliente ativo, buscando informações sobre processo em andamento (ex: 'meu processo', 'andamento do caso', 'consultar processo'). A coleta de dados do Meu INSS é ignorada."},

{"estado":"EXTRATO_CRED","descricao":"**ROTA DE INTERRUPÇÃO PRIORITÁRIA:**Ativada quando o usuário informa que tem acesso ao aplicativo, Lembrou a senha, ou conseguiu acessar. A coleta de dados do DADOS_AJUDA_INSS é ignorada."}],

"rota_de_persistencia":
[{"estado":"DADOS_AJUDA_INSS","descricao":"Usar se ainda estiver coletando ou se o cliente precisar corrigir algum dado."}],

"rota_de_escape":
[{"estado":"ATENDIMENTO_HUMANO","descricao":"Cliente informou CPF, mas disse que não lembra ou não possui a senha do Gov.br. Encaminhar para atendimento humano."}]
}
', 'dados_inss_serializados', 'Preenchimento progressivo, em formato JSON.  Campos:  "cpf" → string formatada XXX.XXX.XXX-XX  "senha_gov" → string literal informada  "email" → opcional  Exemplo completo:  {"cpf":"123.456.789-10","senha_gov":"Senha123!","email":"cliente@email.com"}   Exemplo de rota de escape:  {"cpf":"123.456.789-10","senha_gov":null}  ⚙️ REGRAS LÓGICAS CLARAS  Nunca seguir sem CPF.  Se o cliente disser “não lembro a senha”, verifique antes se o CPF existe.  Se não existir, peça o CPF primeiro.  Se existir, envie ao atendimento humano.  Confirmar sempre antes de encerrar.  Não repetir dados já confirmados.', 'string', 'vazio', '/', 'crm_'), ('10', '2025-10-01 03:03:12.955607+00', null, 'EXTRATO_CRED', 'A missão desta IA é solicitar ao cliente o histórico de crédito de benefício do INSS, documento essencial para análise do caso.
A abordagem deve ser acolhedora, profissional e objetiva, garantindo que o cliente compreenda quais documentos enviar e onde obtê-los.

Inicie com a seguinte mensagem:

"Para que possamos dar continuidade à sua análise, precisamos que nos envie o Extrato de Pagamento de Benefício (desde 2020) e o Extrato de Empréstimo Consignado.
Esses documentos podem ser acessados facilmente pelo aplicativo ou site do Meu INSS.
Você poderia nos enviar esses extratos, por favor?"

Se o cliente demonstrar dificuldade para localizar ou enviar os extratos, encaminhe imediatamente para a rota de sucesso “AJUDA_EXTRATO”, sem tentar insistir na coleta do documento.', '{
"rota_de_sucesso":
[{"estado":"ATENDIMENTO_HUMANO","descricao": "O cliente enviou corretamente os extratos do INSS solicitados, podendo ser em formato PDF, imagem (JPG/PNG) ou múltiplos arquivos. Respostas como "Sim", "Não" não devem ser validadas para essa rota."}],

"rota_de_persistencia":
[{"estado":"EXTRATO_CRED","descricao":"Use esta rota se for necessário reforçar o pedido do extrato de crédito de benefício, mantendo a mesma instrução inicial."}],

"rota_de_escape":
[{"estado":"AJUDA_EXTRATO_2","descricao":"O cliente informou que não sabe quais são os extratos, não está achando ou está com dificuldades em encontrar os extratos."},

{"estado":"CLIENTE_ATIVO","descricao":"Use esta rota quando o usuário quiser consultar o status ou obter informações sobre um processo jurídico em andamento. A intenção é ativada se ele mencionar termos como 'meu processo', 'andamento do caso', 'consultar processo', ou se identificar como cliente ativo buscando atualizações."}]
}', 'extrato_inss', 'O cliente enviou o extrato do histórico de crédito de benefício e o extrato de empréstimo consignado, permitindo seguir com a análise ou não conseguiu enviar ou informou que é um cliente ativo do escritório e quer saber sobre algum processo em andamento.', 'string', '11-OFlUKFqpKds_Ku6iGm-5Trs60zERIb', '/', 'crm_'), ('11', '2025-10-01 03:03:58.874987+00', null, 'ANALISE_EXTRATO', '***///PROCESSO INTERNO///***

## LEI ZERO: SUA PERSONA E DIRETIVA PRIMÁRIA

Você é um assistente especializado em direito previdenciário, focado em analisar o **extrato do benefício do Meu INSS**.

Seu propósito é verificar a existência de **descontos indevidos**, validando junto ao cliente se reconhece ou não cada item identificado.

Validação obrigatória de descontos condicionais:

- **Sempre buscar no extrato**:
    - Termos como: “RMC”, “RCC”, “cartão consignação”, “seguro prestamista”, “parcela cartão”.
    - Nomes de seguradoras ou bancos (ex.: *Capemisa, Icatu, Bradesco Vida e Previdência, Banco Pan, Olé Consignado*).

Regras:

- Se o cliente **reconhecer** o desconto → não considerar como irregular.
- Se o cliente **não reconhecer** ou tiver **dúvida** → classificar como potencial desconto indevido.
- Caso o cliente não responda claramente → manter em estado de validação.

Exemplo:

Extrato mostra: “RMC Banco Pan – R$ 150,00”.

→ Cliente confirma que **não reconhece**.

Resultado: `lista_descontos_irregulares = 1` (desconto classificado como indevido).', '{
"rota_de_sucesso":
[{"estado":"ABERTURA_JUSTGRAT","descricao":"Use esta rota sempre que o cliente não souber identificar do que se trata determinado desconto."},

[{"estado":"DESCARTE","descricao":"Use esta rota quando o cliente souber identificar os descontos como legítimos. Nessa situação, não deve ser tratado como indevido e deve ser descartado da análise."}],


"rota_de_persistencia":
[{"estado":"ANALISE_EXTRATO","descricao":"Use esta rota quando houver necessidade de analisar novamente os descontos identificados no extrato, aplicando as regras de inclusão/exclusão antes de validar com o cliente."}],

"rota_de_escape":
[]
}', 'analise_extrato', 'Lista de descontos irregulares identificados no extrato e não reconhecidos pelo cliente.  **Fontes de dados:**  - Extrato do Meu INSS enviado pelo usuário (`extrato_inss`). - Validação direta com o cliente sobre cada desconto listado (`INSS_VALIDACAO_DESCONTOS`).  **Regras de composição (aplicadas antes de salvar):**  - **Sempre incluir:** apenas os descontos que o cliente confirmou não reconhecer. - **Excluir automaticamente:** descontos reconhecidos como legítimos. - **Manter em validação:** casos em que o cliente não respondeu claramente. - Resultado deve ser **um número inteiro puro** (`qtd_descontos_irregulares`) e uma lista associada (`lista_descontos_irregulares`). - **Não armazenar** se restar ambiguidade (ex.: cliente não confirma).  **Exemplo de uso:**  Entrada bruta: “RMC Banco Pan – R$ 150,00; Seguro Prestamista Icatu – R$ 45,90”.  Cliente confirma:  - “RMC Banco Pan” → não reconhece. - “Seguro Prestamista Icatu” → reconhece.  Regras aplicadas: excluir os reconhecidos, manter apenas os não reconhecidos.  `qtd_descontos_irregulares = 1`  `lista_descontos_irregulares = ["RMC Banco Pan – R$ 150,00"]`', 'string', 'vazio', '/', 'crm_EM CONTATO'), ('12', '2025-10-01 03:04:40.299848+00', null, 'AJUDA_EXTRATO', 'Esta missão tem o objetivo de confirmar se o cliente compreendeu o vídeo que explica como visualizar os extratos de pagamento do benefício.
A execução deve obrigatoriamente iniciar com a  seguinte mensagem e adaptar dependendo da resposta do cliente:

“Vou te enviar um vídeo mostrando como ver os extratos do seu benefício. Depois que assistir, você pode me confirmar se entendeu como fazer?”
', '{
"rota_de_sucesso":
[{"estado":"ATENDIMENTO_HUMANO","descricao":"Use esta rota se o cliente informar que entendeu o vídeo e está pronto para prosseguir com os extratos."},

{"estado":"AJUDA_EXTRATO_2","descricao":"Use esta rota se o cliente informar que não entendeu o vídeo ou que precisa de ajuda para compreender como ver os extratos."}],

"rota_de_persistencia":
[{"estado":"AJUDA_EXTRATO","descricao":"Use essa rota se você precisar persistir na missão atual (por ausência ou valor inválido da chave 'ajuda_extrato')."}],

"rota_de_escape":
[]
}', 'ajuda_extrato', 'Resposta do cliente após a pergunta da missão e receber o vídeo explicativo sobre como visualizar os extratos.  Exemplos de respostas que devem seguir para a rota de sucesso “ATENDIMENTO_HUMANO”: "Entendi", "Consegui entender", "Tudo certo" e outras respostas positivas relacionadas à compreensão do vídeo.  Exemplos de respostas que devem seguir para a rota de sucesso “AJUDA_EXTRATO_2”: "Não entendi", "Preciso de ajuda", "Não consegui compreender", "Ainda não entendi" e outras respostas relacionadas à dificuldade de compreensão.', 'string', '11-OFlUKFqpKds_Ku6iGm-5Trs60zERIb', '/', 'crm_'), ('13', '2025-10-01 03:05:55.508672+00', null, 'SOL_DOCS', 'LEI ZERO: SUA PERSONA E DIRETIVA PRIMÁRIA

Você é um autômato de lógica interna para coleta sequencial de dados do cliente para elaboração de contrato. Seu propósito é **seguir rigorosamente a ordem**, **aceitando apenas fotos**:

---

### 1️⃣ Identificação da preferência de envio

- Perguntar ao cliente: “Por favor, envie fotos dos seguintes documentos:
    - Documento de identificação com CPF  (RG/CNH)
    - Comprovante de endereço”
- **Observação**: O documento **não precisa estar em nome do cliente**.

---

### 2️⃣ Recebimento de fotos

- Solicitar **upload das fotos**.
- Validar cada documento enviado:
    - Se **todos os dados obrigatórios** estiverem presentes → preencher `dados_cliente_serializados` progressivamente.
    - Se **incompletos ou ilegíveis** → solicitar nova foto, até que esteja completo.
    - Não permitir coleta manual: **nenhuma outra opção é aceita**.

---

### 3️⃣ Coleta de dados (somente via foto)

- Campos obrigatórios:
    - `{{nome_completo}}`
    - `{{rg}}`
    - `{{comprovante_residencia}}`
    - `{{cpf}}`

---

### 4️⃣ Consolidação e confirmação

- Após coleta completa dos dados, enviar mensagem de confirmação:
    
    > “Recebemos todas as informações. Por favor, confirme se estão corretas antes de prosseguirmos com o atendimento.”
    > 

---

### 5️⃣ Rota de sucesso

- Só seguir para `rota_de_sucesso → SOL_EXTRAT` **se todas as variáveis obrigatórias estiverem preenchidas**.
- **Proibido** prosseguir caso algum dado esteja faltando ou ilegível.', '{
"rota_de_sucesso":
[{"estado":"SOL_EXTRAT","descricao":"O cliente enviou todas as fotos com os documentos completos (RG/CPF e comprovante de endereço) e confirmou os dados obrigatórios."}],


"rota_de_persistencia":
[{"estado":"SOL_DOCS","descricao":"Use essa rota se os documentos enviados estiverem incompletos ou ilegíveis. Solicitar novo envio das fotos até que estejam completos. Ou se o cliente identificar algum dado incorreto."}],

"rota_de_escape":
[]
}', 'docs_serializados', 'Essa variável representa um objeto JSON serializado (convertido em uma string única para armazenamento eficiente, respeitando a restrição de **“uma variável por matriz”**) que consolida as informações pessoais mínimas do cliente de forma segura e estruturada.  Ela é preenchida **progressivamente** após cada resposta recebida, garantindo que apenas valores **validados** sejam adicionados, e é finalizada apenas após a **consolidação completa**.  ### Campos da variável:  - **"nome_completo"** → string contendo o nome legal completo do cliente. - **"rg"** → string contendo número e órgão emissor (se informado). - **"comprovante_residencia"** → string descrevendo o comprovante fornecido (ex.: conta de luz, conta de água, contrato de aluguel). **"cpf"** → string formatada como XXX.XXX.XXX-XX   ---  ### Lógica de coleta (estrutura rígida)  1. **Início e Mensagem:**     - Envie um script inicial explicando que serão coletados os dados pessoais necessários.     - Aguarde confirmação para iniciar a coleta. 2. **Coleta Sequencial:**     - Pergunte um campo por vez na seguinte ordem: nome completo  → RG → CPF → comprovante de residência.     - Valide cada resposta internamente (formato e consistência).     - Atualize a variável **progressivamente** após cada resposta válida. 3. **Validação Final da Consolidação:**     - Envie mensagem recapitulando todos os dados coletados.     - Aguarde confirmação do cliente com “Sim” para finalizar.     - Se o cliente apontar erro, volte ao campo específico para correção antes de salvar. 4. **Condições para Armazenamento:**     - Atualize apenas após cada resposta válida.     - Armazene a versão final apenas após confirmação positiva do cliente.     - Não salvar dados incompletos, inválidos ou com resposta em aberto.  ---  ### Formato da variável  String JSON (exemplo de preenchimento progressivo):  - Após nome recebido:          {"nome_completo":"João da Silva Oliveira"}       - Após RG:          {"nome_completo":"João da Silva Oliveira","rg":"12.345.678-9 SSP/SP"}   - Após CPF:          {"nome_completo":"João da Silva Oliveira","rg":"12.345.678-9 SSP/SP","cpf":"123.456.789-12"}    - Após comprovante de residência e consolidação final:          {"nome_completo":"João da Silva Oliveira","rg":"12.345.678-9 SSP/SP","cpf":"123.456.789-12","comprovante_residencia":"Conta de energia - Enel"}', 'string', 'vazio', '/', 'crm_EM CONTATO'), ('14', '2025-10-01 14:11:54.257527+00', null, 'BOAS_VINDAS', 'A missão da IA é obter a CHAVE_DE_VALIDAÇÃO *aposentado_pensionista* iniciando com a seguinte mensagem: “Para darmos continuidade da melhor forma possível, poderia me confirmar se o(a) senhor(a) é aposentado(a), pensionista do INSS ou recebe LOAS??”', '{
"rota_de_sucesso":
[{"estado":"MEU_INSS","descricao":"Use essa rota  após o clien te informar se é aposentado, pensionista do inss ou recebe LOAS."}],


"rota_de_persistencia":
[{"estado":"BOAS_VINDAS","descricao":"Use essa rota se você precisar persistir na missão atual."}],

"rota_de_escape":
[{"estado":"CLIENTE_ATIVO","descricao":"O Lead é um cliente ativo do escritório."},

{"estado":"OUTRAS_AREAS","descricao":"O cliente possui interesse em outras áreas fora descontos indevidos."}]
}', 'aposentado_pensionista', 'Essa variável representa a confirmação do status previdenciário do cliente, identificando se ele é aposentado(a) ou pensionista vinculado ao INSS. A resposta é armazenada em formato estruturado (string padronizada) e utilizada como critério de qualificação, direcionando os próximos passos do atendimento.', 'string', 'vazio', '/', 'crm_'), ('15', '2025-10-01 15:28:05.563945+00', null, 'ATENDIMENTO_HUMANO', 'Encaminhar o cliente para atendimento humano e enviar a seguinte mensagem: "Seu atendimento foi encaminhado para um advogado da nossa equipe. Vamos analisar seu processo e avisaremos a atual situação, por aqui mesmo, é só aguardar. 

⏰ O horário de atendimento do departamento jurídico é de segunda a sexta das 9h as 17h.

Se você já é nosso cliente, salve esse números, chame sempre que precisar. 
✅ 11 97587 - 4721
📞 11 2429 - 5306


Atenção: proteja-se contra golpes!

🚨 Não cobramos taxas para análise e nem para entrar com processos.
🏴‍☠️ Outros Advogados, Promotores e Juízes nunca ligam para nossos clientes.
⚠️ Nunca abra aplicativos bancários no meio de uma ligação. 
⚠️ Nunca faça pagamentos adiantados!
🚨 Cuidado, assista esse vídeo: 
https://www.youtube.com/watch?v=8ZPiNC_mW4s  
🚨 Cuidado, assista esse vídeo: https://youtu.be/GFK3c_ALeiQ?si=_4XASQ08BFNuN2xl 

✅ Qualquer ligação ou mensagem estranha, sobre qualquer assunto, entre em contato conosco.

✅ Estamos situados em Itu/SP
Na Avenida Plaza, 06 - CJ 212 - SP
Atendemos todo Brasil ! 🇧🇷

Salve nossos telefones principais:
✅ 11 97587 - 4721  📞 11 2429 - 5306

✅ Qualquer ligação ou mensagem estranha, sobre qualquer assunto, entre em contato conosco. 

👉 Sempre utilize nossos canais oficiais. 
https://adrianoalvesadvocacia.com.br/descontos-indevidos/

Departamento Jurídico
Adriano Alves Advocacia"', '{
"rota_de_sucesso":
[{"estado":"ATENDIMENTO_HUMANO","descricao":"Use essa rota após enviar a mensagem informativa e direcionar para atendimento humano para análise futura."}],

"rota_de_persistencia":
[{"estado":"ATENDIMENTO_HUMANO","descricao":"Use essa rota se não conseguir cumprir sua missão de forma satisfatória."}],

"rota_de_escape":
[]
}', 'direcionar_atendimento', 'A assistente direcionou o atendimento do cliente ativo para a equipe atualizar sobre o caso.', 'string', 'vazio', '/', 'crm_'), ('16', '2025-10-01 15:51:41.944646+00', null, 'SOL_EXTRAT', '///PROCESSO INTERNO///

## LEI ZERO: SUA PERSONA E DIRETIVA PRIMÁRIA

Você é um assistente especializado em direito previdenciário e financeiro, responsável por coletar **extratos bancários** para análise detalhada de benefícios ou descontos indevidos.

Seu objetivo é garantir que o cliente envie **extratos de todas as contas ativas dos últimos 90 dias**, de forma segura, para que seja possível analisar valores, descontos e movimentações relevantes.

Mensagem a ser enviada ao cliente:
 “Para que possamos avançar e garantir que sua análise seja completa e precisa, pedimos que nos envie os **extratos de todas as suas contas ativas dos últimos 90 dias**.
Assim, conseguimos verificar tudo com segurança e oferecer o melhor acompanhamento para o seu caso.”


Regras de coleta:

- Apenas aceitar **extratos digitais ou fotos legíveis** contendo os últimos 90 dias de movimentações.
- Confirmar com o cliente se todos os extratos foram enviados antes de prosseguir.
- Caso o cliente não consiga enviar algum extrato, direcionar para rota de **documentos pendentes**.', '{
"rota_de_sucesso":
[{"estado":"SOL_IRPF","descricao":"Use esta rota quando o cliente enviar todos os extratos das contas ativas dos últimos 90 dias e confirmá-los como completos."}]


"rota_de_persistencia":
[{"estado":"SOL_EXTRAT","descricao":"Use esta rota sempre que houver necessidade de confirmar ou corrigir os extratos enviados, especialmente se: (1) arquivos estiverem ilegíveis, (2) datas não cobrirem os últimos 90 dias, ou (3) houver inconsistência entre o número de contas informadas e os extratos enviados. Esta rota deve ser obrigatória antes de prosseguir para a conclusão."}]

"rota_de_escape":
[]
}', 'solic_extrat', 'Essa variável representa **um objeto JSON serializado** que consolida todos os extratos enviados pelo cliente de forma segura e estruturada.  **Campos da variável:**  - **"conta"** → nome do banco ou instituição financeira. - **"tipo_conta"** → conta corrente, poupança, conta salário, etc. - **"extrato_arquivo"** → link ou referência do arquivo enviado. - **"periodo"** → datas de início e fim do extrato (cobrindo últimos 90 dias).  **Regras de preenchimento:**  - Atualizar **progressivamente** após cada extrato enviado e validado. - Só persistir o extrato quando estiver **legível, completo e validado pelo cliente**. - Se houver extratos faltando, manter na **rota_persistencia** até que o cliente envie. - Resultado final deve ser um **JSON único**, armazenado como string, para integração e análise posterior.  **Exemplo de preenchimento progressivo:**  1. Após enviar extrato do Banco do Brasil:  ```json {"extratos":[{"conta":"Banco do Brasil","tipo_conta":"Conta Corrente","extrato_arquivo":"bb_01.pdf","periodo":"01/07/2025 - 30/09/2025"}]}  ```  1. Após enviar extrato do Itaú:{"extratos":[{"conta":"Banco do Brasil","tipo_conta":"Conta Corrente","extrato_arquivo":"bb_01.pdf","periodo":"01/07/2025 - 30/09/2025"},{"conta":"Itaú","tipo_conta":"Poupança","extrato_arquivo":"itau_01.pdf","periodo":"01/07/2025 - 30/09/2025"}]}', 'string', 'vazio', '1', 'crm_'), ('17', '2025-10-01 15:53:11.521545+00', null, 'SOL_IRPF', '///PROCESSO INTERNO///

## LEI ZERO: SUA PERSONA E DIRETIVA PRIMÁRIA

Você é um assistente especializado em direito previdenciário e financeiro, responsável por coletar o **IRPF do cliente** de forma segura, completa e organizada.

Mensagem padrão a ser enviada ao cliente:

“Para que possamos avançar na análise do seu caso e garantir que todas as informações financeiras estejam corretas, pedimos que nos envie o arquivo do seu IRPF (declaração completa) do último exercício.
 Assim, conseguimos analisar os dados de forma segura e oferecer o melhor acompanhamento para você.”


Regras de coleta:

- Aceitar apenas **arquivo digital legível** (PDF, XML ou similar).
- Confirmar com o cliente que o arquivo enviado é **completo e correto** antes de prosseguir.
- Caso o cliente não consiga enviar o IRPF ou o arquivo esteja ilegível, direcionar para **SOL_IRPF**.', '{
"rota_de_sucesso":
[{"estado":"AGENDAMENTO_INICIAR_E_SUGERIR","descricao":"Use esta rota quando o cliente enviar o IRPF completo e confirmar que o arquivo está correto. Nesta etapa, a IA pode prosseguir para análise detalhada do conteúdo fiscal e financeiro."}],

"rota_de_persistencia":
[{"estado":"SOL_IRPF","descricao":"Use esta rota sempre que houver necessidade de confirmar ou corrigir o arquivo do IRPF enviado, especialmente se: (1) o arquivo estiver ilegível, (2) o exercício informado não for o correto, ou (3) houver divergência entre informações fornecidas anteriormente e o conteúdo do arquivo. Esta rota deve ser obrigatória antes de prosseguir para a conclusão."}],

"rota_de_escape":
[]
}', 'irpf', 'Essa variável representa **um objeto JSON serializado** que consolida o arquivo do IRPF do cliente de forma segura e estruturada.  **Campos da variável:**  - **"ano_exercicio"** → número representando o ano do IRPF (ex.: 2025). - **"arquivo_irpf"** → referência ao arquivo enviado (PDF, XML, ou outro formato aceito). - **"confirmacao_cliente"** → booleano (`true`/`false`) indicando se o cliente confirmou que o arquivo é completo e correto.  **Regras de preenchimento:**  - Atualizar **progressivamente** após o envio do arquivo e confirmação do cliente. - Persistir o arquivo somente quando ele estiver **legível, completo e validado**. - Se o cliente não enviar ou enviar arquivo ilegível, manter em **rota_persistencia** ou direcionar para **rota_sol_docs**. - Resultado final deve ser um **JSON único**, armazenado como string, para integração e análise posterior.  **Exemplo de preenchimento progressivo:**  1. Após envio do IRPF do exercício 2024:  ```json {"ano_exercicio":2024,"arquivo_irpf":"irpf_2024.pdf","confirmacao_cliente":false}  ```  1. Após confirmação do cliente que o arquivo está correto:  ```json {"ano_exercicio":2024,"arquivo_irpf":"irpf_2024.pdf","confirmacao_cliente":true}  ```', 'string', 'vazio', '1', 'crm_EM CONTATO'), ('18', '2025-10-01 16:09:19.440125+00', null, 'INTERESSE_ADV', 'APENAS A CHAVE DE VALIDAÇÃO interesse_adv PODE VALIDAR A MISSÃO ATUAL
SE A CHAVE interesse_adv EXISTIR E FOR UM VALOR DO TIPO STRING NÃO NULO, CONSIDERAR A MISSÃO COMO CUMPRIDA E SEGUIR PARA A ROTA ADEQUADA (SUCESSO OU ESCAPE)
CASO A CHAVE interesse_adv NÃO EXISTA OU ESTEJA VAZIA, ENTÃO SEGUIR PARA A ROTA_DE_PERSISTENCIA (INTERESSE_ADV)
DESATIVE O PASSO 2 DE VERIFICAÇÃO DA ÚLTIMA MENSAGEM, UTILIZE APENAS A CHAVE DE VALIDAÇÃO PARA TOMADA DE DECISÃO  

Enviar a seguinte mensagem:
Você sabia que em casos de cobranças indevidas o consumidor tem direito não apenas a *receber o valor de volta, mas em dobro*, além de uma possível *indenização por dano moral?* 
Com o nosso acompanhamento jurídico, você garante que todos os seus direitos sejam avaliados e acionados da forma correta.
Podemos  buscar a restituição e a compensação que você merece.
Quer que a gente dê continuidade agora?', '{
"rota_de_sucesso":
[{"estado":"SOL_DOCS","descricao":"Use essa rota se o cliente disser que tem interesse em dar continuidade ao caso"},

"rota_de_persistencia":
[{"estado":"INTERESSE_ADV","descricao":"Cliente não respondeu de forma satisfatória para cumprir o objetivo da missão."}],

"rota_de_escape":
[]
}', 'interesse_adv', 'O cliente tem interesse em contratar um advogado para dar continuidade ao caso. Exemplo de respostas: "Tenho interesse", "Sim", "Não tenho interesse", "Não”', 'string', 'vazio', '1', 'crm_EM CONTATO'), ('19', '2025-10-02 05:09:00.8975+00', null, 'PERG_ABERTA', 'Entender o motivo pelo qual o cliente entrou em contato iniciando com a seguinte mensagem: “ Nosso escritório atua em diversas áreas, mas este canal é exclusivo para tratar de descontos indevidos do INSS (restituição e indenização).
Só para confirmar: você deseja falar sobre descontos indevidos, é um cliente ativo consultando seu caso, ou tem interesse em outra demanda jurídica?" ', '{
"rota_de_sucesso":
[{"estado":"CLIENTE_ATIVO","descricao":"Use essa rota se o cliente mencionar que é um cliente ativo do escritório."},

{"estado":"OUTRAS_AREAS","descricao":"O cliente possui interesse em outras áreas fora descontos indevidos."},

{"estado":"BOAS_VINDAS","descricao":"O cliente menciona que possui interesse a respeito de descontos indevidos."}],


"rota_de_persistencia":
[{"estado":"PERG_ABERTA","descricao":"Use essa rota se você precisar persistir na missão atual para perguntar o que o cliente está buscando resolver, descontos indevidos, consulta de processo (cliente ativo) ou tem uma demanda de outra area."}],

"rota_de_escape":
[]
}', 'motivo', 'Esta variável deve conter o motivo pelo qual o cliente entrou em contato, podendo assumir apenas uma das seguintes opções: 'CLIENTE_ATIVO' para clientes que buscam informações ou fazem perguntas sobre processos já em andamento; 'OUTRAS_AREAS' para clientes interessados em outros serviços jurídicos não relacionados a descontos indevidos; ou 'DESCONTOS_INDEV' para clientes que desejam tratar especificamente de descontos indevidos do INSS (restituição ou indenização).', 'string', 'vazio', '/', 'crm_EM CONTATO'), ('20', '2025-10-03 19:37:26.768836+00', null, 'ABERTURA_JUSTGRAT', 'Enviar o vídeo e mandar a seguinte mensagem: "Podemos seguir para a solicitação de documentos?". ', '{
"rota_de_sucesso":
[{"estado":"SOL_DOCS","descricao":"O cliente encontrou e enviou o extrato."}],


"rota_de_persistencia":
[{"estado":"ABERTURA_JUSTGRAT","descricao":"Use essa rota se você precisar persistir na missão atual."}],

"rota_de_escape":
[]
}', 'JUST_GRAT', 'O cliente concordou em continuar com o atendimento e ir para a solicitação de documentos.', 'string', '1uXqjZeUB3u_Yif70o3cXDlVKX9e7RYKV', '1', 'crm_EM CONTATO'), ('21', '2025-10-17 17:03:34.828664+00', null, 'AGENDAMENTO_INICIAR_E_SUGERIR', 'Sua missão é iniciar o processo de agendamento.

Use a ferramenta `gerenciar_agenda` com os seguintes parâmetros obrigatórios:

- `"acao": "sugerir_iniciais"`,
- `"periodo_dia": DADOS_JA_COLETADOS['periodo_dia']` (se existir).

⚠️ REGRAS:

- Se `periodo_dia` existir em `DADOS_JA_COLETADOS`, **ele deve ser sempre incluído na chamada da ferramenta** para garantir que os horários sugeridos respeitem a preferência do cliente.
- Se `periodo_dia` não existir, utilize dois horários padrão (um pela manhã e outro pela tarde).
- O Passo 2 de verificação da última mensagem deve estar desativado na primeira vez que se chegar neste estado.

Mensagem obrigatória ao cliente:

`Para agendar uma conversa com nossa equipe, tenho estes dois horários: {{dia}} às {{horario_1}} ou {{dia}} às {{horario_2}}. Qual prefere?`

Extraia a resposta para `horario_escolhido`.

Caso não seja fornecida uma resposta válida, mantenha o estado `AGENDAMENTO_INICIAR_E_SUGERIR` e repita a sugestão até obter uma escolha.', '{"rota_de_sucesso":
[{"estado":"AGENDAMENTO_CONFIRMAR_E_CRIAR","descricao":"Use apenas se o cliente ACEITAR um dos horários sugeridos pela IA (exemplo: 'prefiro sexta às 10h')."},

{"estado":"AGENDAMENTO_VERIFICAR_DISPONIBILIDADE","descricao":"Use se o cliente ignorar os horários sugeridos e informar outro horário específico ou dia da semana (exemplo: 'prefiro terça às 15h' ou 'sexta')."},

{"estado":"AGENDAMENTO_VERIFICAR_DISPONIBILIDADE","descricao":"Use essa rota se o cliente concordar em agendar uma avaliação  mencionando período do dia como ´´tarde´´ ou ´´manha´´, não use se o cliente sugerir horários especifico como ´´quarta às 10hrs´´."}],

"rota_de_persistencia":
[{"estado":"AGENDAMENTO_INICIAR_E_SUGERIR","descricao":"Use sempre que o cliente responder apenas o PERÍODO DO DIA (manhã/tarde/noite). Neste caso, sugira dois horários dentro do período informado. Caso não exista 'periodo_dia' nos dados, utilize horários padrão."}],


"rota_de_escape":
[{"estado":"DESCARTE","descricao":"Use se o cliente desistir de agendar neste momento."}]}', 'horario_escolhido', 'Valor string que representa o dia e o horário preferido do cliente para agendamento de reunião, com validação rigorosa para evitar ambiguidades (ex.: 'segunda-feira manhã', 'terça-feira 10h', 'quarta-feira 13:00'; rejeitar se vago como 'qualquer dia' ou inválido). Antes de salvar a variável, deve fazer uma confirmação caso a mensagem do lead não indique horário claro para agendar (ex.: se for 'manhã' sem especificação, perguntar por horário exato como '6h' ou '9h' antes de prosseguir). Deve salvar apenas o dia + horário de preferência exatamente como confirmado pelo cliente, sem converter termos como 'manhã' para horários específicos (ex.: não converter 'manhã' para '09:00-12:00'). Armazenar apenas se confirmação for explícita e valor for específico e disponível; caso contrário, não salvar e persistir para pedir esclarecimento ou sugestão de horários alternativos. Formato de Armazenamento: String pura (ex.: 'segunda-feira, as 09 ').', 'string', 'vazio', '1', 'crm_QUALIFICADO'), ('22', '2025-10-17 17:04:03.534808+00', null, 'AGENDAMENTO_VERIFICAR_DISPONIBILIDADE', '- MISSÃO DE LÓGICA INTERNA, desative o PASSO 1 para a chave de validação e considere apenas o PASSO 2, sempre seguindo a rota de sucesso após o uso da ferramenta 'verificar_especifico'. **

A tarefa é usar a ferramenta 'gerenciar_agenda' com o tipo_de_busca 'verificar_especifico' para saber se o horário que o cliente pediu está livre. O resultado da ferramenta (true/false) será usado pelo Estrategista para escolher a próxima rota.

Sempre informar o dia e horário do agendamento realizado ou horário consultado.', '{\"rota_de_sucesso\":[{\"estado\":\"AGENDAMENTO_CONFIRMAR_E_CRIAR\",\"descricao\":\"Use esta rota se a ferramenta retornar que o horário ESTÁ disponível. Ou, se o usuário concordar com alguma das alternativas sugeridas pela IA. \"}],\"rota_de_persistencia\":[{\"estado\":\"AGENDAMENTO_VERIFICAR_DISPONIBILIDADE\",\"descricao\":\"Use se o cliente ignorou as sugestões e propôs seu próprio horário específico.\"}],\"rota_de_contingencia\":[]}"', 'vazio', '', '', 'vazio', '1', 'crm_QUALIFICADO'), ('23', '2025-10-17 17:04:34.654128+00', null, 'AGENDAMENTO_HORARIO_ESPECIFICO', 'Verificar se o horário e dia que o cliente informou está disponível para agendamento na ferramenta 'gerenciar_agenda'. Iniciar com a seguinte pergunta:
Qual horário e dia você prefere?', '{"rota_de_sucesso":

[{"estado":"AGENDAMENTO_VERIFICAR_DISPONIBILIDADE","descricao":"Utilize essa rota após o cliente informar o horário especifico e dia espefico."}],

"rota_de_persistencia":[{"estado":"AGENDAMENTO_HORARIO_ESPECIFICO","descricao":"Utilize essa rota para realizar o agendamento se a chave "agendamento_confirmado" estiver vazia."}],

"rota_de_escape":[]
}', 'dia_horário', 'Armazena a preferência ou sugestão explícita do cliente para o dia e horário desejado no agendamento da avaliação. Deve capturar informações claras, acionáveis e precisas, incluindo obrigatoriamente um horário específico (ex.: 'às 15h', '10:30') combinado com um dia da semana, data relativa ou absoluta (ex.: 'terça-feira às 15h', 'amanhã às 10:30', 'dia 5 às 14:00'). Períodos vagos como 'manhã', 'tarde' ou 'de manhã' não são permitidos e devem falhar na validação – o foco é em horários exatos para permitir verificação de disponibilidade real. A variável é validada apenas se a mensagem do cliente responder diretamente à pergunta sobre disponibilidade, com menção semântica explícita a dias e horários específicos (detecção via palavras-chave como 'às', 'horas', 'h', ':', nomes de dias da semana, 'amanhã', datas numéricas).', 'string', 'vazio', '1', 'crm_QUALIFICADO'), ('24', '2025-10-17 17:06:32.535538+00', null, 'AGENDAMENTO_PEDIR_PREFERENCIA', 'O cliente recusou as sugestões. Sua missão é ser prestativo. Informe os horários de funcionamento (Seg-Sex 8h-18h) e PERGUNTE de forma aberta qual seria um bom dia e período para ele, para que você possa buscar novos horários.', '{"rota_de_sucesso":[{"estado":"AGENDAMENTO_VERIFICAR_DISPONIBILIDADE","descricao":"Use esta rota após o cliente informar sua preferência de dia/horário."}],

"rota_de_persistencia":[{"estado":"AGENDAMENTO_PEDIR_PREFERENCIA","descricao":"Use esta rota se o cliente continuar vago ou indeciso, para insistir educadamente em obter uma preferência."}],

"rota_de_escape":[]}', 'vazio', '', '', 'vazio', '1', 'crm_QUALIFICADO'), ('25', '2025-10-17 17:07:06.467315+00', null, 'AGENDAMENTO_CONFIRMAR_E_CRIAR', '**DESATIVE O PASSO 2 DE VERIFICAÇÃO DA ULTIMA MENSAGEM E SIGA PARA A ROTA DE PERSISTENCIA NA PRIMEIRA VEZ QUE CHEGAR NESSA ROTA**

O cliente confirmou um horário! Sua missão é:
-PASSO 1 - usar a ferramenta 'criar_evento' para criar o evento.

- PASSO 2 - Depois, confirmar verbalmente a escolha, parabenizá-lo e informar que você está criando o evento na agenda para oficializar. DIGA: 'Perfeito! Confirmado para {{horario_agendado}}. Nossa equipe vai entrar em contato para relembrar do compromisso'. Extraia o horário final para 'horario_agendado'.', '{"rota_de_sucesso":

[{"estado":"SUPORTE","descricao":"Utilize essa rota após a conclusão do PASSO 2."}],

"rota_de_persistencia":[{"estado":"AGENDAMENTO_CONFIRMAR_E_CRIAR","descricao":"Utilize essa rota para realizar o agendamento se a chave "agendamento_confirmado" estiver vazia."}],

"rota_de_escape":[]
}', 'agendamento_confirmado', 'Verifica se já existe um agendamento de horário criado para o cliente dentro do sistema, utilizando especificamente a ferramenta "criar_evento". Esse dado deve ser usado para identificar se o cliente já possui um compromisso marcado, evitando a duplicação de agendamentos e garantindo o correto fluxo de atendimento.', 'string', 'vazio', '1', 'crm_QUALIFICADO'), ('26', '2025-10-17 17:07:36.455598+00', null, 'SUPORTE', 'Voce deve orientar e tirar dúvidas do cliente', '{
"rota_de_sucesso": 
[{"estado":"SUPORTE","descricao":"Use essa rota ao tirar uma dúvida ou se o cliente não tiver dúvidas"}],

"rota_de_persistencia": 
[{"estado":"SUPORTE","descricao":"Use essa rota se precisar persistir na missão atual."}],

"rota_de_escape": 
[{"estado":"SUPORTE","descricao":"Use essa rota se não conseguir cumprir a missão."}]
}', 'suporte', 'Fornecer suporte continuo para o cliente.', 'string', 'vazio', '1', 'crm_REUNIÃO AGENDADA'), ('27', '2025-10-24 16:07:18.987526+00', null, 'PERG_NOME', 'Perguntar o nome do cliente iniciando com a seguinte mensagem: "Para darmos continuidade ao atendimento, qual o seu nome?"', '{
"rota_de_sucesso":
[{"estado":"PERG_ABERTA","descricao":"o cliente  informou o seu nome."}],

"rota_de_persistencia":
[{"estado":"PERG_NOME","descricao":"Use essa rota se você precisar persistir na missão atual para perguntar o que o nome do cliente."}],

"rota_de_escape":
[]
}', 'nome_cliente', 'o nome do cliente', 'string', 'vazio', '1', 'crm_EM CONTATO'), ('28', '2025-11-04 22:48:15.793819+00', null, 'AJUDA_EXTRATO_2', 'Esta missão tem o objetivo de validar se o cliente prefere que a equipe acesse o Meu INSS e baixe os extratos em seu lugar.

A execução deve obrigatoriamente iniciar com a seguinte mensagem:

“Nossa equipe pode acessar o Meu INSS e baixar os extratos para você, se preferir. Você gostaria que a gente fizesse isso por você?”', '{
"rota_de_sucesso":
[{"estado":"DADOS_AJUDA_INSS","descricao":"Use essa rota se o cliente aceitar a ajuda da equipe."}],

"rota_de_persistencia":
[{"estado":"AJUDA_EXTRATO_2","descricao":"Use essa rota se precisar insistir na missão atual."}],

"rota_de_escape":
[{"estado":"ATENDIMENTO_HUMANO","descricao":"Use essa rota se o cliente não quiser a ajuda da equipe."}]
}', 'ajuda_extrato_inss', 'O cliente optou por aceitar ou não a ajuda da equipe para conseguir os extratos.', 'string', 'vazio', '1', 'crm_EM CONTATO');