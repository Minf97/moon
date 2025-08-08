// 侧边栏的日志记录
import { create } from "zustand";

export type LogItem = {
  message: string;
  type?: "system" | "dialogue" | "memory";
  timestamp: number;
};

export type EncounterCardStep = {
  type: "encounter" | "decision" | "conversation_start" | "dialogue" | "conversation_end";
  agentName?: string;
  message: string;
  timestamp: number;
};

export type EncounterCard = {
  id: string;
  agentA: { id: string; name: string };
  agentB: { id: string; name: string };
  steps: EncounterCardStep[];
  status: "thinking" | "talking" | "completed";
  createdAt: number;
};

type LogStore = {
  logs: LogItem[];
  encounterCards: EncounterCard[];
  logMessage: (message: string, type?: LogItem["type"]) => void;
  createEncounterCard: (agentA: { id: string; name: string }, agentB: { id: string; name: string }) => string;
  addStepToCard: (cardId: string, step: EncounterCardStep) => void;
  updateCardStatus: (cardId: string, status: EncounterCard["status"]) => void;
  clear: () => void;
};

export const useSidebarLogStore = create<LogStore>((set, get) => ({
  logs: [],
  encounterCards: [],
  
  logMessage: (message, type = "system") =>
    set((state) => ({ logs: [...state.logs, { message, type, timestamp: Date.now() }] })),

  createEncounterCard: (agentA, agentB) => {
    const cardId = `encounter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const card: EncounterCard = {
      id: cardId,
      agentA,
      agentB,
      steps: [{
        type: "encounter",
        message: `${agentA.name} 和 ${agentB.name} 相遇了...`,
        timestamp: Date.now()
      }],
      status: "thinking",
      createdAt: Date.now()
    };
    
    set((state) => ({
      encounterCards: [...state.encounterCards, card]
    }));
    
    return cardId;
  },

  addStepToCard: (cardId, step) => {
    set((state) => ({
      encounterCards: state.encounterCards.map(card => 
        card.id === cardId 
          ? { ...card, steps: [...card.steps, step] }
          : card
      )
    }));
  },

  updateCardStatus: (cardId, status) => {
    set((state) => ({
      encounterCards: state.encounterCards.map(card => 
        card.id === cardId 
          ? { ...card, status }
          : card
      )
    }));
  },

  clear: () => set({ logs: [], encounterCards: [] }),
}));
