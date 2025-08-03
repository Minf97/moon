import { Agent, Conversation } from "@/types";
import { create } from "zustand";
import { useAgentStore } from "./agents";
import { useSidebarLogStore } from "./sidebarLog";

type ConversationStore = {
  conversations: Record<string, Conversation>;
  startConversation: (agentA: Agent, agentB: Agent) => void;
  endConversation: (conversationId: string, reason: string) => void;
  handleConversationTurn: (conversationId: string) => Promise<void>;
};

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: {},

  /**
   * 启动对话
   */
  startConversation: (agentA: Agent, agentB: Agent) => {
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
        },
      },
    }));

    // 设置 agent 状态
    agentA.state = "talking";
    agentB.state = "talking";
    agentA.conversationId = conversationId;
    agentB.conversationId = conversationId;
    agentA.target = { x: agentA.x, y: agentA.y };
    agentB.target = { x: agentB.x, y: agentB.y };

    get().handleConversationTurn(conversationId);
  },

  /**
   * 结束对话
   */
  endConversation: (conversationId: string, reason: string) => {
    const conv = get().conversations[conversationId];
    if (!conv) return;
    const { logMessage } = useSidebarLogStore.getState();
    const { agents } = useAgentStore.getState();
    const [id1, id2] = conv.participants;

    const agent1 = agents.find((a) => a.id === id1);
    const agent2 = agents.find((a) => a.id === id2);
    if (agent1) agent1.state = "idle";
    if (agent2) agent2.state = "idle";

    set((state: any) => {
      const updated = { ...state.conversations };
      delete updated[conversationId];
      return { conversations: updated };
    });

    logMessage(`🛑 对话结束 (${reason})`, "dialogue");
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
    if (!speaker || speaker.state !== "talking") {
      get().endConversation(conversationId, "一方提前离开");
      return;
    }

    const response = await generateDialogue(conversation);

    // 检查对话是否还在
    if (!get().conversations[conversationId]) return;

    displayBubble(speaker.id, response.dialogue);
    logMessage(
      `<strong>${speaker.name}:</strong> ${response.dialogue}`,
      "dialogue"
    );

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
      get().endConversation(conversationId, `${speaker.name} 决定结束对话`);
      const { setWandering, setFinding } = useAgentStore.getState();

      if (action === "leave_and_wander") {
        setWandering(speaker.id, response.dialogue);
      } else if (action === "leave_and_find" && response.action.target_name) {
        // TODO: 这里有问题，要改一下
        setFinding(speaker.id, response.action.target_name, response.dialogue);
      } else {
        setWandering(speaker.id, "决定离开但未指定目标");
      }
    }
  },

  // 后续你可以扩展 addMessage, endConversation 等
}));
