// agentStore.ts
import { create } from "zustand";
import { Agent } from "@/types";
import {
  AGENT_BACKGROUNDS,
  AGENT_SPEED,
  AVATARS,
  GAME_TICK_MS,
  NAMES,
} from "@/lib/constant";
import { useSidebarLogStore } from "./sidebarLog";

type Conversation = {
  id: string;
  participants: string[];
  turn: string;
  turnCount: number;
  history: { name: string; dialogue: string }[];
};

type AgentStore = {
  agents: Agent[];
  conversations: Record<string, Conversation>;
  initAgents: () => void;
  tick: () => void; // 每帧更新
  setConversation: (c: Conversation) => void;
  intervalId: NodeJS.Timeout | null;
  cleanup: () => void;
  gameStart: boolean;
  startGame: () => void;
};

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  conversations: {},
  intervalId: null,
  gameStart: false,

  /**
   * 初始化agents
   */
  initAgents: () => {
    const { logMessage } = useSidebarLogStore.getState();
    logMessage("👋 欢迎来到Agora", "system");

    const pos = getRandomPosition();
    const agents: Agent[] = NAMES.map((name, i) => ({
      id: `agent-${i}`,
      name,
      x: pos.x,
      y: pos.y,
      target: getRandomPosition(),
      state: "wandering",
      motivation: { action: "wander" },
      lastMessage: "",
      memory: [],
      avatar: AVATARS[name as keyof typeof AVATARS],
      background: AGENT_BACKGROUNDS[name as keyof typeof AGENT_BACKGROUNDS],
    }));

    const intervalId = setInterval(get().tick, GAME_TICK_MS);
    // 赋值
    set({ agents, intervalId: intervalId });

    logMessage("✅ 5位Agent已就位。", "system");
    logMessage("💡 请点击左上角的“开始模拟”按钮。", "system");
  },

  cleanup: () => {
    const id = get().intervalId;
    if (id !== null) {
      clearInterval(id);
      set({ intervalId: null });
    }
  },

  /**
   * 每帧更新agents的位置
   */
  tick: () => {
    if (!get().gameStart) return;

    const agents = get().agents.map((agent) => {
      if (["talking", "thinking"].includes(agent.state)) return agent;

      const dx = agent.target.x - agent.x;
      const dy = agent.target.y - agent.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        // TODO: if (this.state === "finding") 这个逻辑没补全
        return { ...agent, target: getRandomPosition() };
      }

      return {
        ...agent,
        x: agent.x + (dx / distance) * AGENT_SPEED,
        y: agent.y + (dy / distance) * AGENT_SPEED,
      };
    });

    set({ agents });
  },

  /**
   * 移动agent
   * @param agent
   */
  moveAgent: (agent: Agent) => {
    const agents = get().agents.map((a) => (a.id === agent.id ? agent : a));
    set({ agents });
  },

  /**
   * 设置对话
   * @param c
   */
  setConversation: (c) => {
    const updated = { ...get().conversations, [c.id]: c };
    set({ conversations: updated });
  },

  /**
   * 开始游戏
   */
  startGame: () => set({ gameStart: true }),
}));

// 假数据生成器
function getRandomPosition() {
  return {
    x: Math.floor(Math.random() * 600),
    y: Math.floor(Math.random() * 400),
  };
}
