require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { google } = require("googleapis");
const fs = require("fs");

const { GoogleGenAI } = require("@google/genai");

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const app = express();

const PORT = 5000;
const FRONTEND_URL = "http://localhost:5173";
const REDIRECT_URI = "http://localhost:5000/auth/google/callback";

// Allow our React frontend to talk to this backend
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: "ai-mail-assistant-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Read Google's OAuth credentials
const credentials = JSON.parse(
  fs.readFileSync("./client_secret.json")
);

const { client_id, client_secret } =
  credentials.web;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  REDIRECT_URI
);

// Gmail permissions
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

// Home page
app.get("/", (req, res) => {
  res.send("AI Mail Assistant Backend is running!");
});

// Start Google login
app.get("/auth/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  res.redirect(authUrl);
});

// Get full email content
app.get("/api/emails/:id", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.get({
      userId: "me",
      id: req.params.id,
      format: "full",
    });

    const message = response.data;

    function decodeBody(data) {
      if (!data) return "";

      return Buffer.from(
        data.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf-8");
    }

    function findBody(payload) {
      if (payload.body && payload.body.data) {
        return decodeBody(payload.body.data);
      }

      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            return decodeBody(part.body.data);
          }
        }

        for (const part of payload.parts) {
          const result = findBody(part);
          if (result) return result;
        }
      }

      return "";
    }

    const headers = message.payload.headers;

    const getHeader = (name) => {
      const header = headers.find(
        (h) => h.name.toLowerCase() === name.toLowerCase()
      );

      return header ? header.value : "";
    };

    res.json({
      id: message.id,
      from: getHeader("From"),
      to: getHeader("To"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
      body: findBody(message.payload),
    });
  } catch (error) {
    console.error("Get email error:", error);

    res.status(500).json({
      error: "Failed to fetch email",
    });
  }
});
// Google sends the user back here
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    req.session.tokens = tokens;

    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 60px;">
          <h1>🎉 Gmail Connected!</h1>
          <p>Your AI Mail Assistant is now connected to Gmail.</p>
          <p>You can close this page.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);

    res.status(500).send(`
      <h1>❌ Gmail connection failed</h1>
      <p>Check the terminal for the error.</p>
    `);
  }
});
// Get Gmail inbox emails
app.get("/api/emails", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      labelIds: ["INBOX"],
    });

    const messages = response.data.messages || [];

    const emails = [];

    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = email.data.payload.headers;

      const getHeader = (name) => {
        const header = headers.find(
          (h) => h.name.toLowerCase() === name.toLowerCase()
        );

        return header ? header.value : "";
      };

      emails.push({
  id: message.id,
  from: getHeader("From"),
  subject: getHeader("Subject"),
  date: getHeader("Date"),
  snippet: email.data.snippet || "",
  unread: (email.data.labelIds || []).includes("UNREAD"),
});
    }

    res.json(emails);
  } catch (error) {
    console.error("Gmail API error:", error);
    res.status(500).json({
      error: "Failed to fetch Gmail emails",
    });
  }
});
// Send a real Gmail email
app.post("/api/send-email", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: "To, subject and body are required",
      });
    }

    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\r\n");

    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    res.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Send email error:", error);

    res.status(500).json({
      error: "Failed to send email",
    });
  }
});

app.get("/api/sent", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: "Not connected to Gmail" });
    }

    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["SENT"],
      maxResults: 20,
    });

    const messages = response.data.messages || [];

    const emails = [];

    for (const message of messages) {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      });

      const headers = detail.data.payload.headers;

      const getHeader = (name) =>
        headers.find(
          (header) => header.name.toLowerCase() === name.toLowerCase()
        )?.value || "";

      emails.push({
        id: message.id,
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject") || "(No Subject)",
        date: getHeader("Date"),
        snippet: detail.data.snippet || "",
      });
    }

    res.json(emails);
  } catch (error) {
    console.error("Error loading sent emails:", error);
    res.status(500).json({ error: "Failed to load sent emails" });
  }
});

app.get("/api/starred", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: "Not connected to Gmail" });
    }

    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["STARRED"],
      maxResults: 20,
    });

    const messages = response.data.messages || [];

    const emails = [];

    for (const message of messages) {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = detail.data.payload.headers;

      const getHeader = (name) =>
        headers.find(
          (header) => header.name.toLowerCase() === name.toLowerCase()
        )?.value || "";

      emails.push({
        id: message.id,
        from: getHeader("From"),
        subject: getHeader("Subject") || "(No Subject)",
        date: getHeader("Date"),
        snippet: detail.data.snippet || "",
        unread: detail.data.labelIds?.includes("UNREAD") || false,
      });
    }

    res.json(emails);
  } catch (error) {
    console.error("Error loading starred emails:", error);
    res.status(500).json({ error: "Failed to load starred emails" });
  }
});

app.get("/api/trash", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Not connected to Gmail"
      });
    }

    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client
    });

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["TRASH"],
      maxResults: 20
    });

    const messages = response.data.messages || [];

    const emails = [];

    for (const message of messages) {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"]
      });

      const headers = detail.data.payload.headers;

      const getHeader = (name) =>
        headers.find(
          (header) =>
            header.name.toLowerCase() === name.toLowerCase()
        )?.value || "";

      emails.push({
        id: message.id,
        from: getHeader("From"),
        subject: getHeader("Subject") || "(No Subject)",
        date: getHeader("Date"),
        snippet: detail.data.snippet || "",
        unread: (detail.data.labelIds || []).includes("UNREAD")
      });
    }

    res.json(emails);
  } catch (error) {
    console.error("Trash error:", error);

    res.status(500).json({
      error: "Failed to fetch trash"
    });
  }
});

// Check whether Gmail is connected
app.get("/auth/status", (req, res) => {
  if (req.session.tokens) {
    res.json({
      connected: true,
    });
  } else {
    res.json({
      connected: false,
    });
  }
});

app.post("/api/ai", async (req, res) => {
  try {
    const { message, email } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "AI message is required",
      });
    }

    const response = await gemini.models.generateContent({
  model: "gemini-3.6-flash",
  contents: `You are an AI email assistant. Help the user understand and manage their email. Be concise and useful.

User request:
${message}

Email content:
${email || "No email is currently open."}`,
});

    res.json({
      success: true,
      answer: response.text,
    });
  } catch (error) {
    console.error("AI error:", error);

    res.status(500).json({
      error: "Failed to get AI response",
    });
  }
});

app.post("/api/ai-compose", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Compose request is required",
      });
    }

    const response = await gemini.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are an AI email writing assistant.

The user wants to write an email based on this request:
${message}

Create a professional email.

Return ONLY in this format:

SUBJECT: <subject>

BODY:
<body>

Do not add anything else.`,
    });

    res.json({
      success: true,
      result: response.text,
    });
  } catch (error) {
    console.error("AI compose error:", error);

    res.status(500).json({
      error: "Failed to generate email",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});