# Advice Health

Aplicação web full-stack para gestão de tarefas com foco em produtividade, colaboração e acompanhamento de progresso.

## ✨ Principais funcionalidades

- Autenticação JWT (registro, login, refresh, perfil do usuário)
- CRUD de tarefas com:
  - prioridade e status (`todo`, `in_progress`, `review`, `done`)
  - data de início e prazo
  - recorrência
  - ordenação, busca e filtros
- Visualização em **lista** e em **board/kanban**
- Compartilhamento de tarefas por e-mail
- Subtarefas por tarefa (com toggle de conclusão)
- Comentários por tarefa
- Log de atividades
- Tracking de tempo (incluindo modo Pomodoro)
- Templates de tarefas
- Dashboard de insights com gráficos e exportação CSV
- Calendário de tarefas
- Gamificação (XP, níveis, streak, badges, metas semanais)
- Notificações (listar, marcar como lida, marcar todas)

---

## 🧱 Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, React Query, Axios, Recharts |
| Backend | Django 4.2, Django REST Framework, SimpleJWT, django-filter |
| Banco | PostgreSQL 15 |
| Containers | Docker, Docker Compose |
| Testes | pytest, pytest-django, pytest-cov, factory-boy |
| Qualidade | ESLint |

---

## 🗂️ Estrutura (resumo)

```text
.
├── backend/
│   ├── apps/
│   │   ├── users/        # auth, perfil de jogo, badges, metas, notificações
│   │   ├── tasks/        # tarefas, subtarefas, comentários, atividade, tempo, templates
│   │   └── categories/   # categorias por usuário
│   ├── config/           # settings, urls, paginação, permissões, throttling
│   ├── requirements/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── pages/        # Dashboard, Insights, Calendar, Gamification, Login, Register
│   │   ├── components/
│   │   ├── contexts/
│   │   └── services/     # camada HTTP (api, tasks, comments, stats, etc.)
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
└── .env.example
```

---

## 🚀 Como rodar com Docker

### Pré-requisitos

- Docker Desktop instalado e em execução

### 1) Clonar o projeto

```bash
git clone <repo-url>
cd Advice-Health
```

### 2) Variáveis de ambiente

Copie o arquivo de exemplo:

- Linux/macOS:

```bash
cp .env.example .env
```

- Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

> Para ambiente de desenvolvimento com `docker-compose.yml`, os serviços já têm defaults úteis. Ainda assim, manter `.env` é recomendado.

### 3) Subir os serviços

```bash
docker compose up --build -d
```

Acesse:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000/api`
- Admin Django: `http://localhost:8000/admin`

### Comandos úteis

```bash
docker compose down
docker compose down -v
docker compose logs -f
```

---

## 🛠️ Atalhos via Makefile

```bash
make up
make up-build
make down
make logs

make shell-backend
make shell-db

make migrate
make makemigrations
make createsuperuser

make test-backend
make test-backend-cov

make install
make lint
```

---

## ✅ Testes e qualidade

### Backend

```bash
# no container
docker compose exec -T backend python -m pytest --tb=short -v

# cobertura
docker compose exec -T backend python -m pytest --tb=short -v --cov=apps --cov-report=term-missing --cov-fail-under=70
```

### Frontend (lint)

```bash
cd frontend
npm ci
npm run lint
```

---

## 🚢 Deploy (pipeline completo com cache de imagem)

O workflow de deploy (`.github/workflows/deploy.yml`) está configurado para:

1. Rodar apenas quando a CI do `main` finalizar com sucesso
2. Buildar e publicar imagens Docker no GHCR com tags:
  - `latest`
  - `<sha-do-commit>`
3. Usar cache de camadas Docker (`buildx` + `type=gha`) para acelerar builds subsequentes
4. Disparar os deploy hooks do Render após o push das imagens

### Secrets necessários no GitHub

Configure em **Settings → Secrets and variables → Actions**:

- `RENDER_DEPLOY_HOOK_BACKEND`
- `RENDER_DEPLOY_HOOK_FRONTEND`

> O push no GHCR usa `GITHUB_TOKEN` automático do workflow (com permissão `packages: write`).

### Ajuste importante no Render

No `render.yaml`, os serviços estão com `autoDeploy: false` para evitar deploy duplicado.

- O deploy passa a ser acionado pelo workflow (hooks).
- O frontend foi padronizado para `runtime: docker` com `Dockerfile.prod`.

Se você já tem serviços antigos no Render com runtime diferente, aplique o blueprint atualizado ou ajuste manualmente no painel.

---

## 🔐 Endpoints da API

Base URL: `http://localhost:8000/api`

