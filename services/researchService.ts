import { AgentName, LogEntry, Settings, ResearchResult } from '../types';
import { runGeminiAgent } from './geminiService';
import { runOllamaAgent, runTavilySearch, runLocalSearch } from './mockApiService';
import { GEMINI_MODELS } from '../constants';

interface ResearchProcessParams {
  settings: Settings;
  signal: AbortSignal;
  setActiveAgent: (agent: AgentName | null) => void;
  addLog: (log: LogEntry) => void;
  setFinalReport: (report: string) => void;
}

const runRealTavilySearch = async (
  apiKey: string,
  query: string,
  signal: AbortSignal
): Promise<{ results: ResearchResult[] }> => {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        max_results: 5,
        search_depth: 'advanced',
      }),
      signal,
    });

    if (signal.aborted) {
      throw new Error('Tavily API call aborted');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Tavily API error: ${response.statusText} - ${errorData.detail || 'Unknown error'}`);
    }

    const data = await response.json();
    const results: ResearchResult[] = data.results.map((item: any) => ({
      title: item.title,
      url: item.url,
      snippet: item.content, // Tavily uses 'content' for the snippet
    }));

    return { results };

  } catch (error: any) {
    if (error.name === 'AbortError' || signal.aborted) {
       const abortError = new Error('API call aborted by user');
       abortError.name = 'AbortError';
       throw abortError;
    }
    console.error("Tavily API Error:", error);
    throw new Error(`Failed to fetch from Tavily API: ${error.message}`);
  }
};


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const checkAborted = (signal: AbortSignal) => {
    if (signal.aborted) {
        const error = new Error('Process aborted by user');
        error.name = 'AbortError';
        throw error;
    }
};

// Fallback helper to extract research topics if JSON parsing fails
const extractResearchTopicsFromPlan = (plan: string): string[] => {
    const topics = plan.split('### Phase').slice(1).map(phase => {
        const titleLine = phase.trim().split('\n')[0];
        return `Phase${titleLine}`;
    });
    return topics.length > 0 ? topics : ['Overall Research'];
};


export const startResearchProcess = async ({
  settings,
  signal,
  setActiveAgent,
  addLog,
  setFinalReport,
}: ResearchProcessParams) => {
  let finalReport = '';

  const createLog = (agent: AgentName, message: string, data?: any) => {
    addLog({ agent, message, data, timestamp: new Date().toISOString() });
  };

  const runAgent = (agent: AgentName, prompt: string) => {
    const agentSettings = settings.agents[agent];
    if (agentSettings.provider === 'gemini' && settings.apiKey) {
      return runGeminiAgent(settings.apiKey, agentSettings.model, prompt, signal);
    }
    if (GEMINI_MODELS.includes(agentSettings.model) && !settings.apiKey) {
        throw new Error(`Model '${agentSettings.model}' is a Gemini model, but no Gemini API key was provided. Please provide a key or select an Ollama model.`);
    }
    return runOllamaAgent(agentSettings.model, prompt, signal);
  };

  // 1. Supervisor Agent
  setActiveAgent('supervisor');
  checkAborted(signal);
  createLog('supervisor', 'Breaking down research topic into sub-assignments...');
  await delay(1000);
  const supervisorPrompt = `Based on the overall research domain "${settings.researchTopic}", break it down into 3 to 5 distinct, self-contained **research sub-topics**. These sub-topics should represent fundamental areas of inquiry or investigation within the main domain, suitable for specialized academic researchers.

Your output **MUST** be a JSON array of strings, where each string is a detailed, self-contained research assignment. Do not include any other tasks, text, or explanation.

Example for "The Future of Electric Vehicles":
[
  "Investigate the technological advancements and limitations of next-generation battery chemistries (e.g., solid-state, lithium-sulfur) and their projected impact on EV performance metrics.",
  "Analyze the socio-economic and infrastructural challenges hindering the widespread adoption of EV charging networks, including policy interventions and innovative business models.",
  "Evaluate the cradle-to-grave environmental footprint of electric vehicles, specifically focusing on critical mineral extraction, battery manufacturing, recycling processes, and comparison with internal combustion engine vehicles.",
  "Research the ethical and regulatory considerations surrounding the integration of autonomous driving capabilities in EVs, including liability frameworks, public acceptance, and data privacy concerns."
]`;
  const researchPlanResponse = await runAgent('supervisor', supervisorPrompt);
  
  let researchTopics: string[];
  try {
    // Attempt to parse the JSON array from the supervisor's response.
    const jsonResponse = researchPlanResponse.substring(researchPlanResponse.indexOf('['), researchPlanResponse.lastIndexOf(']') + 1);
    researchTopics = JSON.parse(jsonResponse);
    if (!Array.isArray(researchTopics) || researchTopics.some(t => typeof t !== 'string')) {
        throw new Error('Response is not a valid array of strings.');
    }
    createLog('supervisor', `Research assignments generated: ${researchTopics.length} tasks.`);
    createLog('supervisor', `Full plan received:\n${researchPlanResponse}`);
  } catch (e) {
      createLog('supervisor', `Could not parse JSON from supervisor, falling back to phase-based research. Error: ${e.message}`);
      researchTopics = extractResearchTopicsFromPlan(researchPlanResponse);
  }
  checkAborted(signal);


  // 2. Researcher Agents (Parallel Process)
  setActiveAgent('researcher');
  checkAborted(signal);
  createLog('researcher', `Dispatching ${researchTopics.length} research agents to work in parallel...`);
  
  const researchTasks = researchTopics.map(topic => {
      return (async (): Promise<string[]> => {
          checkAborted(signal);
          const topicNotes: string[] = [];
          const createResearcherLog = (message: string, data?: any) => {
              const truncatedTopic = topic.length > 25 ? topic.substring(0, 22) + '...' : topic;
              createLog('researcher', `[${truncatedTopic}] ${message}`, data);
          };

          await delay(500); // Stagger start
          createResearcherLog('Starting research...');

          const searchQuery = `Comprehensive analysis and sources on: ${topic}`;
          let searchResults;
          if (settings.searchMode === 'tavily' && settings.tavilyApiKey) {
              createResearcherLog(`Executing Tavily search...`);
              searchResults = await runRealTavilySearch(settings.tavilyApiKey, searchQuery, signal);
          } else {
              createResearcherLog(`Executing simulated search...`);
              searchResults = await (settings.searchMode === 'tavily' ? runTavilySearch(searchQuery, signal) : runLocalSearch(searchQuery, signal));
          }

          createResearcherLog(`Found ${searchResults.results.length} sources.`, { results: searchResults.results });
          checkAborted(signal);
          
          if (searchResults.results.length > 0) {
            createResearcherLog(`Summarizing relevant information from sources...`);
          }
          for (const result of searchResults.results) {
              checkAborted(signal);
              const summaryPrompt = `For the research topic: "${topic}", summarize the following text concisely.
          Start the summary by integrating 1-3 direct, impactful quotes from the source that best capture its main thrust.
          Ensure the entire summary, including the quotes, is directly relevant to "${settings.researchTopic}" and extracts only the most critical information.
          Aim for a summary of approximately 5-7 sentences.\n\n${result.snippet}`
              const summary = await runAgent('researcher', summaryPrompt);
              const note = `Source: ${result.title} (${result.url})\nSummary: ${summary}`;
              topicNotes.push(note);
              
              // Create a special log entry with source document data
              createLog('researcher', `📄 New source found: "${result.title}"`, {
                  type: 'sourceDocument',
                  sourceData: {
                      title: result.title,
                      url: result.url,
                      snippet: result.snippet,
                      summary: summary,
                      topic: topic,
                      timestamp: new Date().toISOString()
                  }
              });
              
              console.log(`Collected note: ${note}`);
              await delay(200);
          }
          createResearcherLog('Research on this topic is complete.');
          return topicNotes;
      })();
  });

  const allNotesArrays = await Promise.all(researchTasks);
  const researchNotes = allNotesArrays.flat();

  createLog('researcher', `All research agents have completed their tasks. Total notes collected: ${researchNotes.length}.`);
  checkAborted(signal);
  
  // 3. Writer Agent
  setActiveAgent('writer');
  checkAborted(signal);
  createLog('writer', 'Synthesizing all research notes into the final report...');
  await delay(1000);
  
  const researchNotesString = researchNotes.join('\n\n---\n\n');
  const finalSourceList = researchNotes.map(note => {
      const titleMatch = note.match(/Source: (.*?)\s\((.*?)\)/);
      if (titleMatch && titleMatch[1] && titleMatch[2]) {
          return `- [${titleMatch[1]}](${titleMatch[2]})`;
      }
      return '';
  }).filter(Boolean).join('\n');

  const writerPrompt = `You are a professional research writer. Your task is to write a comprehensive, well-structured final report in Markdown format on the topic "${settings.researchTopic}".

You must create a report using the information from the **Collected Research Notes** provided below. Structure your report logically, addressing the different sub-topics covered by the research agents.

**Collected Research Notes:**
\`\`\`
${researchNotesString}
\`\`\`

**Instructions:**
- Write in clear, well-structured Markdown. Use headings, topics, and sub-topics to organize the content. Aim for a report length of approximately 1500-2000 words.
- **Crucially, you must cite your sources.** When you use information from a research note, add an inline citation using the source index at the end of the paragraph".
- At the end of the report, you **MUST** include a "## Sources" section. This section must **ONLY** contain the following sources, formatted as the bulleted list provided.

**Allowed Sources:**
${finalSourceList || 'No sources found.'}`;
  
  finalReport = await runAgent('writer', writerPrompt);
  createLog('writer', 'Final report has been generated.');
  
  setFinalReport(finalReport);
};
