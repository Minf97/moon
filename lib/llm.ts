import { useSidebarLogStore } from "@/store/sidebarLog";

export async function callMoonshot(prompt: string) {
  const { logMessage } = useSidebarLogStore.getState();
  const modelName = process.env.NEXT_PUBLIC_MODEL_NAME || "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

  // 检查用户是否已通过邀请码验证
  // @ts-ignore
  //   if (
  //     !window.invitationManager ||
  //     !window.invitationManager.isUserAuthenticated()
  //   ) {
  //     logMessage("❗️ 请先输入邀请码以使用AI功能", "system");
  //     return { error: true, message: "未通过邀请码验证" };
  //   }

  try {
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

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API call failed with status: ${response.status}. Body: ${errorBody}`
      );
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      const rawText = data.choices[0].message.content;
      try {
        return JSON.parse(rawText);
      } catch (e) {
        console.error("Failed to parse JSON from Moonshot:", rawText);
        throw new Error("Invalid JSON response from API.");
      }
    }
    throw new Error("Invalid response structure from API.");
  } catch (error) {
    console.error("Moonshot API Error:", error);
    // @ts-ignore
    logMessage(`❗️ API调用失败: ${error.message}`, "system");
    // @ts-ignore
    return { error: true, message: error.message };
  }
}
