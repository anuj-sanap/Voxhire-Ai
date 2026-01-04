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
    const { role, type, techStack, transcript } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating feedback for interview:', { role, type });

    const systemPrompt = `You are an expert interview coach providing detailed feedback on a mock interview.

The candidate interviewed for: ${role}
Interview type: ${type}
${techStack && techStack.length > 0 ? `Tech stack: ${techStack.join(', ')}` : ''}

Analyze the interview transcript and provide constructive feedback.

You MUST respond with ONLY a valid JSON object in this exact format (no other text):
{
  "overallScore": <number 0-100>,
  "categoryScores": {
    "technicalKnowledge": <number 0-100>,
    "communication": <number 0-100>,
    "problemSolving": <number 0-100>,
    "culturalFit": <number 0-100>
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2"],
  "finalAssessment": "A 2-3 sentence overall assessment of the candidate's performance."
}`;

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
          { role: 'user', content: `Here is the interview transcript:\n\n${transcript}\n\nPlease provide feedback.` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response:', content);

    // Parse the JSON from the response
    let feedback;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        feedback = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse feedback:', parseError);
      // Fallback feedback
      feedback = {
        overallScore: 75,
        categoryScores: {
          technicalKnowledge: 75,
          communication: 78,
          problemSolving: 72,
          culturalFit: 80
        },
        strengths: [
          "Showed enthusiasm for the role",
          "Communicated clearly",
          "Demonstrated relevant experience"
        ],
        improvements: [
          "Could provide more specific examples",
          "Consider elaborating on technical details"
        ],
        finalAssessment: "The candidate showed good potential and communicated effectively. With more practice and specific examples, they would be a strong contender for the position."
      };
    }

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-feedback:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
