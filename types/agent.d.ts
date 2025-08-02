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
  /** 记忆 */
  memory: string[];
  /** 头像 */
  avatar: string;
  /** 背景 */
  background: string;
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
};
