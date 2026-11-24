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
    const { prompt, hfToken } = body;

    if (!hfToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'مفتاح Hugging Face Token (hf_...) مفقود. يرجى إدخاله في الإعدادات.' }),
      };
    }

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'يرجى إدخال وصف المشهد.' }),
      };
    }

    const hfModels = [
      "https://router.huggingface.co/hf-inference/models/ali-vilab/text-to-video-ms-1.7b",
      "https://api-inference.huggingface.co/models/ali-vilab/text-to-video-ms-1.7b",
      "https://router.huggingface.co/hf-inference/models/THUDM/CogVideoX-5b"
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
          if (videoBuffer.length > 1000) {
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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `فشل توليد الفيديو: ${lastErrorMsg}` }),
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
