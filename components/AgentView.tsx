"use client";
// 渲染单个 Agent
import React from "react";
import { Agent } from "@/types";

interface Props {
  agent: Agent;
}

export default function AgentView({ agent }: Props) {
  return (
    <div
      className="agent"
      id={agent.id}
      style={{
        transform: `translate(${agent.x}px, ${agent.y}px)`,
      }}
    >
      <div className="agent-avatar w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
        <img
          src={agent.avatar}
          alt={agent.name}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="agent-name text-sm text-center">{agent.name}</div>
      <div className={`status-indicator status-${agent.state}`} />
      {agent.lastMessage && (
        <div className="chat-bubble bg-white rounded shadow p-1 mt-1">
          {agent.lastMessage}
        </div>
      )}
    </div>
  );
}
