# Arquitectura del sistema

## Enfoque

El backend separa las interfaces de comunicación, los casos de uso, el dominio y la infraestructura. Las interfaces dependen de los servicios de aplicación; estos usan contratos de repositorio y catálogo, y la infraestructura provee sus implementaciones en memoria y para DummyJSON.

El frontend es un proyecto separado de React y TypeScript. Actualmente es un esqueleto: las vistas, hooks y servicios de comunicación existen como archivos, pero todavía están vacíos; `App.tsx` solo presenta un encabezado.

## Backend

### Interfaces

- `interfaces/http/HealthRoutes.ts`: expone `GET /health`.
- `interfaces/websocket/`: abre `/ws`, administra conexiones, valida mensajes y distribuye estado.
- `interfaces/sse/`: expone `GET /events`, envía el estado inicial y distribuye eventos completos a la pantalla.

El servidor HTTP de Node comparte el puerto con WebSocket y Express/SSE. **Todavía no sirve los archivos del frontend**; integrar el frontend en ese mismo servidor queda pendiente.

### Aplicación

- `ParticipantService`: ingreso, validación/cambio de nombre y desconexión.
- `ProductService`: propuestas concurrentes, gestión de duplicados y eliminación.
- `VoteService`: registrar y retirar votos.
- `ports/CatalogProvider.ts`: contrato para consultar productos.
- `errors/`: errores de catálogo y participantes que usan los casos de uso.

Los servicios de aplicación no dependen de Express ni de WebSocket.

### Dominio

Contiene `Participant`, `Product`, `Vote`, sus contratos de repositorio y `AppState`, el estado compartido.

### Infraestructura y configuración

- `infrastructure/catalog/DummyJsonCatalogProvider.ts`: consulta DummyJSON, aplica timeout y demora configurada, y normaliza errores del servicio externo.
- `infrastructure/repositories/Memory*Repository.ts`: guarda participantes, productos y votos en el estado en memoria.
- `config/env.ts`: lee puerto, URL del catálogo, timeout y demora simulada.

No hay base de datos: al detener el proceso se pierde el estado.

## Estructura real del backend

```text
server/src/
├── application/
│   ├── errors/
│   ├── ports/
│   └── services/
├── config/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── state/
├── infrastructure/
│   ├── catalog/
│   └── repositories/
├── interfaces/
│   ├── http/
│   ├── sse/
│   └── websocket/
└── index.ts
```

`index.ts` crea el estado y los repositorios, conecta las dependencias de aplicación e interfaces y arranca el servidor.

## Frontend actual

```text
client/src/
├── components/
│   ├── participants.tsx
│   ├── products.tsx
│   └── ranking.tsx
├── hooks/
│   ├── useScreenEvents.ts
│   └── useWebSockets.ts
├── pages/
│   ├── ParticipantPage.tsx
│   └── ScreenPage.tsx
├── services/
│   ├── sse.ts
│   └── websocket.ts
├── App.tsx
└── main.tsx
```

Los archivos de `components`, `hooks`, `pages` y `services` todavía no implementan las pantallas ni el cliente de los protocolos.

## Flujo del backend

1. Express atiende rutas HTTP; el mismo servidor HTTP admite WebSocket y SSE.
2. El participante abre WebSocket y envía `join`.
3. La interfaz valida el mensaje y delega el caso de uso al servicio correspondiente.
4. Los servicios aplican las reglas usando repositorios y, para propuestas, el puerto de catálogo.
5. Cuando cambia el estado, WebSocket recibe actualizaciones completas y la pantalla recibe el evento SSE `state_update`.
6. Una conexión nueva recibe `initial_state`; una desconexión actualiza la colección de participantes conectados.

El contrato detallado está en [protocol.md](protocol.md), las reglas en [functional-decisions.md](functional-decisions.md) y las estructuras en [data-model.md](data-model.md).
