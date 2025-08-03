import { callMoonshot } from "@/lib/llm";
import { formatTime } from "@/lib/utils";
import { useAgentStore } from "@/store/agents";
import { useConfigStore } from "@/store/config";
import { useDetailbarStore } from "@/store/detailbar";
import { useSidebarLogStore } from "@/store/sidebarLog";
import { ChatMessage } from "@/types/Chat";
import { useEffect, useRef, useState } from "react";

export default function ChatTabHtml() {
  const { currentSelectedAgent } = useDetailbarStore();

  if (!currentSelectedAgent) {
    return null;
  }
  const { name, id, memory, background } = currentSelectedAgent;
  const { logMessage } = useSidebarLogStore();
  const { displayBubble } = useAgentStore();
  const { worldEvent } = useConfigStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {}, []);

  // 滑到底部
  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || !currentSelectedAgent) return;
    const userMessage: ChatMessage = {
      sender: "user",
      message: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await generateAgentResponse(input, {
        messages: [...messages, userMessage],
      });
      const agentMessage: ChatMessage = {
        sender: "agent",
        message: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      logMessage(`💬 [私聊] ${name}: "${response}"`, "dialogue");
      displayBubble(id, `💬 ${response}`);
    } catch (e) {
      console.log(e, "e???");

      const fallback = "抱歉，我现在有点忙，稍后再聊吧...";
      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          message: fallback,
          timestamp: new Date(),
        },
      ]);
      displayBubble(id, fallback);
    } finally {
      setIsTyping(false);
    }
  };

  // 生成Agent回复
  const generateAgentResponse = async (
    userMessage: string,
    session: { messages: ChatMessage[] }
  ) => {
    // 检查用户是否已通过邀请码验证
    // if (!window.invitationManager || !window.invitationManager.isUserAuthenticated()) {
    //     return "请先输入邀请码以使用聊天功能";
    // }

    const eventContext = worldEvent
      ? `当前世界背景: "${worldEvent?.description}"`
      : "当前没有特殊事件发生";

    const recentChat = session.messages
      .slice(-6)
      .map((msg) => `${msg.sender === "user" ? "用户" : name}: ${msg.message}`)
      .join("\n");

    const prompt = `你是 ${name}，现在在与用户进行私人聊天。
  
  你的性格背景：
  ${background}
  
  你的记忆： （这是你与其他 agent 的聊天记忆，不是和用户的聊天记忆）
  ${memory.join("\n")}
  
  聊天环境：
  - 这是私人对话，不会影响你在模拟世界中的记忆和行为
  - ${eventContext}
  - 保持轻松自然的对话氛围
  
  最近的对话：
  ${recentChat}
  
  用户刚说："${userMessage}"
  
  请用你的性格特点自然地回复用户。回复要：
  1. 符合你的说话风格和性格
  2. 简洁自然，不要太正式
  3. 可以询问用户或分享想法
  4. 长度适中（1-3句话）
  
  请只返回JSON格式: {"response": "你的回复"}`;

    const aiResponse = await callMoonshot(prompt);

    if (!aiResponse.error && aiResponse.response) {
      return aiResponse.response;
    }

    throw new Error(aiResponse.message || "AI响应失败");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 pb-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">与 {name} 聊天</h3>
        <p className="text-xs text-gray-500 mt-1">
          私人对话，不会影响Agent的记忆和行为
        </p>
      </div>

      <div
        className="flex-grow overflow-y-auto py-4"
        id="chat-messages"
        style={{ maxHeight: "500px" }}
      >
        {/* 渲染消息列表 */}
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.timestamp.getTime()}
              className={`mb-3 ${
                message.sender === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg text-sm max-w-xs ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-800 shadow-sm border border-[#e5e7eb]"
                }`}
              >
                <div
                  className={`font-medium text-xs mb-1 ${
                    message.sender === "user"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {message.sender === "user" ? "你" : name}
                </div>
                <div>{message.message}</div>
              </div>
              <div
                className={`text-xs text-gray-400 mt-1 ${
                  message.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-sm text-center py-8">
            开始与 {name} 对话吧！👋
          </div>
        )}
      </div>

      <div className="flex-shrink-0 pt-3 border-t border-gray-200">
        <div className="flex gap-2 mb-2">
          <textarea
            id="chat-input"
            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm resize-none"
            rows={2}
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          ></textarea>
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            发送
          </button>
        </div>
        <div className="flex gap-2">
          <button
            // onClick="agentChatManager.clearChat('${agent.id}')"
            className="text-xs px-3 py-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            清空聊天
          </button>
        </div>
      </div>
    </div>
  );
}
