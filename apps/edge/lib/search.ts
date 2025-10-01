export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(query: string, apiKey?: string): Promise<SearchResult[]> {
  if (!apiKey) {
    // Return empty results if no API key is provided
    console.warn('No Tavily API key provided, skipping web search');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({ 
        query, 
        max_results: 3,
        search_depth: 'basic',
        include_answer: false
      })
    });
    
    if (!response.ok) {
      console.error('Search API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    return (data.results ?? []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet
    }));
    
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export function formatResearchContext(results: SearchResult[]): string {
  if (!results.length) return '';
  
  const lines = results.map(r => `- ${r.title} — ${r.url}\n  ${r.snippet}`);
  return `\n[RESEARCH CONTEXT]\nUse sparingly. Sources:\n${lines.join('\n')}\n`;
}

export function buildSearchQuery(mode: string, lastUserMessage: string): string {
  // Create a focused search query based on mode and user message
  const modeHints = {
    'BTC': 'bitcoin cryptocurrency sovereign money',
    'JD': 'artificial intelligence philosophy information theory',
    'GW': 'digital glitch technology systems',
    'MGS': 'media theory information control digital culture'
  };
  
  const modeHint = modeHints[mode as keyof typeof modeHints] || '';
  return `${modeHint} ${lastUserMessage}`.trim().slice(0, 100); // Keep query reasonable length
}
