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
```

Run:

```bash
npm start
```

## API Routes

### Health

- `GET /ping`
- `GET /ping/fileverse`

### Session Upload

- `POST /upload`
- `POST /sessions/upload`

Request body:
- `sessionId` (required)
- `agentId` (required)
- `ensId` (required)
- `content` (required)

### Session Read

- `GET /sessions`
- `GET /users`

Returns sessions resolved from Fileverse docs.

- `GET /sessions/:id`
- `GET /users/:id`

Returns one session by `sessionId` (resolved from Fileverse docs).

### Session Document

- `GET /sessions/:id/doc`
- `GET /users/:id/doc`

Returns `ddocId`, metadata, and fetched Fileverse doc payload.

### Delete

- `DELETE /sessions/:id`
- `DELETE /users/:id`

Deletes the mapped Fileverse document.