import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import pg from "pg";
import { fileURLToPath } from "node:url";
import path from "node:path";

const { Pool } = pg;
const app = express();
const PORT = Number(process.env.PORT || 3000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "dev_only_change_me_before_deploying";
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined }) : null;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "100kb" }));

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
async function databaseAvailable() {
  if (!pool) return false;
  try { await pool.query("SELECT 1"); return true; } catch { return false; }
}

app.get("/api/health", asyncRoute(async (_req, res) => {
  const connected = await databaseAvailable();
  res.json({ status: "ok", service: "su-saqshysy-api", database: connected ? "connected" : "not_configured_or_unavailable", time: new Date().toISOString() });
}));

app.get("/api/regions", (_req, res) => {
  res.json({ source: "demo", warning: "Бұл оқу жобасының демонстрациялық мәліметтері; ресми статистика емес.", regions: [
    { name: "Қызылорда", index: 88 }, { name: "Түркістан", index: 82 }, { name: "Жамбыл", index: 61 }, { name: "Шымкент", index: 54 }, { name: "Алматы", index: 32 }
  ] });
});

app.post("/api/water/logs", asyncRoute(async (req, res) => {
  const { date, amount, goal, logs = [] } = req.body || {};
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "date YYYY-MM-DD форматында болуы керек." });
  if (!Number.isInteger(amount) || amount < 0 || amount > 100000) return res.status(400).json({ error: "amount 0–100000 аралығындағы бүтін сан болуы керек." });
  if (!Number.isInteger(goal) || goal < 250 || goal > 10000) return res.status(400).json({ error: "goal 250–10000 аралығында болуы керек." });
  if (!Array.isArray(logs) || logs.length > 500) return res.status(400).json({ error: "logs массиві жарамсыз." });
  if (!pool) return res.status(503).json({ error: "DATABASE_URL орнатылмаған. Деректер браузерде сақталып тұр." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO water_daily (log_date, amount_ml, goal_ml) VALUES ($1, $2, $3)
      ON CONFLICT (log_date) DO UPDATE SET amount_ml = EXCLUDED.amount_ml, goal_ml = EXCLUDED.goal_ml, updated_at = NOW()`, [date, amount, goal]);
    const saved = [];
    for (const item of logs) {
      if (!Number.isInteger(item.amount) || item.amount < 1 || item.amount > 5000) continue;
      const timestamp = item.time && !Number.isNaN(Date.parse(item.time)) ? new Date(item.time) : new Date();
      const result = await client.query("INSERT INTO water_events (log_date, amount_ml, logged_at) VALUES ($1, $2, $3) RETURNING id, amount_ml, logged_at", [date, item.amount, timestamp]);
      saved.push(result.rows[0]);
    }
    await client.query("COMMIT");
    res.json({ ok: true, message: "Күндік су есебі сақталды.", date, amount, goal, logs: saved });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally { client.release(); }
}));

app.get("/api/water/summary", asyncRoute(async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DATABASE_URL орнатылмаған." });
  const from = typeof req.query.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from) ? req.query.from : new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const to = typeof req.query.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to) ? req.query.to : new Date().toISOString().slice(0, 10);
  const result = await pool.query("SELECT log_date, amount_ml, goal_ml, updated_at FROM water_daily WHERE log_date BETWEEN $1 AND $2 ORDER BY log_date", [from, to]);
  res.json({ from, to, days: result.rows });
}));

// Demo token endpoint. Replace with proper user registration/password hashing before production use.
app.post("/api/demo-token", (req, res) => {
  const label = typeof req.body?.label === "string" ? req.body.label.slice(0, 60) : "demo-user";
  const token = jwt.sign({ sub: "demo", label }, JWT_SECRET, { expiresIn: "30m" });
  res.json({ token, tokenType: "Bearer", expiresIn: "30m", note: "Оқу демонстрациясы. Бұл endpoint нақты аккаунт аутентификациясы емес." });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Серверде ішкі қате орын алды." });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
import { existsSync } from "node:fs";
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
}

app.listen(PORT, () => console.log(`Су сақшысы API: http://localhost:${PORT}`));
