import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const body = await req.json();
  const {
    conversationInits = [],
    conversationMessages = [],
    agentMemories = [],
    encounterSteps = [],
    privateMessages = [],
  } = body ?? {};

  // Upsert conversations and participants
  if (conversationInits.length > 0) {
    const convRows = conversationInits.map((c: any) => ({
      id: c.conversationId,
      card_id: c.cardId ?? null,
      created_at: new Date(c.createdAt).toISOString(),
    }));
    const { error: convErr } = await supabase
      .from("conversations")
      .upsert(convRows, { onConflict: "id" });
    if (convErr) return new Response(`conversations error: ${convErr.message}`, { status: 500 });

    // participants
    const participantsRows = conversationInits.flatMap((c: any) =>
      (c.participantAgentIds || []).map((aid: string) => ({
        conversation_id: c.conversationId,
        agent_id: aid,
      }))
    );
    if (participantsRows.length > 0) {
      const { error: partErr } = await supabase
        .from("conversation_participants")
        .upsert(participantsRows, { onConflict: "conversation_id,agent_id" });
      if (partErr) return new Response(`participants error: ${partErr.message}`, { status: 500 });
    }
  }

  // Write conversation messages
  if (conversationMessages.length > 0) {
    const rows = conversationMessages.map((m: any) => ({
      conversation_id: m.conversationId,
      turn_index: m.turnIndex,
      sender_agent_id: m.senderAgentId ?? null,
      sender_type: m.senderType,
      content: m.content,
      created_at: new Date(m.ts).toISOString(),
    }));
    const { error } = await supabase
      .from("conversation_messages")
      .upsert(rows, { onConflict: "conversation_id,turn_index" });
    if (error) return new Response(`conv msgs error: ${error.message}`, { status: 500 });
  }

  // Write agent memories
  if (agentMemories.length > 0) {
    const rows = agentMemories.map((m: any) => ({
      agent_id: m.agentId,
      conversation_id: m.conversationId ?? null,
      source_type: m.sourceType ?? "conversation",
      content: m.content,
      created_at: new Date(m.ts).toISOString(),
    }));
    const { error } = await supabase.from("agent_memories").insert(rows);
    if (error) return new Response(`memories error: ${error.message}`, { status: 500 });
  }

  // Write encounter steps (optional)
  if (encounterSteps.length > 0) {
    const rows = encounterSteps.map((s: any) => ({
      card_id: s.cardId,
      step_type: s.stepType,
      agent_name: s.agentName ?? null,
      message: s.message,
      ts_ms: s.ts,
    }));
    const { error } = await supabase.from("encounter_card_steps").insert(rows);
    if (error) return new Response(`steps error: ${error.message}`, { status: 500 });
  }

  // Write private messages (user<->agent)
  if (privateMessages.length > 0) {
    const rows = privateMessages.map((m: any) => ({
      session_id: m.sessionId,
      client_message_id: m.clientMessageId,
      sender_type: m.senderType,
      sender_agent_id: m.senderAgentId ?? null,
      content: m.content,
      created_at: new Date(m.ts).toISOString(),
    }));
    const { error } = await supabase
      .from("private_chat_messages")
      .upsert(rows, { onConflict: "session_id,client_message_id" });
    if (error) return new Response(`private msgs error: ${error.message}`, { status: 500 });
  }

  return Response.json({ ok: true });
} 