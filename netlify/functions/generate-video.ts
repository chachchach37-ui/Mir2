interface NetlifyEvent {
  httpMethod: string;
  body: string | null;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { prompt } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'يرجى إدخال وصف المشهد.' }),
      };
    }

    // 1. Translate prompt to English using Pollinations text API
    let englishPrompt = prompt;
    try {
      const textUrl = "https://text.pollinations.ai/" + encodeURIComponent("Translate this into cinematic English video prompt: " + prompt);
      const textRes = await fetch(textUrl);
      if (textRes.ok) {
        const translated = await textRes.text();
        if (translated && translated.trim()) {
          englishPrompt = translated.trim();
        }
      }
    } catch (e) {
      console.warn("Translation fallback used");
    }

    // 2. Fetch real video from Pollinations Video API
    const videoUrl = "https://video.pollinations.ai/" + encodeURIComponent(englishPrompt) + "?model=seedance&width=720&height=1280";
    
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      const errText = await videoRes.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "فشل توليد الفيديو من Pollinations Video API: " + errText }),
      };
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    if (videoBuffer.length < 1000) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "الملف المستلم ليس فيديو صالحاً." }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: videoBuffer.toString('base64'),
      isBase64Encoded: true,
    };

  } catch (err: any) {
    console.error('Error in netlify function:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'حدث خطأ غير متوقع في الخادم' }),
    };
  }
}
