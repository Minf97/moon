


export async function POST(req: Request) {
  const { prompt } = await req.json();
  const modelName = process.env.NEXT_PUBLIC_MODEL_NAME || "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

  const payload = {
    model: modelName,
    messages: [
      {
        role: "user",
        content: prompt + "\n\n请确保你的回复是有效的JSON格式。",
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  };

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  console.log(data, "response???");
  

  return Response.json(data);
}