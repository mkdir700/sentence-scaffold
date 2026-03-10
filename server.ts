import express from 'express';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/check-sentence', (req, res) => {
    try {
      const { sentence } = req.body;
      if (!sentence) {
        return res.status(400).json({ error: 'Sentence is required' });
      }

      const existing = db.prepare('SELECT * FROM sentences WHERE text = ?').get(sentence) as any;
      if (existing) {
        return res.json(JSON.parse(existing.analysis_json));
      }
      
      res.status(404).json({ error: 'Not found' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/save-sentence', (req, res) => {
    try {
      const { sentence, analysis } = req.body;
      if (!sentence || !analysis) {
        return res.status(400).json({ error: 'Sentence and analysis are required' });
      }

      db.prepare('INSERT INTO sentences (text, analysis_json) VALUES (?, ?)').run(
        sentence,
        JSON.stringify(analysis)
      );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/history', (req, res) => {
    const history = db.prepare('SELECT id, text, created_at FROM sentences ORDER BY created_at DESC LIMIT 10').all();
    res.json(history);
  });

  app.post('/api/save', (req, res) => {
    try {
      const { sentence } = req.body;
      const existing = db.prepare('SELECT id FROM sentences WHERE text = ?').get(sentence) as any;
      if (!existing) {
        return res.status(404).json({ error: 'Sentence not found in history' });
      }
      
      const alreadySaved = db.prepare('SELECT id FROM saved_sentences WHERE sentence_id = ?').get(existing.id);
      if (alreadySaved) {
        return res.json({ success: true, message: 'Already saved' });
      }

      db.prepare('INSERT INTO saved_sentences (sentence_id) VALUES (?)').run(existing.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/saved', (req, res) => {
    const saved = db.prepare(`
      SELECT s.id, s.text, s.analysis_json, ss.created_at 
      FROM saved_sentences ss
      JOIN sentences s ON ss.sentence_id = s.id
      ORDER BY ss.created_at DESC
    `).all();
    res.json(saved);
  });

  app.post('/api/chunks', (req, res) => {
    try {
      const { expression, meaning, examples } = req.body;
      db.prepare('INSERT INTO chunks (expression, meaning, examples) VALUES (?, ?, ?)').run(
        expression,
        meaning,
        JSON.stringify(examples)
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/chunks', (req, res) => {
    const chunks = db.prepare('SELECT * FROM chunks ORDER BY created_at DESC').all();
    res.json(chunks);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
