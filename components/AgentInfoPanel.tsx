// components/AgentInfoPanel.tsx
import { callMoonshot } from "@/lib/llm";
import { formatTime } from "@/lib/utils";
import { useAgentStore } from "@/store/agents";
import { useConfigStore } from "@/store/config";
import { useDetailbarStore } from "@/store/detailbar";
import { useSidebarLogStore } from "@/store/sidebarLog";
import { ChatMessage } from "@/types/Chat";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export const AgentInfoPanel = () => {
  const {
    currentSelectedAgent,
    currentActiveTab,
    setActiveTab,
    setSelectedAgent,
  } = useDetailbarStore();

  if (!currentSelectedAgent) {
    return null;
  }

  return (
    <div
      id="agent-sidebar"
      className={`absolute right-4 top-4 bottom-4 w-1/4 flex flex-col bg-white rounded-lg shadow-lg ${
        currentSelectedAgent ? "block" : "hidden"
      }`}
      style={{ zIndex: 50 }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold">Agent 详情</h2>
        <button
          id="close-sidebar"
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          onClick={() => setSelectedAgent(null)}
        >
          ×
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        {currentActiveTab === "info" ? <InfoTabHtml /> : null}
        {currentActiveTab === "history" ? <HistoryTabHtml /> : null}
        {currentActiveTab === "chat" ? <ChatTabHtml /> : null}
      </div>
      <Tabs />
    </div>
  );
};

function InfoTabHtml() {
  const { currentSelectedAgent } = useDetailbarStore();

  if (!currentSelectedAgent) {
    return null;
  }

  const { name, id, state, x, y, lastMessage, motivation, memory } =
    currentSelectedAgent;

  return (
    <div id="sidebar-agent-info">
      {/* Agent info will be inserted here */}
      <div className="agent-info-item">
        <div className="agent-info-label">基本信息</div>
        <div className="agent-info-content">
          <p>
            <strong>姓名:</strong> {name}
          </p>
          <p>
            <strong>ID:</strong> {id}
          </p>
          <p>
            <strong>状态:</strong>{" "}
            <span
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                state === "wandering"
                  ? "bg-green-100 text-green-800"
                  : state === "talking"
                  ? "bg-yellow-100 text-yellow-800"
                  : state === "finding"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {state}
            </span>
          </p>
          <p>
            <strong>坐标:</strong> ({Math.round(x)}, {Math.round(y)})
          </p>
          <p>
            <strong>最近的话:</strong>
            {lastMessage || "无"}
          </p>
          <p>
            <strong>动机:</strong>
            {JSON.stringify(motivation)}
          </p>
        </div>
      </div>

      <div className="agent-info-item">
        <div className="agent-info-label">记忆</div>
        <div className="agent-info-content agent-memory-list">
          {/* ${memoryHtml} */}
          {memory.length > 0 ? (
            memory.map((item, index) => (
              <div id={`memory-${index}`} className="agent-memory-item">
                {item}
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm">暂无记忆</div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryTabHtml() {
  return <div>History Tab</div>;
}

function ChatTabHtml() {
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

function Tabs() {
  const { currentActiveTab, setActiveTab } = useDetailbarStore();
  const ACTIVE_STATE_CLASS =
    "flex-1 bg-blue-500 cursor-pointer hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md transition-colors font-medium";

  const DEFAULT_STATE_CLASS =
    "flex-1 bg-gray-100 cursor-pointer hover:bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-md transition-colors font-medium";

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex gap-2">
        <button
          id="personal-info-btn"
          className={clsx(
            currentActiveTab === "info"
              ? ACTIVE_STATE_CLASS
              : DEFAULT_STATE_CLASS
          )}
          onClick={() => setActiveTab("info")}
        >
          📝 个人信息
        </button>
        <button
          id="history-chat-btn"
          className={clsx(
            currentActiveTab === "history"
              ? ACTIVE_STATE_CLASS
              : DEFAULT_STATE_CLASS
          )}
          onClick={() => setActiveTab("history")}
        >
          📜 历史对话
        </button>
        <button
          id="start-chat-btn"
          className={clsx(
            currentActiveTab === "chat"
              ? ACTIVE_STATE_CLASS
              : DEFAULT_STATE_CLASS
          )}
          onClick={() => setActiveTab("chat")}
        >
          💬 聊天
        </button>
      </div>
    </div>
  );
}
