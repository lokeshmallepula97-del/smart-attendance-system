import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import apiRouter from './src/server/routes.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Serve static assets or fallback to Vite in Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);
    console.log('Vite development server loaded as middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for undefined requests (Single Page Application fallback)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static client files route loaded.');
  }

  // Bind to 0.0.0.0 and Port 3000 as required
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Attendance Server live on http://localhost:${PORT}`);
  });
}

startServer();
