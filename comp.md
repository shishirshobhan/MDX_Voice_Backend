# API Endpoints Comparison

## ❌ BEFORE (Flask Standalone - Port 5000)

### Base URL
```
http://localhost:5000/api
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/chat/start` | Start chat session |
| POST | `/api/chat/message` | Send message |
| GET | `/api/chat/summary/<session_id>` | Get conversation summary |
| DELETE | `/api/chat/end/<session_id>` | End chat session |
| GET | `/api/resources` | Get Nepal resources |

### Example Requests (OLD)

```bash
# Health check
curl http://localhost:5000/api/health

# Start chat
curl -X POST http://localhost:5000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test123"}'

# Send message
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test123",
    "message": "नमस्ते"
  }'

# Get summary
curl http://localhost:5000/api/chat/summary/test123

# End chat
curl -X DELETE http://localhost:5000/api/chat/end/test123

# Get resources
curl http://localhost:5000/api/resources
```

### Response Format (OLD)

```json
{
  "success": true,
  "session_id": "test123",
  "bot_response": "नमस्ते। म SaharaBot हुँ।",
  "needs_assessment": {
    "categories": [],
    "urgency": "normal",
    "children_mentioned": false,
    "has_violence": false
  },
  "suggest_help_centers": false,
  "help_categories": [],
  "conversation_length": 1,
  "timestamp": "2026-01-04T00:13:52.135752"
}
```

---

## ✅ NOW (NestJS Integrated - Port 4000)

### Base URL
```
http://localhost:4000/chatbot
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chatbot/health` | Health check |
| POST | `/chatbot/start` | Start chat session |
| POST | `/chatbot/message` | Send message |
| GET | `/chatbot/resources` | Get Nepal resources |

### Example Requests (NEW)

```bash
# Health check
curl http://localhost:4000/chatbot/health

# Start chat
curl -X POST http://localhost:4000/chatbot/start \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test123"}'

# Send message
curl -X POST http://localhost:4000/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test123",
    "message": "नमस्ते"
  }'

# Get resources
curl http://localhost:4000/chatbot/resources
```

### Response Format (NEW)

```json
{
  "success": true,
  "bot_response": "नमस्ते। म SaharaBot हुँ।\n\n---\n\nHello. I'm SaharaBot.",
  "urgency": "normal",
  "categories": [],
  "suggest_help_centers": false,
  "conversation_length": 1
}
```

---

## 📊 Key Differences

### URL Changes

| Feature | Before (Flask) | Now (NestJS) |
|---------|----------------|--------------|
| **Port** | 5000 | 4000 |
| **Base Path** | `/api` | `/chatbot` |
| **Services Running** | Flask + NestJS (2 servers) | NestJS only (1 server) |
| **ngrok Tunnels** | 2 needed | 1 needed |

### Endpoint Changes

| Feature | Before | Now | Change |
|---------|--------|-----|--------|
| Health | `/api/health` | `/chatbot/health` | ✅ Simplified |
| Start Chat | `/api/chat/start` | `/chatbot/start` | ✅ Shorter path |
| Send Message | `/api/chat/message` | `/chatbot/message` | ✅ Shorter path |
| Summary | `/api/chat/summary/<id>` | ❌ Removed | Session stored in Python |
| End Chat | `/api/chat/end/<id>` | ❌ Removed | Auto-managed |
| Resources | `/api/resources` | `/chatbot/resources` | ✅ Shorter path |

### Response Changes

| Field | Before | Now | Note |
|-------|--------|-----|------|
| `needs_assessment` | ✅ Full object | ❌ Removed | Simplified |
| `urgency` | Inside `needs_assessment` | ✅ Top level | Easier access |
| `categories` | Inside `needs_assessment` | ✅ Top level | Easier access |
| `timestamp` | ✅ Included | ❌ Not needed | Less clutter |
| `session_id` | ✅ In response | ✅ In response | Same |

---

## 🔄 Migration Guide

### Frontend Code Changes

**BEFORE:**
```javascript
// Two different base URLs
const FLASK_URL = 'http://localhost:5000/api';
const NESTJS_URL = 'http://localhost:4000';

// Call Flask for chatbot
await fetch(`${FLASK_URL}/chat/message`, {
  method: 'POST',
  body: JSON.stringify({ session_id, message })
});

// Call NestJS for other features
await fetch(`${NESTJS_URL}/help-centers`, {
  method: 'POST',
  body: JSON.stringify({ categories })
});
```

