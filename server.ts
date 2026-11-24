import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Serverless/Express endpoint for Hugging Face video generation (no CORS, real MP4 blob)
  app.post('/api/generate-video', async (req, res) => {
    try {
      const { prompt, hfToken } = req.body;

      if (!hfToken) {
        return res.status(400).json({ error: 'مفتاح Hugging Face Token (hf_...) مفقود. يرجى إدخاله في الإعدادات.' });
      }

      if (!prompt) {
        return res.status(400).json({ error: 'يرجى إدخال وصف المشهد.' });
      }

      // Call Hugging Face Inference API server-to-server
      const hfModels = [
        "https://api-inference.huggingface.co/models/ali-vilab/text-to-video-ms-1.7b",
        "https://router.huggingface.co/hf-inference/models/ali-vilab/text-to-video-ms-1.7b",
        "https://api-inference.huggingface.co/models/THUDM/CogVideoX-5b"
      ];

      let videoBuffer: Buffer | null = null;
      let lastErrorMsg = 'فشل توليد الفيديو من كافة النماذج المتاحة.';

      for (const endpoint of hfModels) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfToken}`,
              "Content-Type": "application/json",
              "Accept": "video/mp4"
            },
            body: JSON.stringify({ inputs: prompt })
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            videoBuffer = Buffer.from(arrayBuffer);
            if (videoBuffer.length > 1000) { // ensure it's a valid video file, not error json
              break;
            }
          } else {
            const errText = await response.text();
            try {
              const errJson = JSON.parse(errText);
              if (errJson.error) lastErrorMsg = errJson.error;
            } catch (e) {
              lastErrorMsg = errText || lastErrorMsg;
            }
          }
        } catch (e: any) {
          lastErrorMsg = e.message || lastErrorMsg;
        }
      }

      if (!videoBuffer || videoBuffer.length <= 1000) {
        return res.status(500).json({ error: `فشل توليد الفيديو: ${lastErrorMsg}` });
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.send(videoBuffer);

    } catch (err: any) {
      console.error('Error in /api/generate-video:', err);
      res.status(500).json({ error: err.message || 'حدث خطأ غير متوقع في الخادم' });
    }
  });

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
