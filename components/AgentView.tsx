"use client";
// 渲染单个 Agent
import React, { useEffect, useState } from "react";
import { Agent } from "@/types";

interface Props {
  agent: Agent;
  onClick: (agent: Agent) => void;
}

export default function AgentView({ agent, onClick }: Props) {
  const { lastMessageTime, lastMessage, avatar, name, state, x, y, id } = agent;
  // 5秒内才渲染
  const [isShow, setIsShow] = useState(false);

  useEffect(() => {
    if (lastMessageTime > 0 && Date.now() - lastMessageTime < 5000) {
      setIsShow(true);
      setTimeout(() => {
        setIsShow(false);
      }, 5000);
    }
  }, [JSON.stringify(agent)]);

  return (
    <div
      className="agent"
      id={id}
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
      onClick={() => {
        onClick(agent);
      }}
    >
      <div className="agent-avatar w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
        <img src={avatar} alt={name} className="object-cover w-full h-full" />
      </div>
      <div className="agent-name text-sm text-center">{name}</div>
      <div className={`status-indicator status-${state}`} />
      {lastMessage && isShow && (
        <div
          className={`chat-bubble bg-white rounded shadow p-1 mt-1 ${
            isShow ? "visible" : "hidden"
          }`}
        >
          {lastMessage}
        </div>
      )}
    </div>
  );
}
