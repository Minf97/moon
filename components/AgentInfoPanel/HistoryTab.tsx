import { useConversationStore } from "@/store/conversation";
import { useDetailbarStore } from "@/store/detailbar";

export default function HistoryTab() {
  const { currentSelectedAgent } = useDetailbarStore();
  const { conversations } = useConversationStore();
  if (!currentSelectedAgent) {
    return null;
  }

  const agentConversations = Object.values(conversations).filter((conv) =>
    conv.participants.includes(currentSelectedAgent.id)
  );

  const completedConversations = currentSelectedAgent.memory.filter(
    (memory) => memory.includes("对话") || memory.includes("说")
  );

  return (
    <div>
      <div className="agent-info-item">
        <div className="agent-info-label">
          {currentSelectedAgent.name} 的历史对话
        </div>
        <div
          className="agent-info-content"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {/* 当前进行中的对话 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              当前进行中的对话
            </h4>
            {agentConversations.length > 0 ? (
              agentConversations.map((conv, index) => {
                const historyText = conv.history
                  .map((h) => `${h.name}: ${h.dialogue}`)
                  .join("<br>");
                return (
                  <div
                    key={`${conv.id}-${index}`}
                    className="mb-3 p-3 bg-gray-50 rounded border-l-4 border-blue-300"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      对话 ID: {conv.id.slice(-4)}
                    </div>
                    <div className="text-sm">{historyText}</div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">暂无进行中的对话</p>
            )}
          </div>

          {/* 记忆中的对话片段 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              记忆中的对话片段
            </h4>
            {completedConversations.length > 0 ? (
              completedConversations.map((memory, index) => (
                <div
                  key={`${memory}-${index}`}
                  className="mb-2 p-2 bg-yellow-50 rounded border-l-3 border-yellow-300"
                >
                  <div className="text-sm text-gray-700">{memory}</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">暂无历史对话记录</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
