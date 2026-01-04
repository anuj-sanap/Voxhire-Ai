import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Code, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useInterviews } from "@/hooks/useInterviews";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import Agent from "@/components/Agent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const interviewTypes = [
  { id: "technical", label: "Technical", icon: Code, description: "Coding & system design questions" },
  { id: "behavioral", label: "Behavioral", icon: MessageSquare, description: "STAR method & soft skills" },
  { id: "mixed", label: "Mixed", icon: Sparkles, description: "Combination of both types" },
];

const experienceLevels = [
  { id: "junior", label: "Junior (0-2 years)" },
  { id: "mid", label: "Mid-level (2-5 years)" },
  { id: "senior", label: "Senior (5+ years)" },
];

const NewInterview = () => {
  const [step, setStep] = useState<"form" | "agent">("form");
  const [role, setRole] = useState("");
  const [techStack, setTechStack] = useState("");
  const [experience, setExperience] = useState("");
  const [selectedType, setSelectedType] = useState("technical");
  const [selectedLevel, setSelectedLevel] = useState("mid");
  const [isLoading, setIsLoading] = useState(false);
  const [currentInterview, setCurrentInterview] = useState<{
    id: string;
    questions: string[];
  } | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { createInterview } = useInterviews();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/sign-in");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate questions using AI
      const { data, error } = await supabase.functions.invoke('generate-interview', {
        body: {
          role,
          type: selectedType,
          level: selectedLevel,
          techStack: techStack.split(',').map(t => t.trim()).filter(Boolean),
          numQuestions: 5
        }
      });

      if (error) throw error;

      const questions = data.questions || [];

      // Create interview in database
      const interview = await createInterview(
        role,
        selectedType,
        selectedLevel,
        techStack.split(',').map(t => t.trim()).filter(Boolean),
        questions
      );

      if (!interview) {
        throw new Error('Failed to create interview');
      }

      setCurrentInterview({
        id: interview.id,
        questions
      });

      toast({
        title: "Interview created!",
        description: "Your AI interviewer is ready. Let's begin!",
      });
      
      setStep("agent");
    } catch (error) {
      console.error('Error creating interview:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create interview. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 border-2 border-primary-200 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "Candidate";

  if (step === "agent" && currentInterview) {
    return (
      <div className="min-h-screen">
        <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-16 py-6 max-w-7xl mx-auto">
          <Logo />
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            <span>Exit Interview</span>
          </button>
        </nav>

        <main className="root-layout relative min-h-[calc(100vh-120px)]">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-foreground">{role} Interview</h1>
            <p className="text-muted-foreground">
              Your AI interviewer will ask questions based on your role and experience level.
            </p>
          </div>

          <Agent 
            userName={userName} 
            type="interview" 
            interviewId={currentInterview.id}
            role={role}
            interviewType={selectedType}
            techStack={techStack.split(',').map(t => t.trim()).filter(Boolean)}
            questions={currentInterview.questions}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-16 py-6 max-w-7xl mx-auto">
        <Logo />
        <Link to="/dashboard" className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </Link>
      </nav>

      <main className="root-layout">
        <div className="max-w-2xl mx-auto w-full animate-fade-in">
          <div className="card-border">
            <div className="card-content p-8 flex flex-col gap-8">
              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="size-12 rounded-xl bg-primary-200/10 flex items-center justify-center mb-2">
                  <Briefcase className="size-6 text-primary-200" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Create New Interview</h2>
                <p className="text-muted-foreground">
                  Tell us about the role you're preparing for and we'll create a personalized interview.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Role */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role" className="text-light-100 font-normal">
                    Target Role
                  </Label>
                  <Input
                    id="role"
                    type="text"
                    placeholder="e.g., Frontend Developer, Product Manager"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                {/* Experience Level */}
                <div className="flex flex-col gap-3">
                  <Label className="text-light-100 font-normal">Experience Level</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {experienceLevels.map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setSelectedLevel(level.id)}
                        className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                          selectedLevel === level.id
                            ? "border-primary-200 bg-primary-200/10"
                            : "border-border bg-dark-200 hover:border-muted"
                        }`}
                      >
                        <p className={`font-medium text-sm ${selectedLevel === level.id ? "text-primary-200" : "text-foreground"}`}>
                          {level.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interview Type */}
                <div className="flex flex-col gap-3">
                  <Label className="text-light-100 font-normal">Interview Type</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {interviewTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                          selectedType === type.id
                            ? "border-primary-200 bg-primary-200/10"
                            : "border-border bg-dark-200 hover:border-muted"
                        }`}
                      >
                        <type.icon
                          className={`size-5 mb-2 ${
                            selectedType === type.id ? "text-primary-200" : "text-muted-foreground"
                          }`}
                        />
                        <p className={`font-medium ${selectedType === type.id ? "text-primary-200" : "text-foreground"}`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="techStack" className="text-light-100 font-normal">
                    Tech Stack / Skills (optional)
                  </Label>
                  <Input
                    id="techStack"
                    type="text"
                    placeholder="e.g., React, TypeScript, Node.js"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    className="form-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple items with commas
                  </p>
                </div>

                {/* Experience */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="experience" className="text-light-100 font-normal">
                    Additional Context (optional)
                  </Label>
                  <Textarea
                    id="experience"
                    placeholder="Tell us about your experience level, specific areas you want to focus on, or any other details..."
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="form-input min-h-24 rounded-2xl py-3"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !role}
                  className="btn-primary w-full flex items-center justify-center gap-2 min-h-12 mt-2"
                >
                  {isLoading ? (
                    <>
                      <div className="size-5 border-2 border-dark-100 border-t-transparent rounded-full animate-spin" />
                      <span>Generating Questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-5" />
                      <span>Generate Interview</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewInterview;
