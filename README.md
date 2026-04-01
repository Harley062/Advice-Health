# To-Do List Application

Aplicação web full-stack de gerenciamento de tarefas com autenticação JWT, categorias, compartilhamento entre usuários, filtragem, paginação e integração com API externa.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, Axios, React Query, React Router v6 |
| Backend | Django 4.2 + Django REST Framework, SimpleJWT, django-filter |
| Banco de dados | PostgreSQL 15 |
| Containers | Docker + Docker Compose |
| Testes backend | pytest + factory-boy |
| Testes frontend | Selenium (E2E) |
| CI/CD | GitHub Actions |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                     │
│                                                      │
│  ┌──────────┐    ┌──────────────┐   ┌────────────┐  │
│  │ Frontend │───▶│   Backend    │──▶│ PostgreSQL │  │
│  │  React   │    │  Django DRF  │   │  (db:5432) │  │
│  │  :3000   │    │    :8000     │   │            │  │
│  └──────────┘    └──────────────┘   └────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Estrutura do projeto

```
.
├── Makefile                        # Atalhos de desenvolvimento
├── docker-compose.yml
├── .env.example                    # Template de variáveis de ambiente
├── .gitignore
├── .github/workflows/ci.yml        # Pipeline CI (pytest + ESLint)
│
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh               # Aguarda DB, roda migrations, inicia gunicorn
│   ├── manage.py
│   ├── pytest.ini
│   ├── requirements/
│   │   ├── base.txt                # Dependências de produção
│   │   └── dev.txt                 # base.txt + pytest, factory-boy
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── pagination.py           # StandardPagination (expõe page_size na resposta)
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── users/                  # Modelo User customizado, auth endpoints
│   │   ├── tasks/                  # CRUD, filtros, compartilhamento, toggle
│   │   │   ├── views.py            # TaskViewSet
│   │   │   ├── external_views.py   # Proxy para API de piadas
│   │   │   ├── filters.py
│   │   │   └── serializers.py
│   │   └── categories/             # CRUD de categorias por usuário
│   └── tests/
│       ├── conftest.py             # Fixtures (UserFactory, auth_client)
│       ├── factories.py            # UserFactory, TaskFactory, CategoryFactory
│       ├── test_users.py
│       ├── test_tasks.py
│       └── test_categories.py
│
└── frontend/
    ├── Dockerfile
    ├── src/
    │   ├── services/
    │   │   ├── api.js              # Axios + interceptor JWT com refresh automático
    │   │   ├── tasks.js            # getTasks, createTask, updateTask, deleteTask, toggleTask, shareTask
    │   │   ├── categories.js       # getCategories, createCategory, updateCategory, deleteCategory
    │   │   └── external.js         # getJoke
    │   ├── contexts/
    │   │   └── AuthContext.jsx     # Estado global de autenticação
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Dashboard.jsx
    │   └── components/
    │       ├── layout/
    │       │   └── Navbar.jsx
    │       ├── tasks/
    │       │   ├── TaskCard.jsx
    │       │   ├── TaskForm.jsx
    │       │   └── ShareTaskModal.jsx
    │       └── categories/
    │           └── CategoryManager.jsx
    └── tests/
        └── selenium_tests.py
```

---

## Rodando com Docker Compose

### Pré-requisitos

- Docker Desktop instalado e rodando

### Passos

```bash
# 1. Clone o repositório
git clone <repo-url>
cd <repo>

# 2. Copie e ajuste as variáveis de ambiente (opcional para dev local)
cp .env.example .env

# 3. Suba todos os serviços
docker compose up --build
```

A aplicação estará disponível em:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

```bash
# Rodar em background
docker compose up --build -d

# Parar
docker compose down

# Parar e remover volume do banco
docker compose down -v
```

### Atalhos com Makefile

```bash
make up            # Subir serviços
make up-build      # Subir com rebuild
make down          # Parar serviços
make logs          # Acompanhar logs
make shell-backend # Abrir shell no container do backend
make shell-db      # Abrir psql no container do banco
make migrate       # Rodar migrations
make test-backend  # Rodar pytest
make lint          # Rodar ESLint
make help          # Ver todos os comandos
```

---

## Rodando os testes

### Backend (pytest)

