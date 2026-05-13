export interface PushSendInput {
  userId: string;
  tokens: string[];
  titleAr: string;
  titleEn?: string | null;
  bodyAr: string;
  bodyEn?: string | null;
  data?: Record<string, string>;
}

export interface PushChannel {
  send(input: PushSendInput): Promise<{ sent: number; invalidTokens: string[] }>;
}

export const PUSH_CHANNEL = Symbol('PUSH_CHANNEL');
