import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const SCORES_FILE = process.env.NODE_ENV === "production" 
  ? path.join("/tmp", "scores.json") 
  : path.join(process.cwd(), "scores.json");

// Helper to get scores
const getScores = () => {
  try {
    if (fs.existsSync(SCORES_FILE)) {
      const data = fs.readFileSync(SCORES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading scores:", error);
  }
  return [];
};

// Helper to save scores
const saveScores = (scores: any[]) => {
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
  } catch (error) {
    console.error("Error writing scores:", error);
  }
};

// API routes
app.get("/api/scores", (req, res) => {
  res.json(getScores());
});

app.post("/api/scores", (req, res) => {
  const newScore = req.body;
  
  if (!newScore || !newScore.playerName) {
    return res.status(400).json({ error: "Invalid score data" });
  }

  const scores = getScores();
  scores.push({
    ...newScore,
    id: Date.now().toString(),
    date: Date.now()
  });

  // Sort scores: winners first, then highest level, then lowest touches
  scores.sort((a: any, b: any) => {
    if (a.result === 'won' && b.result !== 'won') return -1;
    if (a.result !== 'won' && b.result === 'won') return 1;
    if (a.level !== b.level) return b.level - a.level;
    return a.touches - b.touches;
  });

  // Limit to top 100 to save space
  const topScores = scores.slice(0, 100);
  
  saveScores(topScores);
  res.json({ success: true, scores: topScores });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
