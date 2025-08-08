import { create } from "zustand";

// Types for queued payloads
export type QueuedConversationInit = {
  conversationId: string;
  participantAgentIds: string[];
  cardId?: string;
  createdAt: number;
};

export type QueuedConversationMessage = {
  conversationId: string;
  turnIndex: number; // 0-based
  senderAgentId?: string;
  senderType: "agent" | "system";
  content: string;
  ts: number; // ms
};

export type QueuedAgentMemory = {
  agentId: string;
  conversationId?: string;
  sourceType?: "conversation" | "interview" | "manual";
  content: string;
  ts: number;
};

export type QueuedEncounterStep = {
  cardId: string;
  stepType: string;
  agentName?: string;
  message: string;
  ts: number;
};

export type QueuedPrivateMessage = {
  sessionId: string; // client-maintained session id (uuid)
  clientMessageId: string; // uuid for idempotency
  senderType: "user" | "agent";
  senderAgentId?: string;
  content: string;
  ts: number;
};

export type SyncState = {
  conversationInits: QueuedConversationInit[];
  conversationMessages: QueuedConversationMessage[];
  agentMemories: QueuedAgentMemory[];
  encounterSteps: QueuedEncounterStep[];
  privateMessages: QueuedPrivateMessage[];
  intervalId: any | null;
  queueConversationInit: (v: QueuedConversationInit) => void;
  queueConversationMessage: (msg: QueuedConversationMessage) => void;
  queueAgentMemory: (mem: QueuedAgentMemory) => void;
  queueEncounterStep: (step: QueuedEncounterStep) => void;
  queuePrivateMessage: (msg: Omit<QueuedPrivateMessage, "clientMessageId"> & { clientMessageId?: string }) => string; // returns clientMessageId
  startAutoFlush: () => void;
  stopAutoFlush: () => void;
  flushNow: () => Promise<void>;
};

async function postSync(payload: any) {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sync failed: ${res.status} ${text}`);
  }
}

export const useSyncStore = create<SyncState>((set, get) => ({
  conversationInits: [],
  conversationMessages: [],
  agentMemories: [],
  encounterSteps: [],
  privateMessages: [],
  intervalId: null,

  queueConversationInit: (v) => {
    set((s) => ({ conversationInits: [...s.conversationInits, v] }));
  },
  queueConversationMessage: (msg) => {
    set((s) => ({ conversationMessages: [...s.conversationMessages, msg] }));
  },
  queueAgentMemory: (mem) => {
    set((s) => ({ agentMemories: [...s.agentMemories, mem] }));
  },
  queueEncounterStep: (step) => {
    set((s) => ({ encounterSteps: [...s.encounterSteps, step] }));
  },
  queuePrivateMessage: (msg) => {
    const id = msg.clientMessageId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    set((s) => ({ privateMessages: [...s.privateMessages, { ...msg, clientMessageId: id }] }));
    return id;
  },

  startAutoFlush: () => {
    const { intervalId } = get();
    if (intervalId) return;
    const id = setInterval(() => get().flushNow(), 30_000);
    set({ intervalId: id });
  },
  stopAutoFlush: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ intervalId: null });
  },
  flushNow: async () => {
    const state = get();
    const payload = {
      conversationInits: state.conversationInits,
      conversationMessages: state.conversationMessages,
      agentMemories: state.agentMemories,
      encounterSteps: state.encounterSteps,
      privateMessages: state.privateMessages,
    };
    if (
      payload.conversationInits.length === 0 &&
      payload.conversationMessages.length === 0 &&
      payload.agentMemories.length === 0 &&
      payload.encounterSteps.length === 0 &&
      payload.privateMessages.length === 0
    ) {
      return; // nothing to do
    }

    try {
      await postSync(payload);
      // Clear on success
      set({
        conversationInits: [],
        conversationMessages: [],
        agentMemories: [],
        encounterSteps: [],
        privateMessages: [],
      });
    } catch (e) {
      // keep buffer for retry
      console.error(e);
    }
  },
})); 