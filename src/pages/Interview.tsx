import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, ThumbsUp, AlertCircle, TrendingUp, RotateCcw, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useInterviews, Interview, InterviewFeedback } from "@/hooks/useInterviews";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import Agent from "@/components/Agent";

const InterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { getInterview, getFeedback, saveFeedback, updateInterviewStatus } = useInterviews();
  
  const [interview, setInterview] = useState<Interview | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/sign-in");
      return;
    }

    if (id && user) {
      loadInterview();
    }
  }, [id, user, authLoading]);

  const loadInterview = async () => {
    if (!id) return;

    setIsLoading(true);
    const interviewData = await getInterview(id);
    
    if (!interviewData) {
      toast({
        variant: "destructive",
        title: "Interview not found",
        description: "The interview you're looking for doesn't exist.",
      });
      navigate("/dashboard");
      return;
    }

    setInterview(interviewData);

    // Check if feedback already exists
    if (interviewData.status === "completed") {
      const existingFeedback = await getFeedback(id);
      if (existingFeedback) {
        setFeedback(existingFeedback);
        setShowFeedback(true);
      }
    }

    setIsLoading(false);
  };

  const handleInterviewComplete = async (transcript: string) => {
    if (!interview || !id) return;

    setIsGeneratingFeedback(true);

    try {
      // Generate feedback using AI
      const { data, error } = await supabase.functions.invoke('generate-feedback', {
        body: {
          role: interview.role,
          type: interview.type,
          techStack: interview.tech_stack,
          transcript
        }
      });

      if (error) throw error;

      // Save feedback to database
      const savedFeedback = await saveFeedback(id, {
        overallScore: data.overallScore,
        categoryScores: data.categoryScores,
        strengths: data.strengths,
        improvements: data.improvements,
        finalAssessment: data.finalAssessment
      });

      if (savedFeedback) {
        setFeedback(savedFeedback);
        setShowFeedback(true);
        toast({
          title: "Interview Complete!",
          description: "Your feedback is ready.",
        });
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate feedback. Please try again.",
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleRetake = async () => {
    if (!id) return;
    await updateInterviewStatus(id, "in_progress");
    setShowFeedback(false);
    setFeedback(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 border-2 border-primary-200 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !interview) return null;

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "Candidate";

  // Show feedback generation loading
  if (isGeneratingFeedback) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <Loader2 className="size-12 text-primary-200 animate-spin" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing Your Interview</h2>
          <p className="text-muted-foreground">Please wait while we generate your personalized feedback...</p>
        </div>
      </div>
    );
  }

  // Show feedback view
  if (showFeedback && feedback) {
    const categoryScores = feedback.category_scores as Record<string, number>;
    
    return (
      <div className="min-h-screen">
        <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-16 py-6 max-w-7xl mx-auto">
          <Logo />
          <Link to="/dashboard" className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="size-4" />
            <span>Back to Dashboard</span>
          </Link>
        </nav>

        <main className="section-feedback py-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="size-20 rounded-full bg-success-100/20 flex items-center justify-center">
              <ThumbsUp className="size-10 text-success-100" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Interview Complete!</h1>
            <p className="text-muted-foreground max-w-lg">
              Great job completing your {interview.role} interview. Here's your detailed feedback.
            </p>
          </div>

          {/* Overall Score */}
          <div className="card-border w-full">
            <div className="card-content p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <p className="text-muted-foreground">Overall Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold text-primary-200">{feedback.overall_score}</span>
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const rating = feedback.overall_score / 20;
                    return (
                      <Star
                        key={star}
                        className={`size-8 ${
                          star <= Math.floor(rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : star <= rating
                            ? "text-yellow-400 fill-yellow-400/50"
                            : "text-muted-foreground"
                        }`}
                      />
                    );
                  })}
                  <span className="text-xl font-semibold text-foreground ml-2">
                    {(feedback.overall_score / 20).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {Object.entries(categoryScores).map(([name, score]) => (
              <div key={name} className="card-border">
                <div className="card-content p-4 flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{score}%</p>
                  <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                    <div
                      className="progress-bar transition-all duration-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="card-border h-full">
              <div className="card-content p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-success-100" />
                  <h3 className="text-lg font-semibold text-foreground">Strengths</h3>
                </div>
                <ul className="space-y-3">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="size-2 rounded-full bg-success-100 mt-2" />
                      <span className="text-light-100">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card-border h-full">
              <div className="card-content p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-foreground">Areas for Improvement</h3>
                </div>
                <ul className="space-y-3">
                  {feedback.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="size-2 rounded-full bg-yellow-400 mt-2" />
                      <span className="text-light-100">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Final Assessment */}
          {feedback.final_assessment && (
            <div className="card-border w-full">
              <div className="card-content p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Final Assessment</h3>
                <p className="text-light-100">{feedback.final_assessment}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-4">
            <button
              onClick={handleRetake}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw className="size-4" />
              <span>Retake Interview</span>
            </button>
            <Link to="/dashboard" className="btn-primary flex items-center gap-2">
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Show interview view
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-16 py-6 max-w-7xl mx-auto">
        <Logo />
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          <span>Exit</span>
        </button>
      </nav>

      <main className="root-layout relative">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-foreground">{interview.role}</h1>
          <p className="text-muted-foreground">
            Answer the questions naturally. The AI will adapt based on your responses.
          </p>
        </div>

        <Agent 
          userName={userName} 
          type="interview"
          interviewId={interview.id}
          role={interview.role}
          interviewType={interview.type}
          techStack={interview.tech_stack}
          questions={interview.questions}
          onComplete={handleInterviewComplete}
        />
      </main>
    </div>
  );
};

export default InterviewPage;
