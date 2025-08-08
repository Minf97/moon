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
    <div className="h-full flex flex-col overflow-hidden">
      {/* 聊天头部 */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">与 {name} 聊天</h3>
        <p className="text-xs text-gray-500 mt-1">
          私人对话，不会影响Agent的记忆和行为
        </p>
      </div>

      {/* 消息区域 */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3"
        style={{ minHeight: 0 }}
      >
        {/* 渲染消息列表 */}
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.timestamp.getTime()}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[280px] rounded-lg p-3 text-sm break-words ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800 border border-gray-200"
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
                <div className="whitespace-pre-wrap">{message.message}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.sender === "user"
                      ? "text-blue-100"
                      : "text-gray-400"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm text-center">
              开始与 {name} 对话吧！👋
            </div>
          </div>
        )}
        
        {/* 正在输入指示器 */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <span>{name} 正在输入</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 - 固定在底部 */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2 items-center">
          <textarea
            id="chat-input"
            className="flex-1 p-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[40px] max-h-[80px]"
            rows={1}
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isTyping}
            style={{ 
              overflowX: 'hidden',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors flex-shrink-0 h-[40px] flex items-center justify-center"
          >
            {isTyping ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "发送"
            )}
          </button>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={() => setMessages([])}
            className="text-xs px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            清空聊天
          </button>
          <div className="text-xs text-gray-400">
            按 Enter 发送，Shift+Enter 换行
          </div>
        </div>
      </div>
    </div>
  );
}
