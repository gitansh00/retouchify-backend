# Retouchify Backend

A lightweight Node.js/Express backend for the **Retouchify** photo editing service. It handles two core functions: a contact form with email notifications and a photo upload endpoint.

---

## Features

- **Contact Form API** — Receives client inquiries and simultaneously sends a notification to the admin and an auto-reply confirmation to the client.
- **Photo Upload API** — Accepts up to 10 photos per request and stores them on the server.
- **CORS enabled** — Ready to work with a separate frontend origin.
- **Environment-based config** — All secrets managed via `.env`.

---

## Tech Stack

| Package       | Purpose                          |
|---------------|----------------------------------|
| Express 5     | HTTP server & routing            |
| Nodemailer    | Email sending via Gmail          |
| Multer        | Multipart file upload handling   |
| CORS          | Cross-origin request support     |
| dotenv        | Environment variable management  |

---

## Project Structure

```
retouchify-backend/
├── server.js          # Main entry point — all routes and middleware
├── package.json
├── .env               # Secret credentials (not committed)
└── uploads/           # Auto-created folder for uploaded photos
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) enabled

### Installation

```bash
git clone https://github.com/your-username/retouchify-backend.git
cd retouchify-backend
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password
PORT=3000
```

> **Note:** Use a Gmail App Password, not your regular account password. Standard password auth is blocked by Google.

### Running the Server

```bash
npm start
```

The server will start at `http://localhost:3000`.

---

## API Reference

### `GET /`

Health check. Confirms the server is running.

**Response:**
```
Retouchify Backend is officially live and running!
```

---

### `POST /send-message`

Handles contact form submissions. Sends two emails:
1. A notification to the admin with the client's details.
2. An auto-reply to the client confirming receipt.

**Request Body (JSON):**

| Field     | Type   | Description                         |
|-----------|--------|-------------------------------------|
| `name`    | string | Client's full name                  |
| `email`   | string | Client's email address              |
| `service` | string | Type of service requested           |
| `budget`  | string | Client's budget                     |
| `message` | string | Project description or inquiry      |

**Example:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "service": "Portrait Retouching",
  "budget": "$50–$100",
  "message": "I need 10 wedding photos edited."
}
```

**Responses:**

| Status | Body                        |
|--------|-----------------------------|
| `200`  | `{ "success": true }`       |
| `500`  | `{ "success": false }`      |

---

### `POST /upload`

Accepts a batch of photos (up to 10 files) and saves them to the `uploads/` directory with unique filenames.

**Request:** `multipart/form-data`

| Field    | Type  | Description                          |
|----------|-------|--------------------------------------|
| `photos` | files | One or more image files (max 10)     |

**Responses:**

| Status | Body                                          |
|--------|-----------------------------------------------|
| `200`  | `{ "success": true, "count": <number> }`     |
| `400`  | `{ "success": false, "message": "No files uploaded." }` |

---

## Notes

- Uploaded files are stored locally in the `uploads/` folder. For production, consider using cloud storage (e.g., AWS S3, Cloudinary) instead.
- The `uploads/` folder is created automatically on first run if it doesn't exist.
- Emails are sent in parallel using `Promise.all` for faster response times.

---

## License

ISC
