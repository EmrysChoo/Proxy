/*
  Puter Grok Gateway — OpenAI Compatible
  Author: Shayon
*/

const PUTER_URL = "https://api.puter.com/v2/ai/chat";

;(async () => {
  try {
    const req = JSON.parse($request.body || "{}");

    // 转换 OpenAI → Puter
    const payload = {
      model: "x-ai/grok-4-1-fast",
      messages: req.messages || [],
      stream: req.stream || false
    };

    const res = await $http.post({
      url: PUTER_URL,
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = JSON.parse(res.body || "{}");

    // 转换 Puter → OpenAI
    const openaiFormat = {
      id: "grok-free",
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: data.output_text || ""
          },
          finish_reason: "stop"
        }
      ]
    };

    $done({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(openaiFormat)
    });

  } catch (e) {
    $done({
      status: 500,
      body: JSON.stringify({
        error: { message: "Puter Gateway Error: " + e }
      })
    });
  }
})();
