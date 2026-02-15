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

## 🌐 Deploy / Hospedagem

O projeto está pronto para hospedagem. Opções recomendadas:
- **VPS** (DigitalOcean, Contabo, etc.) com Node.js
- **Railway** / **Render** — deploy direto com Git
- **Vercel** (frontend) + API separada

Para produção, configure:
1. Variáveis de ambiente (PORT)
2. Número real do WhatsApp
3. Domínio e SSL (HTTPS)
4. Altere a senha do admin

---

**© 2026 Cadore Clinic** — Todos os direitos reservados.
