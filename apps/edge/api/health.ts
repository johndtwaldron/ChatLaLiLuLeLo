export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);
    
    if (url.pathname !== '/health') {
      return new Response('Not Found', { status: 404 });
    }

    // Check if required environment variables are present
    const health = {
      status: 'ok',
      timestamp: Date.now(),
      version: '1.0.0',
      environment: {
        openai_key_present: !!env.OPENAI_API_KEY,
        tavily_key_present: !!env.TAVILY_API_KEY,
        model: env.OPENAI_MODEL ?? 'gpt-4o-mini'
      }
    };

    return new Response(JSON.stringify(health, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} satisfies ExportedHandler;
