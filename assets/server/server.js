require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for now to allow inline scripts
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);

// Body parser with size limits
app.use(bodyParser.json({ limit: "10kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10kb" }));

// Serve static files from the project root so visiting / returns index.html
// (useful for local testing). This serves files like index.html and assets/.
app.use(express.static(path.join(__dirname, "..", "..")));

// GET latest message
app.get("/api/message", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, inserted_at")
      .order("inserted_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    const message = data && data[0] ? data[0].content : null;
    res.json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_fetch" });
  }
});

// POST new message (insert and return saved)
app.post("/api/message", async (req, res) => {
  const { message } = req.body || {};

  // Enhanced validation
  if (typeof message !== "string") {
    return res.status(400).json({ error: "invalid_message" });
  }

  // Trim and check length
  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    return res.status(400).json({ error: "empty_message" });
  }

  if (trimmedMessage.length > 5000) {
    return res.status(400).json({ error: "message_too_long" });
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert([{ content: trimmedMessage }])
      .select()
      .limit(1);

    if (error) throw error;
    res.json({ ok: true, inserted: data && data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_insert" });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Message server listening on http://localhost:${port}`);
});
