// agentStore.ts
import { create } from "zustand";
import { Agent, AgentStore } from "@/types";
import {
  AGENT_BACKGROUNDS,
  AGENT_SPEED,
  AVATARS,
  GAME_TICK_MS,
  NAMES,
} from "@/lib/constant";
import { useSidebarLogStore } from "./sidebarLog";
import { useConfigStore } from "./config";
import {
  detectEncounter,
  getRandomPosition,
  shouldAgentsTalk,
} from "@/lib/agent";
import { useConversationStore } from "./conversation";
import { callMoonshot } from "@/lib/llm";
import { Conversation } from "../types/agent";

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  conversations: {},
  intervalId: null,

  /**
   * 初始化agents
   */
  initAgents: () => {
    const { logMessage } = useSidebarLogStore.getState();
    logMessage("👋 欢迎来到Agora", "system");

    // TODO: 这里是 mock 的，实际要接入数据库 or 区块链
    const agents: Agent[] = NAMES.map((name, i) => {
      const pos = getRandomPosition();
      return {
        id: `agent-${i}`,
        name,
        x: pos.x,
        y: pos.y,
        target: getRandomPosition(),
        state: "wandering",
        motivation: { action: "wander" },
        lastMessage: "",
        memory: [],
        lastEncounterCheck: {},
        avatar: AVATARS[name as keyof typeof AVATARS],
        background: AGENT_BACKGROUNDS[name as keyof typeof AGENT_BACKGROUNDS],
        conversationId: "",
        lastMessageTime: 0,
      };
    });

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
  tick: async () => {
    if (!useConfigStore.getState().gameStart) return;

    const agents = get().agents.map((agent) => {
      // 特殊状态不移动
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

    try {
      await get().checkEncounters();
    } catch (error) {
      console.error("Error in checkEncounters:", error);
    }
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
   * 检查相遇
   */
  checkEncounters: async () => {
    const agents = get().agents;
    const { logMessage, createEncounterCard, addStepToCard, updateCardStatus } = useSidebarLogStore.getState();
    const { startConversation } = useConversationStore.getState();

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agentA = agents[i];
        const agentB = agents[j];
        // ✅ 1. 是否足够靠近（相遇检测）
        // ✅ 2. 是否冷却完成（冷却判断）
        if (!detectEncounter(agentA, agentB)) continue;

        // 创建相遇卡片
        const cardId = createEncounterCard(
          { id: agentA.id, name: agentA.name },
          { id: agentB.id, name: agentB.name }
        );

        // 设置思考状态
        set((state: any) => ({
          agents: state.agents.map((a: Agent) =>
            a.id === agentA.id || a.id === agentB.id
              ? { ...a, state: "thinking" }
              : a
          )
        }));

        // 重新获取更新后的agents
        const updatedAgents = get().agents;
        const updatedAgentA = updatedAgents.find(a => a.id === agentA.id);
        const updatedAgentB = updatedAgents.find(a => a.id === agentB.id);
        if (!updatedAgentA || !updatedAgentB) continue;

        // ✅ 3. 决定是否想聊（内心OS、动机推理）
        const { decisionA, decisionB, shouldTalk } = await shouldAgentsTalk(
          updatedAgentA,
          updatedAgentB
        );

        // 添加决策步骤到卡片
        addStepToCard(cardId, {
          type: "decision",
          agentName: updatedAgentA.name,
          message: `${decisionA.should_initiate ? '想要对话' : '不想对话'}：${decisionA.reason}`,
          timestamp: Date.now()
        });
        
        addStepToCard(cardId, {
          type: "decision", 
          agentName: updatedAgentB.name,
          message: `${decisionB.should_initiate ? '想要对话' : '不想对话'}：${decisionB.reason}`,
          timestamp: Date.now()
        });

        // ✅ 4. 启动对话（进入会话逻辑）
        if (shouldTalk) {
          addStepToCard(cardId, {
            type: "conversation_start",
            message: "对话开始！",
            timestamp: Date.now()
          });
          updateCardStatus(cardId, "talking");
          startConversation(updatedAgentA, updatedAgentB, cardId);
        } else {
          addStepToCard(cardId, {
            type: "conversation_end",
            message: "对话未发起，双方未达成共识",
            timestamp: Date.now()
          });
          updateCardStatus(cardId, "completed");
          
          // 设置为闲逛状态
          set((state: any) => ({
            agents: state.agents.map((a: Agent) =>
              a.id === updatedAgentA.id || a.id === updatedAgentB.id
                ? { ...a, state: "wandering" }
                : a
            )
          }));
        }
      }
    }
    // 更新 agents 状态
    set((state) => ({ agents: [...state.agents] }));
  },

  /**
   * 生成对话
   * @param conversation
   */
  async generateDialogue(conversation: Conversation) {
    const { agents } = get();
    const { worldEvent } = useConfigStore.getState();
    const agent = agents.find((a) => a.id === conversation.turn);

    if (!agent) return;

    const otherAgent = agents.find(
      (a) =>
        a.id === conversation.participants.find((pId: any) => pId !== agent.id)
    );

    if (!otherAgent) return;

    const history = conversation.history
      .map((h) => `${h.name}: ${h.dialogue}`)
      .join("\n");
    const eventContext = worldEvent
      ? `当前世界事件是: "${worldEvent.description}".`
      : "当前没有特殊事件发生。";
    const memoryContext =
      agent.memory.length > 0
        ? `你的记忆中有这些过去的互动摘要:\n- ${agent.memory.join("\n- ")}`
        : "你还没有任何过去的互动记忆。";

    const prompt = `
    你叫 ${agent.name}。
    你的背景信息：
    ${agent.background}
    
    规则: 你的话要简短、直接，不要太客气。
    你的记忆:
    ${agent.memory.join("\n")}
    
    当前情景:
    大背景: ${eventContext}
    你正在和 ${otherAgent.name} 对话。
    对话历史:
    ${history || "（这是对话的第一句话）"}

    你正在一个科技产品相关的社交派对上。
    你正在和${otherAgent.name}聊天，你们可以：
    - 讨论现有的科技产品和它们的优缺点
    - 分享对产品设计和用户体验的看法  
    - 聊聊市面上的应用、网站、硬件设备等
    - 交流创业想法和商业模式
    - 分享使用某些产品的体验和感受
    
    重要约束：
    - 保持话题现实可行，不要讨论科幻或不切实际的概念
    - 专注于当前已存在或近期可能实现的技术
    - 不要提及你无法实际执行的行动
    - 避免过于天马行空的想象，保持务实的态度
    - 可以有创意，但要基于现实的技术基础

    现在轮到你发言。请根据你的背景、记忆和当前对话，生成你的下一句话，并决定下一步行动。
    行动选项: "continue_talking", "leave_and_wander", "leave_and_find"。
    请只返回一个JSON对象，格式为:
    { "dialogue": "你要说的话", "action": { "action": "..." } }
    `;

    const response = await callMoonshot(prompt);

    if (response.error) {
      return {
        dialogue: "我好像有点走神了...",
        action: { action: "leave_and_wander" },
      };
    }
    return response;
  },

  setWandering: (agentId: string, reason: string) => {
    const { agents } = get();
    const { logMessage } = useSidebarLogStore.getState();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    if (agent.state === "talking") {
      logMessage(`🚶 ${agent.name} 结束了对话并开始闲逛。原因: ${reason}`);
    }

    // 新状态
    const newStatus = {
      state: "wandering",
      motivation: { action: "wander" },
      target: getRandomPosition(),
      conversationId: "",
    };

    set((state: any) => ({
      agents: state.agents.map((a: Agent) =>
        a.id === agentId
          ? {
              ...a,
              ...newStatus,
            }
          : a
      ),
    }));
  },

  setFinding: (agentId: string, targetId: string, reason: string) => {
    const { agents } = get();
    const { logMessage } = useSidebarLogStore.getState();
    const agent = agents.find((a) => a.id === agentId);
    const targetAgent = agents.find((a) => a.id === targetId);

    if (!agent || !targetAgent) return;

    logMessage(
      `🎯 ${agent.name} 决定去寻找 ${targetAgent.name}。原因: ${reason}`
    );
    logMessage(`${agent.name} 发现了 ${targetAgent.name}，正在前往。`);

    const newStatus = {
      state: "finding",
      motivation: { action: "find", target: targetAgent.name },
      conversationId: "",
      //  target 的位置
      target: { x: targetAgent.x, y: targetAgent.y },
    };

    set((state: any) => ({
      agents: state.agents.map((a: Agent) =>
        a.id === agentId ? { ...a, ...newStatus } : a
      ),
    }));
  },

  displayBubble: (agentId: string, message: string) => {
    const { agents } = get();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    set((state: any) => ({
      agents: state.agents.map((a: Agent) =>
        a.id === agentId
          ? { ...a, lastMessage: message, lastMessageTime: Date.now() }
          : a
      ),
    }));
  },

  /**
   * 更新agent的记忆
   */
  updateAgentMemory: (agentId: string, memory: string) => {
    set((state: any) => ({
      agents: state.agents.map((a: Agent) =>
        a.id === agentId
          ? { ...a, memory: [...a.memory, memory] }
          : a
      ),
    }));
  },
}));
