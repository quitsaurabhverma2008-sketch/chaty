# Chat Application

A real-time chat application with room-based messaging using Node.js, Express, Socket.io, and React.

## Features

- **Room Creation**: Generate unique 4-digit room IDs
- **Room Joining**: Join existing rooms with room ID
- **Real-time Messaging**: Instant message delivery via WebSocket
- **User Identity**: Customizable display names
- **Automatic Cleanup**: Rooms removed when last participant leaves

## Project Structure

```
chat-app/
├── server/           # Backend (Node.js + Express + Socket.io)
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── client/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx
│   │   │   └── ChatRoom.jsx
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   └── styles.css
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start

### Local Development

1. **Install dependencies**:

   ```bash
   # Server
   cd server && npm install

   # Client
   cd client && npm install
   ```

2. **Start the server** (port 5000):

   ```bash
   cd server && npm start
   ```

3. **Start the client** (port 3000):

   ```bash
   cd client && npm run dev
   ```

4. Open http://localhost:3000 in your browser.

### Docker Deployment

1. **Build and run with Docker Compose**:

   ```bash
   docker-compose up --build
   ```

2. Access the app at http://localhost:3000

## Room ID Generation

The server generates a unique 4-digit numeric room ID (1000-9999) using these rules:

- Random selection from 9000 possible IDs (excludes 0000-0999)
- Validates against existing room IDs before returning
- Retry loop handles collisions (rare with low usage)

**Why collisions are impossible**: In the in-memory approach, the server checks whether a generated ID already exists in the `rooms` Map. If it does, it generates another. Since there are 9000 possible IDs and rooms are deleted when empty, the theoretical maximum is 9000 concurrent rooms, which is sufficient for local development.

## Environment Variables

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| PORT     | 5000    | Server port  |

### Client

| Variable      | Default           | Description |
|---------------|------------------|-------------|
| VITE_API_URL  | http://localhost:5000 | API server URL |

## Deployment to Cloud Platforms

### Render.com

1. Create a Render account
2. Connect your GitHub repository
3. Add two services:
   - **Web Service** for server (`npm start`)
   - **Static Site** for client (build output)
4. Set environment variables as needed

### Railway

1. Create a Railway project
2. Add two services ( Nix or Docker):
   - Server: `npm start`
   - Client: Upload build artifacts OR use nginx image
3. Configure environment variables

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Server requires a separate service (e.g., Render, Railway)
3. Deploy client: `vercel --prod`
4. Or deploy server as a serverless function with Socket.io support

## Potential Extensions

- **Message Persistence**: Store messages in Redis or PostgreSQL
- **Room Passwords**: Add password protection for rooms
- **Avatars**: Allow users to upload profile images
- **Typing Indicators**: Show when users are typing
- **Read Receipts**: Mark messages as read
- **File Sharing**: Allow file/image uploads
- **Private Messaging**: 1:1 chat between users
- **Message Reactions**: Emoji reactions on messages

## License

MIT