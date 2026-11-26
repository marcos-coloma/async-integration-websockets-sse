# Realtime Collaboration

A real-time collaborative application that allows multiple participants to build a shared product list, propose products, vote for their favorites, and view a live ranking.

Developed as part of **TP4 – Asynchronous Programming and Integration with Node.js and TypeScript**.

## Features

- Join a shared session with a unique participant name.
- View connected participants in real time.
- Propose products from the DummyJSON catalog.
- Process multiple product requests concurrently.
- Handle partial failures and request timeouts.
- Vote for products and remove votes.
- Remove products according to ownership rules.
- Display a live ranking ordered by vote count.
- Synchronize participants through WebSocket.
- Update the read-only ranking screen through Server-Sent Events (SSE).

## Technologies

| Area | Technologies |
|---|---|
| Backend | Node.js, TypeScript, Express |
| Frontend | React, TypeScript, Vite |
| Real-time communication | WebSocket, SSE |
| External API | DummyJSON |
| Testing | Vitest, React Testing Library |
| Code quality | ESLint |
| Package manager | pnpm |
| CI | GitHub Actions |

## Architecture

The project is divided into two applications:

- `server/`: manages business logic, shared state, HTTP routes, WebSocket and SSE.
- `client/`: provides the participant interface and the read-only ranking screen.

The backend is the single source of truth. Shared state is stored in memory, without a database.

A single Express server serves the compiled frontend and handles all communication channels.

## Project structure

```text
.
├── .github/workflows/ci.yml
├── client/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── types/
├── docs/
│   ├── architecture.md
│   ├── assignment.txt
│   ├── data-model.md
│   ├── functional-decisions.md
│   └── protocol.md
└── server/
    └── src/
        ├── application/
        ├── config/
        ├── domain/
        ├── infrastructure/
        └── interfaces/
```

## Requirements

- Node.js 22
- pnpm 11.12.0

## Installation

Install backend dependencies:

```bash
cd server
pnpm install
```

Install frontend dependencies:

```bash
cd ../client
pnpm install
```

## Configuration

The backend supports the following environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port. |
| `CATALOG_URL` | `https://dummyjson.com/products` | External catalog URL. |
| `CATALOG_TIMEOUT_MS` | `5000` | Catalog request timeout in milliseconds. |
| `CATALOG_DELAY_MS` | `0` | Additional catalog request delay in milliseconds. |

The frontend also supports optional `VITE_WS_URL` and `VITE_SSE_URL` variables to override the WebSocket and SSE endpoints.

## Running the application

### Development mode

Run the backend:

```bash
cd server
pnpm dev
```

In a separate terminal, run the frontend:

```bash
cd client
pnpm dev
```

By default, Vite runs on port `5173` and Express on port `3000`.

### Integrated mode

Build the frontend:

```bash
cd client
pnpm build
```

Start the backend:

```bash
cd server
pnpm dev
```

Open `http://localhost:3000`.

Express serves the compiled frontend from `client/dist`, while handling HTTP, WebSocket and SSE through the same server and port.

Rebuild the frontend after making changes to its source code.

### Production

Build the frontend and backend:

```bash
cd client
pnpm build

cd ../server
pnpm build
```

Start the server:

```bash
pnpm start
```

Make sure `client/dist` exists before starting the backend.

## Routes

| Route | Description |
|---|---|
| `/` | Participant interface. |
| `/screen` | Live ranking screen. |
| `/health` | Server health check. |
| `/ws` | WebSocket connection. |
| `/events` | Server-Sent Events connection. |

## Testing and quality

Backend:

```bash
cd server
pnpm test
pnpm run build
```

Frontend:

```bash
cd client
pnpm test
pnpm run lint
pnpm run build
```

## Continuous Integration

GitHub Actions runs automatically on pushes and pull requests targeting `main`.

The workflow includes two independent jobs:

- **Backend:** dependency installation, tests and TypeScript build.
- **Frontend:** dependency installation, ESLint, tests and production build.

## Evidence of use

Application evidence will include:

- A demonstration with multiple connected participants and the live ranking screen.
- Product proposals with successful and failed catalog requests.
- Voting and product removal.
- Real-time synchronization through WebSocket and SSE.

## Documentation

- [Architecture](docs/architecture.md)
- [Communication protocol](docs/protocol.md)
- [Functional decisions](docs/functional-decisions.md)
- [Data model](docs/data-model.md)
- [Original assignment](docs/assignment.txt)

## Limitations

- Shared state is stored in memory and is lost when the server stops.
- Only one shared session is supported per server instance.
- Participant identity recovery after reconnection is not implemented.
- No database or persistent storage is used.

## License

Developed for academic purposes as part of a university assignment.