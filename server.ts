import express from 'express';
import { createServer as createViteServer } from 'vite';
import analysisRouter from './server/routes/analysis.js';
import chunksRouter from './server/routes/chunks.js';
import feedbackRouter from './server/routes/feedback.js';
import libraryRouter from './server/routes/library.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.use('/api', analysisRouter);
  app.use('/api', chunksRouter);
  app.use('/api', feedbackRouter);
  app.use('/api', libraryRouter);

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
