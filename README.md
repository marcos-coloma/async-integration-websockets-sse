# Realtime Collaboration

A real-time shared product list for group decisions. Participants join a session, propose products from DummyJSON, vote on products, and see the shared list update. A separate read-only screen displays the live ranking and connected participant count.

The application uses WebSocket for participant actions and updates, and Server-Sent Events (SSE) for the ranking screen. The server is the source of truth. Shared state is held in memory and is lost when the server stops; there is no database.

## Features

- Join with a unique participant name and see who is connected.
- Propose up to 10 catalog product IDs in one action. Valid products are added even if other IDs in the proposal fail.
- Vote for and remove votes from products; the screen ranks products by vote count.
- Remove products according to the proposer connection rule.
- Keep the participant interface and read-only ranking screen synchronized in real time.
- Expose a health endpoint.

See [the protocol](docs/protocol.md) for message and event details, [functional decisions](docs/functional-decisions.md) for behavior rules, and [the data model](docs/data-model.md) for entities and in-memory state.

## Technologies

| Area | Technologies |
| --- | --- |
| Backend | Node.js, TypeScript, Express 5, `ws` |
| Frontend | React 19, TypeScript, Vite |
| Real-time transport | WebSocket and Server-Sent Events |
| External catalog | DummyJSON |
| Package manager | pnpm |
| State | In-memory repositories; no database |

## Architecture

The backend composes HTTP, WebSocket, and SSE interfaces around the same Express application and Node HTTP server. Application services implement participant, product, and vote use cases through repository and catalog-provider contracts. The frontend is a separate Vite project; its production build is served as static files by Express.

Participants use WebSocket to submit actions and receive shared state. The `/screen` page uses SSE to receive the initial state and later updates without sending actions. See [Architecture](docs/architecture.md) for layers, flows, and development modes.

## Relevant directory structure

```text
.
├── .github/workflows/ci.yml
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── test/
│   │   └── types/
│   ├── package.json
│   └── pnpm-lock.yaml
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── functional-decisions.md
│   └── protocol.md
└── server/
    ├── src/
    │   ├── application/
    │   ├── config/
    │   ├── domain/
    │   ├── infrastructure/
    │   ├── interfaces/
    │   └── index.ts
    ├── package.json
    └── pnpm-lock.yaml
```

## Prerequisites

- Node.js 22 (the version used by CI).
- pnpm 11.12.0.

Each project has its own `package.json` and lockfile. Install dependencies in both directories:

```bash
cd server
pnpm install

cd ../client
pnpm install
```

## Configuration

The backend loads environment variables through `dotenv/config`. The following variables are read by the application:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port for HTTP, WebSocket, and SSE. Must be a positive integer. |
| `CATALOG_URL` | `https://dummyjson.com/products` | Base URL used to fetch catalog products. Must be a valid URL. |
| `CATALOG_TIMEOUT_MS` | `5000` | Timeout for each catalog request, in milliseconds. Must be a positive integer. |
| `CATALOG_DELAY_MS` | `0` | Optional delay, in milliseconds, added to DummyJSON requests for latency simulation. Must be a non-negative integer. |

The frontend also supports these Vite variables:

| Variable | Default behavior | Purpose |
| --- | --- | --- |
| `VITE_WS_URL` | In development, uses `ws://<current-host>:3000/ws` (or `wss` on HTTPS); in a production build, uses the current host and protocol. | Override the participant WebSocket URL. |
| `VITE_SSE_URL` | In development, uses `http://<current-host>:3000/events`; in a production build, uses the current page origin. | Override the ranking screen SSE URL. |

Vite variables are embedded when the frontend is built. Set overrides before running `pnpm build`. If the backend development port differs from `3000`, configure the frontend URLs to point to that backend port.

## Run in development

### Separate Vite and Express servers

Install dependencies in both projects, then start the backend and frontend in separate terminals.

Terminal 1:

```bash
cd server
pnpm dev
```

Terminal 2:

```bash
cd client
pnpm dev
```

Vite serves the frontend during development. The backend listens on port `3000` by default, and the frontend connects to it directly for WebSocket and SSE. If `PORT` is changed, set `VITE_WS_URL` and `VITE_SSE_URL` accordingly.

### Integrated app on one server

Build the frontend first, then run the backend. Express serves the generated `client/dist` files; it does not build the frontend automatically.

```bash
cd client
pnpm build

cd ../server
pnpm dev
```

Open the backend URL printed in the terminal, by default `http://localhost:3000`. Rebuild the frontend after frontend changes for the integrated server to serve the updated files.

## Build and run for production

Install dependencies in both projects, build the frontend, then compile and start the backend:

```bash
cd client
pnpm build

cd ../server
pnpm build
pnpm start
```

The frontend build runs TypeScript project checks and Vite, generating static assets in `client/dist`. The backend build compiles TypeScript into `server/dist`; it does not build the frontend. The production server serves `client/dist` from the same host and port used for its HTTP, WebSocket, and SSE interfaces. Ensure `client/dist` exists before starting the backend.

## Routes and endpoints

| Path | Purpose |
| --- | --- |
| `/` | Participant interface. |
| `/screen` | Read-only live ranking screen. |
| `/health` | HTTP health check; returns `{ "status": "ok" }`. |
| `/events` | SSE connection for the ranking screen. |
| `/ws` | WebSocket connection for participants. |

In production, the browser uses the same host and port for the frontend, WebSocket, and SSE. The browser-side URL overrides are available for other deployments.

## Tests, lint, and builds

Backend tests:

```bash
cd server
pnpm test
```

Frontend lint, tests, and build:

```bash
cd client
pnpm lint
pnpm test
pnpm build
```

The frontend also provides `pnpm test:watch` for running Vitest in watch mode. The backend package does not define a lint script.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes and pull requests targeting `main`. It defines independent backend and frontend jobs, each using its own working directory, lockfile, and dependency installation. Both jobs use Node.js 22 and pnpm 11.12.0. The backend job runs tests and compiles TypeScript; the frontend job runs ESLint, Vitest, and the TypeScript/Vite build.

## Additional documentation

- [Architecture](docs/architecture.md)
- [Communication protocol](docs/protocol.md)
- [Functional decisions](docs/functional-decisions.md)
- [Data model](docs/data-model.md)
- [Original assignment](docs/assignment.txt)
