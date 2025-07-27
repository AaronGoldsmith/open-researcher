
export type AgentName = 'supervisor' | 'researcher' | 'writer';

export type ResearchState = 'idle' | 'running' | 'stopped' | 'completed' | 'error';

export type ModelProvider = 'gemini' | 'ollama';

export interface AgentSettings {
  model: string;
  provider: ModelProvider;
}

export interface Settings {
  apiKey: string; // For Gemini
  tavilyApiKey: string; // For Tavily
  researchTopic: string;
  agents: Record<AgentName, AgentSettings>;
  searchMode: 'tavily' | 'local_search';
  iterations: number;
}

export interface LogEntry {
  agent: AgentName;
  message: string;
  timestamp: string;
  data?: any;
}

export interface ResearchResult {
    title: string;
    url: string;
    snippet: string;
}