export interface User {
  id: number;
  username: string;
  email: string;
  access_level: number;
}


export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
}


export interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}


export interface ChatSource {
  document_id: number;
  document_title: string;
  chunk_id: number;
  chunk_index: number;
  content: string;
  score: number;
}

export interface Document {
  id: number;
  title: string;
  content: string;
  required_access_level: number;
  created_by_id: number;
}