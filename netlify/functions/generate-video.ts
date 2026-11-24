export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "يرجى كتابة وصف المشهد أولاً" }),
      };
    }

    const transRes = await fetch(
      `https://pollinations.ai{encodeURIComponent(
        "Translate this video scene prompt to detailed cinematic English (only output the English prompt, nothing else): " + prompt
      )}`
    );
    const englishPrompt = transRes.ok ? (await transRes.text()).trim() : prompt;

    const pollinationsVideoUrl = `https://pollinations.ai{encodeURIComponent(englishPrompt)}?model=seedance&width=720&height=1280`;
    const polRes = await fetch(pollinationsVideoUrl);

    if (polRes.ok && (polRes.headers.get("content-type") || "").includes("video")) {
      const buffer = Buffer.from(await polRes.arrayBuffer());
      return {
        statusCode: 200,
        headers: { "Content-Type": "video/mp4" },
        body: buffer.toString("base64"),
        isBase64Encoded: true,
      };
    }

    return {
      statusCode: 502,
      body: JSON.stringify({
        error: "خادم الفيديو المجاني مشغول حالياً، أعد المحاولة بعد ثوانٍ",
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "خطأ داخلي في الخادم" }),
    };
  }
};
