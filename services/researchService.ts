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

const getTavilyApiKey = (settingsApiKey?: string): string | null => {
  // First check environment variable
  const envApiKey = process.env.TAVILY_API_KEY;
  if (envApiKey) {
    return envApiKey;
  }
  
  // Fall back to settings from frontend
  if (settingsApiKey) {
    return settingsApiKey;
  }
  
  return null;
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
  const supervisorPrompt = `Based on the overall research domain "${settings.researchTopic}", break it down into 3 to 5 distinct, self-contained **research sub-topics**. These sub-topics must collectively represent a **comprehensive and holistic overview** of the main domain, covering its fundamental conceptual areas, significant sub-disciplines, or critical facets. Each sub-topic should be suitable for in-depth investigation by specialized academic researchers. The focus should be on *understanding*, *analyzing*, and *exploring the intricacies* of these areas, not on designing or implementing practical solutions.

Your output **MUST** be a JSON array of strings, where each string is a detailed description of a research sub-topic. Do not include any other tasks, text, or explanation.

Example for "The Future of Urban Commuting":
[
  "Investigate the socio-economic impacts and public acceptance of autonomous vehicle integration into existing urban transport infrastructures.",
  "Analyze the scalability and environmental sustainability of hyperloop and high-speed rail technologies as alternatives to traditional air and road travel for inter-city commuting.",
  "Research the effectiveness of dynamic pricing models and real-time data analytics in optimizing traffic flow and reducing congestion in smart city environments.",
  "Examine the development and policy implications of urban air mobility (UAM) systems, including eVTOL aircraft, for last-mile and intra-city personal transport.",
  "Evaluate the psychological effects of prolonged commuting on mental health and well-being, exploring potential mitigation strategies through urban planning and remote work integration."
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
      const error = e as Error;
      createLog('supervisor', `Could not parse JSON from supervisor, falling back to phase-based research. Error: ${error.message}`);
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
          
          // Get Tavily API key from environment or settings
          const tavilyApiKey = getTavilyApiKey(settings.tavilyApiKey);
          
          if (settings.searchMode === 'tavily' && tavilyApiKey) {
              createResearcherLog(`Executing Tavily search...`);
              searchResults = await runRealTavilySearch(tavilyApiKey, searchQuery, signal);
          } else {
              createResearcherLog(`Executing simulated search...`);
              searchResults = await (settings.searchMode === 'tavily' ? runTavilySearch(searchQuery, signal) : runLocalSearch(searchQuery, signal));
          }

          createResearcherLog(`Found ${searchResults.results.length} sources.`, { results: searchResults.results });
          checkAborted(signal);
          
          if (searchResults.results.length > 0) {
            createResearcherLog(`Synthesizing information from all sources...`);
            
            // Combine all search results into a single comprehensive summary
            const allResultsText = searchResults.results.map((result, index) => 
              `Source ${index + 1}: ${result.title} (${result.url})\n${result.snippet}`
            ).join('\n\n---\n\n');
            
            const summaryPrompt = `For the research topic: "${topic}", analyze and synthesize the following sources into a comprehensive summary.

Start by integrating 2-4 direct, impactful quotes from across the sources that best capture the main themes.
Then provide a cohesive synthesis that connects the key insights from all sources.
Ensure the entire summary is directly relevant to "${settings.researchTopic}" and extracts the most critical information.
Aim for a comprehensive summary of approximately 7 sentences that weaves together insights from all sources.

IMPORTANT: When citing sources, use the format [Source Title](URL) for proper attribution. You can reference sources by their numbers (Source 1, Source 2, etc.) in quotes, but always include the full source information when possible.

Sources to analyze:
${allResultsText}`;

            const comprehensiveSummary = await runAgent('researcher', summaryPrompt);
            
            // Create a single note with explicit source mapping and summary
            const sourcesWithNumbers = searchResults.results.map((result, index) => 
              `[${index + 1}] ${result.title} (${result.url})`
            ).join('\n');
            
            const note = `Research Topic: ${topic}

Source References:
${sourcesWithNumbers}

Comprehensive Summary:
${comprehensiveSummary}

---End of Research Note---`;
            topicNotes.push(note);
            
            // Create a special log entry with all source document data
            createLog('researcher', `📄 Synthesized ${searchResults.results.length} sources into comprehensive note`, {
                type: 'sourceDocument',
                sourceData: {
                    sources: searchResults.results,
                    summary: comprehensiveSummary,
                    topic: topic,
                    timestamp: new Date().toISOString()
                }
            });
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
  
  // Extract sources from all research notes
  const allSources: string[] = [];
  researchNotes.forEach(note => {
    const sourceReferencesMatch = note.match(/Source References:\n([\s\S]*?)\n\nComprehensive Summary:/);
    if (sourceReferencesMatch && sourceReferencesMatch[1]) {
      // Parse individual numbered sources
      const sources = sourceReferencesMatch[1].split('\n').map(line => {
        const numberedSourceMatch = line.match(/^\[(\d+)\] (.+?) \((.+?)\)$/);
        if (numberedSourceMatch && numberedSourceMatch[2] && numberedSourceMatch[3]) {
          return `- [${numberedSourceMatch[2].trim()}](${numberedSourceMatch[3].trim()})`;
        }
        return null;
      }).filter((source): source is string => source !== null);
      allSources.push(...sources);
    }
  });
  
  const finalSourceList = allSources.join('\n');

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
