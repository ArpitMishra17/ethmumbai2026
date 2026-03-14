# AgentCover Fileverse Backend

Cloud-only Express backend for session evidence.

- No local JSON/TXT data persistence.
- No local hash storage.
- All session records are uploaded to and retrieved from Fileverse/Cloudflare API.
- API responses are JSON-first for Postman.

## Setup

Create `.env`:

```env
API_KEY=your_fileverse_api_key
SERVER_URL=https://your-fileverse-server-url
PORT=8000
CLOUD_ONLY=true
BASE_URL=http://localhost:8000
```

Run:

```bash
npm start
```

## Postman Environment

Set this variable in Postman:

- `baseUrl = http://localhost:8000`

## API Routes (Postman)

### Save Session

- `POST {{baseUrl}}/sessions/upload`
- `POST {{baseUrl}}/upload`

Body (JSON):
- `sessionId`
- `agentId`
- `ensId`
- `content`

### Fetch All Sessions

- `GET {{baseUrl}}/sessions`

Returns all sessions (cloud derived).

### Fetch One Session

- `GET {{baseUrl}}/sessions/:id`

Returns single session summary by `sessionId`.

### Fetch One Session Full Doc

- `GET {{baseUrl}}/sessions/:id/doc`

Returns full document JSON for one session.

### Fetch All Users (Aggregated by ENS)

- `GET {{baseUrl}}/accounts`
- `GET {{baseUrl}}/users`

Returns account-level aggregation by `ensId`.

### Fetch Docs for One User Account

- `GET {{baseUrl}}/accounts/:ensId/docs`
- `GET {{baseUrl}}/users/:ensId/docs`

Returns all docs for a user (`ensId`) with full `doc` payload.

### Delete Session

- `DELETE {{baseUrl}}/sessions/:id`

Deletes mapped doc from cloud.

## Health

- `GET {{baseUrl}}/ping`
- `GET {{baseUrl}}/ping/fileverse`