import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Interview {
  id: string;
  user_id: string;
  role: string;
  type: string;
  level: string;
  tech_stack: string[];
  questions: string[];
  status: string;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}

export interface InterviewFeedback {
  id: string;
  interview_id: string;
  user_id: string;
  overall_score: number;
  category_scores: Record<string, number>;
  strengths: string[];
  improvements: string[];
  final_assessment: string | null;
  created_at: string;
}

export const useInterviews = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInterviews();
    } else {
      setInterviews([]);
      setLoading(false);
    }
  }, [user]);

  const fetchInterviews = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching interviews:', error);
    } else {
      setInterviews(data || []);
    }
    setLoading(false);
  };

  const createInterview = async (
    role: string,
    type: string,
    level: string,
    techStack: string[],
    questions: string[]
  ): Promise<Interview | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('interviews')
      .insert({
        user_id: user.id,
        role,
        type,
        level,
        tech_stack: techStack,
        questions,
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating interview:', error);
      return null;
    }

    setInterviews(prev => [data, ...prev]);
    return data;
  };

  const getInterview = async (id: string): Promise<Interview | null> => {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching interview:', error);
      return null;
    }

    return data;
  };

  const updateInterviewStatus = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'completed') {
      updates.finished_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('interviews')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating interview:', error);
      return false;
    }

    setInterviews(prev => 
      prev.map(interview => 
        interview.id === id ? { ...interview, status, finished_at: updates.finished_at as string } : interview
      )
    );
    return true;
  };

  const saveFeedback = async (
    interviewId: string,
    feedback: {
      overallScore: number;
      categoryScores: Record<string, number>;
      strengths: string[];
      improvements: string[];
      finalAssessment: string;
    }
  ): Promise<InterviewFeedback | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('interview_feedback')
      .insert({
        interview_id: interviewId,
        user_id: user.id,
        overall_score: feedback.overallScore,
        category_scores: feedback.categoryScores,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        final_assessment: feedback.finalAssessment
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving feedback:', error);
      return null;
    }

    // Mark interview as completed
    await updateInterviewStatus(interviewId, 'completed');

    return data as unknown as InterviewFeedback;
  };

  const getFeedback = async (interviewId: string): Promise<InterviewFeedback | null> => {
    const { data, error } = await supabase
      .from('interview_feedback')
      .select('*')
      .eq('interview_id', interviewId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching feedback:', error);
      return null;
    }

    return data as unknown as InterviewFeedback;
  };

  return {
    interviews,
    loading,
    fetchInterviews,
    createInterview,
    getInterview,
    updateInterviewStatus,
    saveFeedback,
    getFeedback
  };
};