### Auth / Usuário

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/auth/register/` | Criar conta |
| POST | `/auth/login/` | Login (retorna `access` e `refresh`) |
| POST | `/auth/refresh/` | Renovar token de acesso |
| GET | `/auth/me/` | Dados do usuário autenticado |
| GET | `/auth/game-profile/` | Perfil de gamificação |
| GET | `/auth/badges/` | Badges conquistadas |
| GET | `/auth/badges/all/` | Catálogo de badges |
| GET | `/auth/goals/` | Listar metas semanais |
| POST | `/auth/goals/` | Criar meta semanal |
| PATCH | `/auth/goals/{id}/` | Atualizar meta semanal |
| GET | `/auth/goals/current/` | Meta da semana atual |
| GET | `/auth/notifications/` | Listar notificações |
| POST | `/auth/notifications/{id}/read/` | Marcar notificação como lida |
| POST | `/auth/notifications/read-all/` | Marcar todas como lidas |
| GET | `/auth/notifications/unread-count/` | Contador de não lidas |

### Categorias

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/categories/` | Listar categorias do usuário |
| POST | `/categories/` | Criar categoria |
| GET | `/categories/{id}/` | Detalhar categoria |
| PATCH | `/categories/{id}/` | Atualizar categoria |
| DELETE | `/categories/{id}/` | Remover categoria |

### Tarefas

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/tasks/` | Listar tarefas (próprias + compartilhadas) |
| POST | `/tasks/` | Criar tarefa |
| GET | `/tasks/{id}/` | Detalhar tarefa |
| PATCH | `/tasks/{id}/` | Atualizar tarefa |
| DELETE | `/tasks/{id}/` | Remover tarefa |
| POST | `/tasks/{id}/share/` | Compartilhar tarefa por e-mail |
| POST | `/tasks/{id}/toggle/` | Alternar concluída/reaberta |
| PATCH | `/tasks/{id}/move/` | Mover status/posição (board) |
| POST | `/tasks/{id}/create-from-recurrence/` | Gerar próxima tarefa recorrente |
| GET | `/tasks/stats/` | KPIs e dados dos gráficos |
| GET | `/tasks/export/` | Exportar tarefas em CSV |

### Subtarefas

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/tasks/{task_id}/subtasks/` | Listar subtarefas |
| POST | `/tasks/{task_id}/subtasks/` | Criar subtarefa |
| PATCH | `/tasks/{task_id}/subtasks/{id}/` | Atualizar subtarefa |
| DELETE | `/tasks/{task_id}/subtasks/{id}/` | Remover subtarefa |
| POST | `/tasks/{task_id}/subtasks/{id}/toggle/` | Toggle de conclusão |

### Comentários

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/tasks/{task_id}/comments/` | Listar comentários |
| POST | `/tasks/{task_id}/comments/` | Criar comentário |
| DELETE | `/tasks/{task_id}/comments/{id}/` | Excluir comentário |

### Atividade, tempo e templates

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/tasks/activity/` | Feed de atividades |
| GET | `/tasks/time-entries/` | Listar registros de tempo |
| POST | `/tasks/time-entries/` | Iniciar registro de tempo |
| GET | `/tasks/time-entries/active/` | Registro ativo |
| POST | `/tasks/time-entries/{id}/stop/` | Finalizar registro |
| GET | `/tasks/templates/` | Listar templates |
| POST | `/tasks/templates/` | Criar template |
| DELETE | `/tasks/templates/{id}/` | Excluir template |
| POST | `/tasks/templates/{id}/use/` | Criar tarefa a partir do template |

---

## 🔎 Filtros importantes em `/tasks/`

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| `completed` | `true` | Filtrar por concluídas |
| `status` | `in_progress` | Filtrar por status |
| `priority` | `urgent` | Filtrar por prioridade |
| `category` | `3` | Filtrar por categoria |
| `search` | `reunião` | Busca por título/descrição |
| `ordering` | `-created_at` | Ordenação |
| `page` | `2` | Paginação |

---

## ⚙️ Variáveis de ambiente

Referência em `.env.example`:

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`
- `CORS_ALLOWED_ORIGINS`
- `VITE_API_URL`

---

## 🧠 Notas de implementação

- Refresh token automático no frontend via interceptor Axios.
- Controle de visibilidade: tarefas próprias + compartilhadas.
- Throttling para endpoints de autenticação.
- Pontuação e badges atualizados por ações de tarefa/tempo.
- Exportação CSV para facilitar análise externa.

---

## 📄 Licença

Defina aqui o tipo de licença do projeto (MIT, Apache-2.0 etc.).
