/*
  Puter Grok Gateway — OpenAI Compatible
*/

const PUTER_URL = "https://api.puter.com/v2/ai/chat";

;(async () => {
  const req = JSON.parse($request.body || "{}");

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
})();
