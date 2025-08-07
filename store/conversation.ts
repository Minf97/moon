import { Agent, Conversation } from "@/types";
import { create } from "zustand";
import { useAgentStore } from "./agents";
import { useSidebarLogStore } from "./sidebarLog";
import { callMoonshot } from "@/lib/llm";

type ConversationStore = {
  conversations: Record<string, Conversation>;
  startConversation: (agentA: Agent, agentB: Agent, cardId?: string) => void;
  endConversation: (conversationId: string, reason: string, speakerAction?: {action: string, target_name?: string}, speakerId?: string) => void;
  handleConversationTurn: (conversationId: string) => Promise<void>;
  generateMemoryForAgents: (agent1: Agent, agent2: Agent, history: any[]) => Promise<void>;
};

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: {},

  /**
   * 启动对话
   */
  startConversation: (agentA: Agent, agentB: Agent, cardId?: string) => {
    const conversationId = `conv-${Date.now()}`;

    set((state: any) => ({
      conversations: {
        ...state.conversations,
        [conversationId]: {
          id: conversationId,
          participants: [agentA.id, agentB.id],
          history: [],
          turn: agentA.id,
          turnCount: 0,
          createdAt: new Date().toISOString(),
          cardId, // 保存卡片ID
        },
      },
    }));

    // 通过 agents store 正确设置状态
    const { agents } = useAgentStore.getState();
    useAgentStore.setState((state: any) => ({
      agents: state.agents.map((agent: Agent) => {
        if (agent.id === agentA.id || agent.id === agentB.id) {
          return {
            ...agent,
            state: "talking",
            conversationId: conversationId,
            target: { x: agent.x, y: agent.y }
          };
        }
        return agent;
      })
    }));

    get().handleConversationTurn(conversationId);
  },

  /**
   * 结束对话
   */
  endConversation: async (conversationId: string, reason: string, speakerAction?: {action: string, target_name?: string}, speakerId?: string) => {
    const conv = get().conversations[conversationId];
    if (!conv) return;
    const { logMessage, addStepToCard, updateCardStatus } = useSidebarLogStore.getState();
    const { agents, updateAgentMemory, setWandering, setFinding } = useAgentStore.getState();
    const [id1, id2] = conv.participants;

    const agent1 = agents.find((a) => a.id === id1);
    const agent2 = agents.find((a) => a.id === id2);
    
    // 为两个参与者生成记忆
    if (agent1 && agent2 && conv.history.length > 0) {
      await get().generateMemoryForAgents(agent1, agent2, conv.history);
    }

    // 更新卡片状态
    if (conv.cardId) {
      addStepToCard(conv.cardId, {
        type: "conversation_end",
        message: `对话结束：${reason}`,
        timestamp: Date.now()
      });
      updateCardStatus(conv.cardId, "completed");
    } else {
      logMessage(`🛑 对话结束 (${reason})`, "dialogue");
    }

    // 删除对话记录
    set((state: any) => {
      const updated = { ...state.conversations };
      delete updated[conversationId];
      return { conversations: updated };
    });

    // 处理发起结束对话的人的后续行动
    if (speakerAction && speakerId) {
      const speaker = agents.find(a => a.id === speakerId);
      if (speaker) {
        const { action } = speakerAction;
        if (action === "leave_and_wander") {
          setWandering(speakerId, "决定结束对话并闲逛");
        } else if (action === "leave_and_find" && speakerAction.target_name) {
          setFinding(speakerId, speakerAction.target_name, "决定结束对话并寻找他人");
        } else {
          setWandering(speakerId, "决定结束对话");
        }
      }
      
      // 另一个人自动设置为闲逛状态
      const otherId = conv.participants.find(id => id !== speakerId);
      if (otherId) {
        setWandering(otherId, "对话被对方结束");
      }
    } else {
      // 如果没有指定结束发起者（比如达到最大轮次），两个人都设置为闲逛
      conv.participants.forEach(participantId => {
        setWandering(participantId, reason);
      });
    }
    
    // 强制同步更新 agents 状态
    const { agents: updatedAgents } = useAgentStore.getState();
    conv.participants.forEach(participantId => {
      const agent = updatedAgents.find(a => a.id === participantId);
      if (agent && agent.state === "talking") {
        console.warn(`强制更新状态：${agent.name} 从 talking 改为 wandering`);
        agent.state = "wandering";
        agent.conversationId = "";
      }
    });
  },

  /**
   * 处理对话轮次
   */
  handleConversationTurn: async (conversationId: string) => {
    const { conversations } = get();
    const { logMessage } = useSidebarLogStore.getState();
    const { generateDialogue, displayBubble } = useAgentStore.getState();
    const conversation = conversations[conversationId];
    if (!conversation) return;

    const MAX_CONVERSATION_TURNS = 10;

    if (conversation.turnCount >= MAX_CONVERSATION_TURNS) {
      get().endConversation(conversationId, "对话达到最大轮次");
      return;
    }

    const speaker = useAgentStore
      .getState()
      .agents.find((a) => a.id === conversation.turn);
    if (!speaker) {
      console.error(`找不到speaker，ID: ${conversation.turn}，参与者: [${conversation.participants.join(', ')}]`);
      get().endConversation(conversationId, `找不到发言者 (ID: ${conversation.turn})`);
      return;
    }
    if (speaker.state !== "talking") {
      console.error(`Speaker状态异常: ${speaker.name} (${speaker.id}) 状态为 ${speaker.state}，期望为 talking`);
      get().endConversation(conversationId, `${speaker.name} 状态异常 (${speaker.state})`);
      return;
    }

    const response = await generateDialogue(conversation);

    // 检查对话是否还在
    if (!get().conversations[conversationId]) return;

    displayBubble(speaker.id, response.dialogue);
    
    // 更新卡片中的对话内容
    if (conversation.cardId) {
      const { addStepToCard } = useSidebarLogStore.getState();
      addStepToCard(conversation.cardId, {
        type: "dialogue",
        agentName: speaker.name,
        message: response.dialogue,
        timestamp: Date.now()
      });
    } else {
      // 如果没有卡片，使用原来的日志方式
      logMessage(
        `${speaker.name}: ${response.dialogue}`,
        "dialogue"
      );
    }

    // 更新历史记录
    set((state: any) => {
      const convo = state.conversations[conversationId];
      if (!convo) return {};
      return {
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...convo,
            history: [
              ...convo.history,
              { name: speaker.name, dialogue: response.dialogue },
            ],
            turnCount: convo.turnCount + 1,
          },
        },
      };
    });

    const action = response.action.action;

    if (action === "continue_talking") {
      const other = conversation.participants.find((id) => id !== speaker.id);
      set((state: any) => {
        const convo = state.conversations[conversationId];
        if (!convo) return {};
        return {
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...convo,
              turn: other,
            },
          },
        };
      });
      setTimeout(() => get().handleConversationTurn(conversationId), 1000);
    } else {
      // 一个人决定结束对话，传递行动信息让endConversation处理两个人的状态
      get().endConversation(conversationId, `${speaker.name} 决定结束对话`, response.action, speaker.id);
    }
  },

  /**
   * 为参与对话的两个agent生成记忆
   */
  generateMemoryForAgents: async (agent1: Agent, agent2: Agent, history: any[]) => {
    const { logMessage } = useSidebarLogStore.getState();
    const { updateAgentMemory } = useAgentStore.getState();
    
    try {
      // 构建对话历史文本
      const conversationText = history.map(item => `${item.name}: ${item.dialogue}`).join('\n');
      
      // 为第一个agent生成记忆
      const memoryPrompt1 = `
你是 ${agent1.name}，刚刚和 ${agent2.name} 完成了一段对话。请根据这段对话内容，生成一个简洁的记忆摘要（50字以内）。

对话内容：
${conversationText}

请生成一个从 ${agent1.name} 的视角出发的记忆摘要，描述这次对话的要点。只返回JSON格式：{"memory": "记忆内容"}
      `;

      // 为第二个agent生成记忆  
      const memoryPrompt2 = `
你是 ${agent2.name}，刚刚和 ${agent1.name} 完成了一段对话。请根据这段对话内容，生成一个简洁的记忆摘要（50字以内）。

对话内容：
${conversationText}

请生成一个从 ${agent2.name} 的视角出发的记忆摘要，描述这次对话的要点。只返回JSON格式：{"memory": "记忆内容"}
      `;

      // 并行调用API生成两个记忆
      const [response1, response2] = await Promise.all([
        callMoonshot(memoryPrompt1),
        callMoonshot(memoryPrompt2)
      ]);

      // 更新第一个agent的记忆
      if (response1 && !response1.error && response1.memory) {
        updateAgentMemory(agent1.id, response1.memory);
        logMessage(`💭 ${agent1.name} 生成了新记忆: ${response1.memory}`, "memory");
      }

      // 更新第二个agent的记忆
      if (response2 && !response2.error && response2.memory) {
        updateAgentMemory(agent2.id, response2.memory);
        logMessage(`💭 ${agent2.name} 生成了新记忆: ${response2.memory}`, "memory");
      }

    } catch (error) {
      console.error("生成记忆时出错:", error);
      logMessage(`❗️ 生成记忆失败: ${error}`, "system");
    }
  },

  // 后续你可以扩展 addMessage, endConversation 等
}));
