# TP4 — Lista compartida en tiempo real (mañana hago el frontend)

Aplicación de Node.js y TypeScript para una lista compartida de productos. Los participantes interactúan mediante WebSocket; una pantalla recibe actualizaciones mediante Server-Sent Events (SSE). El catálogo se consulta en DummyJSON y el estado de la sesión se guarda en memoria.

## Estado actual

El backend tiene las rutas `/health` y `/events`, y el endpoint WebSocket `/ws`. La interfaz React todavía es un esqueleto y no está servida por el backend. Por ahora, en desarrollo se ejecutan el servidor y Vite por separado.

## Requisitos

- Node.js LTS
- pnpm

## Instalación y ejecución

Instalá las dependencias en cada proyecto:

```bash
cd server
pnpm install
```

En otra terminal, desde la raíz:

```bash
cd client
pnpm install
```

Iniciá el backend en modo desarrollo:

```bash
cd server
pnpm run dev
```

Iniciá el frontend en otra terminal:

```bash
cd client
pnpm run dev
```

El backend escucha por defecto en `http://localhost:3000`; Vite informa la dirección local del frontend al iniciarse.

Para compilar e iniciar el backend:

```bash
cd server
pnpm run build
pnpm start
```

## Configuración del backend

Las variables son opcionales y pueden definirse en `server/.env`:

| Variable | Valor predeterminado | Uso |
|---|---:|---|
| `PORT` | `3000` | Puerto HTTP, WebSocket y SSE. |
| `CATALOG_URL` | `https://dummyjson.com/products` | URL base del catálogo. |
| `CATALOG_TIMEOUT_MS` | `5000` | Tiempo máximo por consulta al catálogo. |
| `CATALOG_DELAY_MS` | `0` | Demora solicitada a DummyJSON para simular latencia. |

## Protocolo y decisiones

- [Protocolo de comunicación](docs/protocol.md): mensajes WebSocket y eventos SSE, campos, respuestas y errores.
- [Decisiones funcionales](docs/functional-decisions.md): nombres, votos, desconexiones, propuestas y permisos.
- [Modelo de datos](docs/data-model.md): entidades y estado en memoria.
- [Arquitectura](docs/architecture.md): capas y estado de implementación.
- [Consigna](docs/assignment.txt): requisitos originales del trabajo práctico.

El estado se pierde cuando se detiene el servidor. La recuperación de identidad al reconectar y la integración del frontend en el servidor único siguen pendientes.


