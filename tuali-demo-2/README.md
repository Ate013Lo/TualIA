# Tuali Growth Agent — Demo Hackathon 2025

Orquestador de IA para tenderos. Stack: React + Vite · Node.js/Express · Claude API.

---

## Estructura del proyecto

```
tuali-demo/
├── backend/
│   ├── server.js       ← API REST + cron proactivo (puerto 3001)
│   ├── agent.js        ← Orquestador Claude API con tool use
│   ├── tools.js        ← Definición de las 5 tools del agente
│   ├── mockData.js     ← Estado en memoria (inventario, meta, promos)
│   ├── .env.example    ← Copia a .env y agrega tu API key
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/      ← Dashboard, Inventory, CheckIn, Goals, Onboarding
│   │   ├── components/ ← Sidebar, ProactiveCard
│   │   ├── store/      ← Zustand global store
│   │   └── lib/api.js  ← Cliente HTTP
│   ├── vite.config.js  ← Proxy /api → localhost:3001
│   └── package.json
├── package.json        ← Scripts raíz con concurrently
└── README.md
```

---

## Setup en 4 pasos

### 1. Instalar dependencias

```bash
# Desde la raíz del proyecto
npm run install:all
```

Esto instala en raíz, backend y frontend de un solo comando.

### 2. Configurar API key

```bash
cd backend
cp .env.example .env
```

Abre `backend/.env` y reemplaza con tu API key:
```
ANTHROPIC_API_KEY=sk-ant-tu-key-aqui
PORT=3001
```

Obten tu API key en: https://console.anthropic.com

### 3. Correr el proyecto

```bash
# Desde la raíz — levanta backend y frontend en paralelo
npm run dev
```

O por separado:
```bash
# Terminal 1 — Backend (puerto 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (puerto 3000)
cd frontend && npm run dev
```

### 4. Abrir en el browser

```
http://localhost:3000
```

---

## Guión del demo (3.5 min)

| Tiempo | Paso | Qué mostrar |
|--------|------|-------------|
| 0:00 | **Onboarding** | Ir a "Nueva Meta" → elegir "Reducir merma" → el agente valida |
| 0:30 | **Inventario** | Ir a "Inventario" → registrar "Coca-Cola 500ml", 30 unidades, $12 |
| 1:00 | **Check-in** | Ir a "Check-in" → responder NO → escribir 12 vendidas |
| 1:45 | **⭐ MOMENTO WOW** | Ir a "Inicio" → aparece tarjeta proactiva → clic "Activar promo" |
| 2:45 | **Chatbot** | Ir a "Mis Metas" → preguntar "¿Cómo voy con mi meta?" |
| 3:15 | **Dashboard** | Mostrar progreso al 85% → acciones completadas |

---

## Cómo funciona el agente

El orquestador usa **Claude API con tool use** en dos modos:

### Modo Proactivo
- Cron cada 30 segundos en demo (24h en producción)
- Analiza inventario → detecta triggers (merma, stockout, caída de rotación)
- Genera tarjetas accionables sin que el tendero pregunte nada

### Modo Reactivo (chatbot)
- Endpoint `POST /api/chat`
- Sistema prompt limitado: solo responde sobre la meta activa
- Usa tools `get_goal` e `get_inventory` para tener datos reales

### Tools disponibles
| Tool | Qué hace |
|------|----------|
| `get_inventory` | Stock actual con sell-through y alertas |
| `get_goal` | Progreso de meta, hitos, brecha y acciones |
| `get_promos` | Promos Tuali relevantes para el inventario |
| `update_stock` | Registra ventas del check-in semanal |
| `validate_goal` | Evalúa si una meta propuesta es realista |

---

## Endpoints del backend

```
GET  /api/inventory              → lista inventario
POST /api/inventory              → agrega producto (con aviso si ya tiene stock)
POST /api/inventory/:id/checkin  → check-in semanal (body: { unitsSold })

GET  /api/goal                   → meta activa y progreso
POST /api/goal/validate          → valida meta con Claude (body: { proposal })
POST /api/goal/set               → establece meta activa
PATCH /api/goal/action/:id       → marca acción como hecha

POST /api/chat                   → chatbot de metas (body: { message, history })

GET  /api/cards                  → tarjetas proactivas activas
POST /api/cards/:id/dismiss      → descarta tarjeta
POST /api/cards/:id/activate-promo → activa promo y actualiza inventario/meta

GET  /api/promos                 → promos disponibles
GET  /api/health                 → health check
```

---

## Notas para el demo

- **Los datos son mock en memoria** — se reinician al reiniciar el backend
- El cron corre cada 30 segundos (no 24h) para mostrar tarjetas proactivas en tiempo real
- Si quieres simular el flujo desde cero, reinicia el backend: `Ctrl+C` y `npm run dev`
- El chatbot requiere API key válida; el resto de la UI funciona sin ella
