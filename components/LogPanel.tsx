"use client";
import { useSidebarLogStore, EncounterCard, EncounterCardStep } from "@/store/sidebarLog";
import { useRef } from "react";
import React from "react";

// 相遇卡片组件
function EncounterCardComponent({ card }: { card: EncounterCard }) {
  const getStatusColor = (status: EncounterCard["status"]) => {
    switch (status) {
      case "thinking": return "bg-yellow-50 border-yellow-200";
      case "talking": return "bg-blue-50 border-blue-200";
      case "completed": return "bg-green-50 border-green-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getStepIcon = (type: EncounterCardStep["type"]) => {
    switch (type) {
      case "encounter": return "🤝";
      case "decision": return "🤔";
      case "conversation_start": return "💬";
      case "dialogue": return "💭";
      case "conversation_end": return "🛑";
      default: return "📝";
    }
  };

  return (
    <div className={`encounter-card mb-3 p-3 rounded-lg border-2 ${getStatusColor(card.status)}`}>
      <div className="card-header mb-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm">
            {card.agentA.name} & {card.agentB.name}
          </h4>
          <span className={`text-xs px-2 py-1 rounded ${
            card.status === "thinking" ? "bg-yellow-100 text-yellow-700" :
            card.status === "talking" ? "bg-blue-100 text-blue-700" :
            "bg-green-100 text-green-700"
          }`}>
            {card.status === "thinking" ? "思考中" : 
             card.status === "talking" ? "对话中" : "已完成"}
          </span>
        </div>
      </div>
      
      <div className="card-steps space-y-1">
        {card.steps.map((step, index) => (
          <div key={index} className="step-item flex items-start gap-2 text-xs">
            <span className="step-icon">{getStepIcon(step.type)}</span>
            <div className="step-content">
              {step.agentName && (
                <span className="font-medium text-gray-600">{step.agentName}: </span>
              )}
              <span className="text-gray-700">{step.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogPanel() {
  const { logs, encounterCards } = useSidebarLogStore();
  const logPanelRef = useRef<HTMLDivElement>(null);

  // 混合排序：将卡片和日志按时间顺序合并
  const sortedItems = React.useMemo(() => {
    const items: Array<{
      type: 'card' | 'log';
      timestamp: number;
      data: any;
      id: string;
    }> = [];

    // 添加卡片
    encounterCards.forEach((card) => {
      items.push({
        type: 'card',
        timestamp: card.createdAt,
        data: card,
        id: card.id
      });
    });

    // 添加日志
    logs.forEach((log, index) => {
      items.push({
        type: 'log',
        timestamp: log.timestamp,
        data: log,
        id: `log-${index}`
      });
    });

    // 按时间戳排序
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, encounterCards]);

  return (
    <div
      id="log-panel-container"
      className="w-1/4 h-full flex flex-col bg-white rounded-lg shadow-md"
    >
      <h2 className="text-lg font-bold p-4 border-b border-gray-200">
        系统日志与对话
      </h2>
      <div
        id="log-panel"
        ref={logPanelRef}
        className="flex-grow overflow-y-auto p-2"
      >
        {sortedItems.map((item) => (
          item.type === 'card' ? (
            <EncounterCardComponent key={item.id} card={item.data} />
          ) : (
            <div key={item.id} className={`log-item ${item.data.type} mb-1 p-2 text-sm rounded`}>
              {item.data.message}
            </div>
          )
        ))}
      </div>
    </div>
  );
}