```bash
# Via Docker Compose (recomendado)
docker compose exec backend pytest --tb=short -v

# Ou localmente (requer PostgreSQL rodando)
cd backend
pip install -r requirements/dev.txt
DB_HOST=localhost DB_NAME=todoapp_test DB_USER=postgres DB_PASSWORD=postgres \
  SECRET_KEY=dev-only pytest --tb=short -v

# Com cobertura
pytest --tb=short -v --cov=apps --cov-report=term-missing
```

### Selenium (E2E)

Requer a aplicação rodando (`docker compose up`) e Google Chrome instalado.

```bash
cd frontend/tests
pip install selenium webdriver-manager
python selenium_tests.py
```

### Lint do frontend

```bash
cd frontend
npm ci
npm run lint
```

---

## Endpoints da API

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register/` | Criar conta |
| POST | `/api/auth/login/` | Login — retorna `access` + `refresh` |
| POST | `/api/auth/refresh/` | Renovar access token |
| GET | `/api/auth/me/` | Dados do usuário autenticado |

### Tarefas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/tasks/` | Listar tarefas (próprias + compartilhadas) |
| POST | `/api/tasks/` | Criar tarefa |
| GET | `/api/tasks/{id}/` | Detalhar tarefa |
| PATCH | `/api/tasks/{id}/` | Editar tarefa (somente dono) |
| DELETE | `/api/tasks/{id}/` | Deletar tarefa (somente dono) |
| POST | `/api/tasks/{id}/share/` | Compartilhar com usuário por e-mail |
| POST | `/api/tasks/{id}/toggle/` | Alternar status concluído/não concluído |

#### Parâmetros de filtro e busca

| Parâmetro | Exemplo | Descrição |
|-----------|---------|-----------|
| `completed` | `true` / `false` | Filtrar por status |
| `category` | `3` | Filtrar por ID de categoria |
| `due_date_from` | `2025-01-01` | Tarefas com vencimento a partir de |
| `due_date_to` | `2025-12-31` | Tarefas com vencimento até |
| `search` | `reunião` | Busca por título ou descrição |
| `ordering` | `due_date` / `-created_at` | Ordenação |
| `page` | `2` | Número da página (10 itens por página) |

### Categorias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/categories/` | Listar categorias do usuário |
| POST | `/api/categories/` | Criar categoria |
| PATCH | `/api/categories/{id}/` | Editar categoria |
| DELETE | `/api/categories/{id}/` | Deletar categoria |

### Externa

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/external/joke/` | Busca piada aleatória da API externa |

---

## Decisões de design

### Autenticação JWT
Access tokens de curta duração (60 min) com refresh tokens de 7 dias. O serviço Axios (`services/api.js`) intercepta respostas 401, renova o token automaticamente e enfileira requisições concorrentes para evitar race conditions. Tokens rotacionados são invalidados via blacklist (`rest_framework_simplejwt.token_blacklist`).

### Visibilidade de tarefas
O usuário vê tarefas que criou **ou** que foram compartilhadas com ele. Apenas o dono pode editar, deletar ou compartilhar; usuários com quem foi compartilhado têm acesso somente leitura.

### Modelo User customizado
`AbstractUser` com `email` como `USERNAME_FIELD`. Elimina a necessidade de migração posterior para login por email e mantém a compatibilidade com o sistema de autenticação do Django.

### Paginação com `page_size` na resposta
`StandardPagination` (em `config/pagination.py`) inclui `page_size` na resposta paginada, permitindo que o frontend calcule o número de páginas sem acoplar a um valor hardcoded.

### Camada de serviços no frontend
Chamadas à API estão em `services/` (`tasks.js`, `categories.js`, `external.js`) e não espalhadas nos componentes. Componentes recebem apenas funções de callback, sem conhecer detalhes de HTTP.

### Separação de responsabilidades no backend
`TaskViewSet` cuida apenas do CRUD de tarefas. A view `random_joke` vive em `apps/tasks/external_views.py` e é roteada separadamente via `external_urls.py`.

### Ambiente e segurança
- `SECRET_KEY` sem valor padrão em produção (levanta `RuntimeError` se ausente)
- `CORS_ALLOW_ALL_ORIGINS` ativo somente quando `DEBUG=True`
- `ALLOWED_HOSTS` configurável via variável de ambiente
- Requisitos separados em `requirements/base.txt` (produção) e `requirements/dev.txt` (testes)

### Integração com API externa
`/api/external/joke/` funciona como proxy para `https://official-joke-api.appspot.com/random_joke`, evitando problemas de CORS no navegador e centralizando o tratamento de erro.
