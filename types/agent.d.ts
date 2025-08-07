export interface Agent {
  /** 唯一标识 */
  id: string;
  /** 名称 */
  name: string;
  /** 位置 */
  x: number;
  y: number;
  /** 目标位置 */
  target: { x: number; y: number };
  /** 状态 */
  state: AgentState;
  /** 动机 */
  motivation: { action: string; target?: string };
  /** 最后一条消息 */
  lastMessage: string;
  /** 最后一条消息时间 */
  lastMessageTime: number;
  /** 记忆 */
  memory: string[];
  /** 头像 */
  avatar: string;
  /** 背景 */
  background: string;
  /** 最后一次相遇检查 */
  lastEncounterCheck: {
    [key: string]: number;
  };
  /** 对话ID */
  conversationId: string;
}

export type AgentState = "wandering" | "talking" | "thinking" | "finding";

export type ConversationTurn = {
  turn: number;
  agentId: string;
  name: string;
  dialogue: string;
};

export type Conversation = {
  id: string;
  participants: string[]; // [agentId1, agentId2]
  history: ConversationTurn[];
  currentTurn: string; // agentId
  turnCount: number;
  turn: string;
};

// 定义 store 的类型，用于类型推导
export type AgentStore = {
  agents: Agent[];
  conversations: Record<string, Conversation>;
  initAgents: () => void;
  tick: () => void; // 每帧更新
  setConversation: (c: Conversation) => void;
  intervalId: NodeJS.Timeout | null;
  cleanup: () => void;
  checkEncounters: () => Promise<void>;
  moveAgent: (agent: Agent) => void;
  generateDialogue: (conversation: Conversation) => Promise<any>;
  setWandering: (agentId: string, reason: string) => void;
  setFinding: (agentId: string, targetId: string, reason: string) => void;
  displayBubble: (agentId: string, message: string) => void;
  updateAgentMemory: (agentId: string, memory: string) => void;
};
