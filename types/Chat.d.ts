export interface ChatMessage {
  sender: "user" | "agent";
  message: string;
  timestamp: Date;
}
