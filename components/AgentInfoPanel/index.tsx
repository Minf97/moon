// components/AgentInfoPanel.tsx
import { useDetailbarStore } from "@/store/detailbar";
import clsx from "clsx";
import ChatTabHtml from "./ChatTab";
import HistoryTab from "./HistoryTab";

export const AgentInfoPanel = () => {
  const { currentSelectedAgent, currentActiveTab, setSelectedAgent } =
    useDetailbarStore();

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
        {currentActiveTab === "history" ? <HistoryTab /> : null}
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
              <div key={index} id={`memory-${index}`} className="agent-memory-item">
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
