"use client";
import { useSidebarLogStore } from "@/store/sidebarLog";
import { useRef } from "react";

export default function LogPanel() {
  const { logs } = useSidebarLogStore();
  const logPanelRef = useRef<HTMLDivElement>(null);

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
        {logs.map((log, index) => (
          <div key={index} className={`log-item ${log.type}`}>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
