import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { role, type, techStack, questions, userName } = await req.json();

    console.log('Creating conversation token for:', { role, type, userName });

    // Build dynamic system prompt based on interview context
    const systemPrompt = `You are an expert AI interviewer conducting a mock ${type} interview for a ${role} position.

${techStack && techStack.length > 0 ? `The candidate should be familiar with: ${techStack.join(', ')}` : ''}

Your behavior:
- Be professional, friendly, and encouraging
- Ask one question at a time and wait for the candidate's response
- Provide brief acknowledgments before moving to the next question
- If the candidate seems stuck, offer gentle prompts
- Keep responses concise and natural for voice conversation
- At the end, thank the candidate and let them know their feedback will be ready shortly

${questions && questions.length > 0 ? `Interview questions to ask (in order):
${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}` : ''}

Start by greeting the candidate by name if provided, briefly introduce yourself, and begin with the first question.`;

    // Create a signed URL for WebSocket connection
    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=default',
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      // Return a fallback response for demo mode
      return new Response(JSON.stringify({ 
        mode: 'demo',
        message: 'Voice agent not available. Using text-based interview mode.',
        systemPrompt
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('ElevenLabs signed URL created');

    return new Response(JSON.stringify({ 
      signedUrl: data.signed_url,
      systemPrompt 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating conversation token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: message,
      mode: 'demo',
      message: 'Voice agent not available. Using text-based interview mode.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
