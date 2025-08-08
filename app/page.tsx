"use client";
import AgentView from "@/components/AgentView";
import LogPanel from "@/components/LogPanel";
import WorldEventModal from "@/components/WorldEventModal";
import { useAgentStore } from "@/store/agents";
import { useConfigStore } from "@/store/config";
import { useEffect, useState } from "react";
import { AgentInfoPanel } from "../components/AgentInfoPanel";
import { useSyncStore } from "@/store/sync";

export default function Home() {
  const { agents, initAgents, cleanup } = useAgentStore();
  const { gameStart, startGame } = useConfigStore();
  const { startAutoFlush, stopAutoFlush } = useSyncStore();
  const [isWorldEventModalOpen, setIsWorldEventModalOpen] = useState(false);

  useEffect(() => {
    initAgents();
    startAutoFlush();

    return () => {
      // 清除定时器
      cleanup();
      stopAutoFlush();
    };
  }, []);

  return (
    <div id="main-app" className="w-screen h-screen p-4 flex gap-4 relative">
      {/* Main Map Area */}
      <div className="w-3/4 h-full flex flex-col gap-4">
        <div className="flex-grow relative">
          <div id="map" className="map"></div>
          <div id="controls" className="absolute top-2 left-2 flex gap-2">
            <button
              id="start-sim-btn"
              className={`control-button ${gameStart ? "hidden" : ""}`}
              onClick={startGame}
            >
              🚀 开始模拟
            </button>
            <button
              id="event-trigger-btn"
              className={`control-button ${gameStart ? "" : "hidden"}`}
              onClick={() => setIsWorldEventModalOpen(true)}
            >
              ✨ 触发世界事件
            </button>
          </div>
        </div>
        <div
          id="selected-agent-panel"
          className="h-48 p-4 border border-gray-200 rounded-lg shadow-sm selected-agent-panel hidden"
        >
          <h3 className="font-bold text-lg">选中的Agent信息</h3>
          <div
            id="agent-details"
            className="mt-2 text-sm grid grid-cols-2 gap-x-4"
          ></div>
        </div>
      </div>

      {/* Log Panel */}
      <LogPanel />

      {agents.map((agent) => (
        <AgentView key={agent.id} agent={agent} />
      ))}

      {/* Agent Details Sidebar */}
      <AgentInfoPanel />

      {/* World Event Modal */}
      <WorldEventModal 
        isOpen={isWorldEventModalOpen} 
        onClose={() => setIsWorldEventModalOpen(false)} 
      />
    </div>
  );
}
