# Arquitectura del sistema

## 1. Enfoque arquitectónico

El proyecto utiliza una arquitectura por capas, organizada en módulos funcionales y tomando algunos principios de la arquitectura hexagonal.

El objetivo es separar las responsabilidades para evitar que la comunicación, las reglas de negocio y el acceso a servicios externos queden mezclados.

Se divide en dos aplicaciones:

- **Backend:** administra el estado compartido, aplica las reglas del sistema y gestiona las comunicaciones.
- **Frontend:** presenta la información y permite la interacción de los participantes y la visualización de la pantalla.

## 2. Arquitectura del backend

El backend se organiza en cuatro capas.

### 2.1. Interfaces de comunicación

Es el punto de entrada y salida del sistema. Recibe solicitudes de los clientes y transmite las respuestas y actualizaciones.

Responsabilidades:

- Servir la aplicación web mediante HTTP.
- Gestionar las conexiones WebSocket de los participantes.
- Gestionar las conexiones SSE de la pantalla.
- Validar la estructura de los mensajes recibidos.
- Enviar respuestas y actualizaciones a los clientes.

Tecnologías principales: Express, WebSocket (`ws`) y SSE.

### 2.2. Aplicación

Contiene los servicios que coordinan las operaciones del sistema.

Responsabilidades:

- Gestionar el ingreso y desconexión de participantes.
- Coordinar las propuestas de productos.
- Gestionar los votos y la eliminación de productos.
- Coordinar las consultas al catálogo externo.
- Solicitar la actualización y distribución del estado.

Esta capa organiza los casos de uso sin depender directamente de los mecanismos de comunicación.

### 2.3. Dominio

Contiene los conceptos y las reglas principales del sistema.

Responsabilidades:

- Definir las entidades y sus relaciones.
- Mantener las reglas de participación.
- Controlar las condiciones para votar y eliminar productos.
- Mantener la consistencia de los datos.

No debe depender de Express, WebSocket ni de servicios externos.

### 2.4. Infraestructura

Contiene los mecanismos necesarios para acceder a recursos externos y administrar la persistencia temporal.

Responsabilidades:

- Consultar el catálogo DummyJSON.
- Configurar los tiempos de espera de las consultas.
- Administrar el estado en memoria.
- Proporcionar mecanismos de acceso y modificación de los datos.

No se utiliza una base de datos. El estado se mantiene en memoria durante la ejecución del servidor.

## 3. Estructura del backend

```text
server/
└── src/
    ├── domain/
    │   ├── entities/
    │   └── state/
    │
    ├── application/
    │   └── services/
    │
    ├── infrastructure/
    │   ├── catalog/
    │   └── repositories/
    │
    ├── interfaces/
    │   ├── http/
    │   ├── websocket/
    │   └── sse/
    │
    ├── config/
    │
    └── index.ts
```

| Directorio | Responsabilidad |
|---|---|
| `domain/entities` | Entidades del modelo de datos. |
| `domain/state` | Estado y reglas centrales del dominio. |
| `application/services` | Coordinación de los casos de uso. |
| `infrastructure/catalog` | Integración con DummyJSON. |
| `infrastructure/repositories` | Administración del estado en memoria. |
| `interfaces/http` | Rutas y endpoints HTTP. |
| `interfaces/websocket` | Conexiones y mensajes WebSocket. |
| `interfaces/sse` | Conexiones y eventos SSE. |
| `config` | Configuración y variables de entorno. |
| `index.ts` | Inicialización y puesta en marcha del servidor. |

## 4. Arquitectura del frontend

El frontend utiliza React con TypeScript y se organiza mediante componentes, páginas, servicios de comunicación y hooks.

La aplicación tiene dos vistas:

- **Participante (`/`):** permite ingresar, proponer productos, votar y consultar el estado compartido.
- **Pantalla (`/screen`):** muestra el ranking, los votos y los participantes conectados.

### Responsabilidades

- **Pages:** representan las vistas principales de la aplicación.
- **Components:** contienen los elementos visuales reutilizables.
- **Services:** encapsulan la comunicación con el servidor.
- **Hooks:** administran las conexiones y el estado necesario para las vistas.
- **Types:** definen los tipos utilizados para representar datos y mensajes.

## 5. Estructura del frontend

```text
client/
└── src/
    ├── pages/
    │   ├── ParticipantPage.tsx
    │   └── ScreenPage.tsx
    │
    ├── components/
    │   ├── products/
    │   ├── participants/
    │   └── ranking/
    │
    ├── services/
    │   ├── websocket.ts
    │   └── sse.ts
    │
    ├── hooks/
    │   ├── useWebSocket.ts
    │   └── useScreenEvents.ts
    │
    ├── types/
    │
    ├── App.tsx
    └── main.tsx
```

## 6. Flujo general de funcionamiento

1. El navegador solicita la aplicación al servidor mediante HTTP.
2. El participante establece una conexión WebSocket e ingresa su nombre.
3. El servidor registra al participante y le envía el estado inicial.
4. Cuando un participante realiza una acción, el servidor recibe y valida el mensaje.
5. La capa de aplicación coordina la operación y utiliza el dominio y la infraestructura cuando corresponde.
6. Si la operación modifica el estado, el servidor distribuye la actualización a los participantes mediante WebSocket y a la pantalla mediante SSE.
7. Los clientes actualizan sus interfaces con la información recibida.

## 7. Criterios de diseño

- Separación de responsabilidades entre las capas.
- El servidor es la única fuente de verdad del estado compartido.
- Las reglas de negocio no dependen de los protocolos de comunicación.
- La integración con DummyJSON se mantiene separada de la lógica principal.
- Los mensajes intercambiados utilizan contratos tipados.
- El frontend separa la presentación de la comunicación con el servidor.
- La arquitectura debe mantenerse simple y acorde al alcance del proyecto.