# 🌹 Cadore Clinic - Site Profissional

Site institucional premium com sistema de agendamento online para a **Cadore Clinic**, clínica de estética de alto padrão da profissional Eline Cadore.

## ⚡ Início Rápido

```bash
# Instalar dependências
npm install

# Iniciar o servidor
npm start

# Ou com hot-reload (desenvolvimento)
npm run dev
```

O site estará disponível em: **http://localhost:3000**

## 🔐 Painel Administrativo

Acesse: **http://localhost:3000/admin**

**Login padrão:**
- Usuário: `admin`
- Senha: `cadore2024`

> ⚠️ Altere a senha após o primeiro acesso nas configurações do painel.

## 📂 Estrutura do Projeto

```
Cadore Clinic/
├── public/                  # Arquivos estáticos (frontend)
│   ├── index.html           # Página principal do site
│   ├── css/style.css        # Estilos premium
│   ├── js/app.js            # JavaScript do site
│   └── admin/index.html     # Painel administrativo
├── src/                     # Backend (Node.js)
│   ├── server.js            # Servidor Express
│   ├── database.js          # Configuração SQLite
│   └── routes/
│       ├── api.js           # Rotas públicas (serviços, agendamento)
│       └── admin.js         # Rotas administrativas (protegidas)
├── data/                    # Banco de dados (criado automaticamente)
│   └── clinic.db
└── package.json
```

## 🎨 Funcionalidades

### Site Público
- **Home** — Banner elegante com chamada principal
- **Sobre** — História da Eline Cadore e expertise internacional
- **Serviços** — Listagem elegante com botões de agendamento
- **Agendamento Online** — Calendário interativo com seleção de serviço, data e horário
- **Agenda Internacional** — Datas e países de atendimento com bandeiras
- **Contato** — Formulário + informações de contato
- **Localização** — Mapa Google Maps (Setor Bueno, Goiânia)
- **WhatsApp** — Botão flutuante e integração em todo o site

### Painel Administrativo
- Visão geral com estatísticas
- Gerenciar agendamentos (confirmar, cancelar, excluir)
- Bloquear horários manualmente
- Adicionar viagens internacionais ao calendário
- Gerenciar serviços
- Visualizar mensagens de contato
- Exportar agendamentos em CSV
- Alterar Localização (mapa): em **/admin → Localização** pesquise por endereço (sem necessidade de latitude/longitude), selecione o resultado e clique em **Salvar Localização** — o mapa público será atualizado automaticamente.

## 🛠 Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js + Express 5
- **Banco de dados:** SQLite (better-sqlite3)
- **Fontes:** Google Fonts (Cormorant Garamond + Montserrat)
- **Design:** Responsivo, animações suaves, paleta carmim/dourado

## 📱 WhatsApp Integration

Configure o número de WhatsApp no arquivo `public/js/app.js`:

```javascript
const CONFIG = {
  whatsappNumber: '5562999999999', // Seu número com código do país
};
```

## 🌐 Deploy / Hospedagem (Hostinger)

Este projeto roda como **aplicação Node.js** (Express) e usa **SQLite** (`data/clinic.db`). A melhor opção na Hostinger é usar um plano que suporte Node.js (Cloud ou VPS). Abaixo estão os passos práticos para deixar o site rodando 100% no Hostinger.

### 1) Preparar repositório (feito automaticamente)
- Ignoramos `data/clinic.db` com `.gitignore` (não commitaremos o DB local).
- `npm start` já inicia o servidor (`src/server.js`).
- O projeto já cria/seed do DB automaticamente se estiver vazio.

> Importante: se tiver dados atuais no `data/clinic.db`, faça backup antes de desrastrear (ex.: baixe via FTP/SSH).

### 2) Passo-a-passo no hPanel (Hostinger — Node.js App)
1. Em **Hosting → Advanced → Node.js**, clique em **Create Application**.
2. Escolha a versão do Node (recomendo >=16).
3. Em **Application root** aponte para a pasta do projeto (ex.: `/home/usuario/cadore-clinic`).
4. Em **Startup file / Command** use: `npm start` (ou `node src/server.js`).
5. Clique para instalar dependências (ou conecte via SSH e rode `npm install --production`).
6. Start / Restart a aplicação pelo painel.
7. Configure o domínio no **Domains** e aponte o DNS (A record) para a Hostinger.
8. Ative SSL (Let's Encrypt) no hPanel para HTTPS.

### 3) Permissões & banco SQLite
- Garanta que a pasta `data/` seja gravável pelo processo Node (`chmod 755 data`).
- Backup do DB: baixe `data/clinic.db` periodicamente (FTP/SSH) ou configure cópias regulares.
- Se preferir banco gerenciado (MySQL), será necessário adaptar o código (trocar driver `better-sqlite3`).

### 4) Testes e produção
- Execute localmente: `npm install && npm start` e verifique `/admin`.
- Em produção, defina `NODE_ENV=production` no hPanel (opcional) e confirme que `PORT` está configurado pelo Hostinger.

### 5) Alternativa (VPS) — usar PM2
- Instale Node.js e PM2: `npm i -g pm2`
- Iniciar: `pm2 start npm --name cadore-clinic -- start`
- Persistir: `pm2 save` + `pm2 startup`

---

### Checklist rápido antes do deploy ✅
- [ ] Plano Hostinger suporta Node.js (Cloud/VPS)
- [ ] Fazer backup de `data/clinic.db`
- [ ] Atualizar `public/js/app.js` com número de WhatsApp real
- [ ] Alterar senha admin após o primeiro login
- [ ] Apontar domínio e ativar SSL

---

**© 2026 Cadore Clinic** — Todos os direitos reservados.
