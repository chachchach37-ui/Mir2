import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { handler as netlifyHandler } from './netlify/functions/generate-video.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Bridge Netlify function handler to Express route for local dev
  const bridgeHandler = async (req: any, res: any) => {
    try {
      const netlifyEvent = {
        httpMethod: req.method,
        body: JSON.stringify(req.body)
      };
      const result = await netlifyHandler(netlifyEvent as any);
      res.status(result.statusCode);
      if (result.headers) {
        for (const [key, val] of Object.entries(result.headers)) {
          res.setHeader(key, val as string);
        }
      }
      if (result.isBase64Encoded) {
        const buffer = Buffer.from(result.body, 'base64');
        res.send(buffer);
      } else {
        res.send(result.body);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  };

  app.post('/.netlify/functions/generate-video', bridgeHandler);
  app.post('/api/generate-video', bridgeHandler);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