**NOW:**
```javascript
// Single base URL
const API_URL = 'http://localhost:4000';

// Everything through NestJS
await fetch(`${API_URL}/chatbot/message`, {
  method: 'POST',
  body: JSON.stringify({ session_id, message })
});

await fetch(`${API_URL}/help-centers`, {
  method: 'POST',
  body: JSON.stringify({ categories })
});
```

### With ngrok

**BEFORE:**
```bash
# Need 2 terminals, 2 tunnels
ngrok http 5000  # Flask
ngrok http 4000  # NestJS

# Frontend needs both URLs
FLASK_URL=https://abc123.ngrok.io
NESTJS_URL=https://xyz789.ngrok.io
```

**NOW:**
```bash
# Single tunnel
ngrok http 4000

# Frontend needs one URL
API_URL=https://xyz789.ngrok.io
```

---

## 📝 Complete API Reference (NEW)

### 1. Health Check
```http
GET /chatbot/health
```

**Response:**
```json
{
  "status": "healthy",
  "python": "available",
  "ollama": "available"
}
```

---

### 2. Start Chat Session
```http
POST /chatbot/start
Content-Type: application/json

{
  "session_id": "optional-custom-id"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "session_1704326400000"
}
```

---

### 3. Send Message (Main Endpoint)
```http
POST /chatbot/message
Content-Type: application/json

{
  "session_id": "session_123",
  "message": "मलाई मद्दत चाहिन्छ"
}
```

**Response:**
```json
{
  "success": true,
  "bot_response": "म सुनिरहेको छु। तपाईं थप बताउन सक्नुहुन्छ?\n\n---\n\nI'm listening. Can you tell me more?",
  "urgency": "normal",
  "categories": [],
  "suggest_help_centers": false,
  "conversation_length": 1
}
```

**With Violence Detected:**
```json
{
  "success": true,
  "bot_response": "म तपाईंको सुरक्षाको बारेमा चिन्तित छु...",
  "urgency": "high",
  "categories": ["violence"],
  "suggest_help_centers": true,
  "conversation_length": 3
}
```

**Critical (Child Abuse):**
```json
{
  "success": true,
  "bot_response": "🚨 यो अत्यन्तै गम्भीर छ...",
  "urgency": "critical",
  "categories": ["child_abuse"],
  "suggest_help_centers": true,
  "conversation_length": 1
}
```

---

### 4. Get Resources
```http
GET /chatbot/resources
```

**Response:**
```json
{
  "success": true,
  "emergency_numbers": {
    "Police": "100",
    "Child Helpline": "1098",
    "Women Commission": "1145"
  }
}
```

---

## 🎯 Summary

### What Changed?
1. ✅ **Single server** (NestJS only, no Flask)
2. ✅ **Shorter URLs** (`/chatbot/*` instead of `/api/chat/*`)
3. ✅ **Simpler responses** (removed unnecessary fields)
4. ✅ **One port** (4000 instead of 5000 + 4000)
5. ✅ **One ngrok tunnel** (much easier!)

### What Stayed the Same?
1. ✅ Request body format (same fields)
2. ✅ Response structure (just simplified)
3. ✅ Chatbot functionality (same AI, same features)
4. ✅ Nepali language support (bilingual responses)

### What Was Removed?
1. ❌ `/chat/summary/<id>` - Not needed for MVP
2. ❌ `/chat/end/<id>` - Sessions auto-managed
3. ❌ Complex `needs_assessment` object - Simplified to top-level fields

---

## 🚀 Quick Start for Frontend Developers

```javascript
// All you need:
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Start chat
const { session_id } = await fetch(`${API_URL}/chatbot/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ session_id: `user_${userId}` })
}).then(r => r.json());

// Chat
const { bot_response, urgency, suggest_help_centers } = 
  await fetch(`${API_URL}/chatbot/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, message: userInput })
  }).then(r => r.json());

// Show help centers if needed
if (suggest_help_centers) {
  const { emergency_numbers } = await fetch(`${API_URL}/chatbot/resources`)
    .then(r => r.json());
  // Display resources to user
}
```

---

## 📞 Support

Need help? Check:
- Health endpoint: `GET /chatbot/health`
- Make sure Ollama is running: `ollama list`
- Check NestJS logs for errors
