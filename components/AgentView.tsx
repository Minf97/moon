"use client";
// 渲染单个 Agent
import React, { useEffect, useState } from "react";
import { Agent } from "@/types";
import { useDetailbarStore } from "@/store/detailbar";

interface Props {
  agent: Agent;
}

export default function AgentView({ agent }: Props) {
  const { lastMessageTime, lastMessage, avatar, name, state, x, y, id } = agent;
  // 5秒内才渲染
  const [isShow, setIsShow] = useState(false);

  const { setSelectedAgent } = useDetailbarStore();

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
      className="agent group"
      id={id}
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
      onClick={() => {
        setSelectedAgent(agent);
      }}
    >
      {/* 头像 */}
      <div className="agent-avatar group-hover:scale-105 transition-all duration-300 group-hover:shadow-lg w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
        <img src={avatar} alt={name} className="object-cover w-full h-full" />
      </div>
      {/* 名字 */}
      <div className="agent-name text-sm text-center">{name}</div>
      {/* 状态指示器 */}
      <div className={`status-indicator status-${state}`} />
      {/* 最后一条消息 */}
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
