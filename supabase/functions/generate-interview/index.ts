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
    const { role, type, level, techStack, numQuestions = 5 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating interview questions for:', { role, type, level, techStack });

    const systemPrompt = `You are an expert technical interviewer. Generate ${numQuestions} interview questions for a ${level} ${role} position.

Interview type: ${type}
${techStack && techStack.length > 0 ? `Tech stack focus: ${techStack.join(', ')}` : ''}

Guidelines:
- For technical interviews: Focus on coding concepts, system design, and problem-solving
- For behavioral interviews: Use STAR method questions about past experiences
- For mixed interviews: Combine both technical and behavioral questions

Return ONLY a JSON array of question strings, no other text. Example:
["Question 1?", "Question 2?", "Question 3?"]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${numQuestions} interview questions for a ${role} position.` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON array from the response
    let questions: string[];
    try {
      // Try to extract JSON array from the content
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse questions:', parseError);
      // Fallback questions
      questions = [
        `Tell me about your experience with ${role}.`,
        `What interests you about this ${role} position?`,
        `Describe a challenging project you've worked on.`,
        `How do you approach problem-solving?`,
        `Where do you see yourself in 5 years?`
      ];
    }

    console.log('Generated questions:', questions);

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-interview:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
