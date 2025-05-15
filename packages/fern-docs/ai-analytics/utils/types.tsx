export interface Message {
  role: string;
  content: string;
}

export interface Conversation {
  domain: string;
  content: Message[];
  created: Date;
  braintrustId: string;
  conversationId: string;
  timeToFirstToken: number;
  conversationDuration: number;
  promptTokens: number;
  completionTokens: number;
}
