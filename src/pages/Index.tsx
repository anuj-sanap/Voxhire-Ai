import { Link } from "react-router-dom";
import { Plus, Sparkles, Target, TrendingUp, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useInterviews } from "@/hooks/useInterviews";
import Logo from "@/components/Logo";
import InterviewCard from "@/components/InterviewCard";

const Index = () => {
  const { user, signOut } = useAuth();
  const { interviews } = useInterviews();

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Guest";
  const isSignedIn = !!user;

  // Show user's recent interviews if signed in, otherwise show samples
  const displayInterviews = isSignedIn 
    ? interviews.slice(0, 3) 
    : [
        {
          id: "sample-1",
          role: "Frontend Developer Interview",
          type: "technical",
          tech_stack: ["React", "TypeScript", "TailwindCSS", "Next.js"],
          created_at: new Date().toISOString(),
          status: "sample"
        },
        {
          id: "sample-2",
          role: "Backend Developer Interview",
          type: "technical",
          tech_stack: ["Node.js", "Python", "PostgreSQL", "Docker"],
          created_at: new Date().toISOString(),
          status: "sample"
        },
        {
          id: "sample-3",
          role: "Behavioral Interview",
          type: "behavioral",
          tech_stack: ["Communication", "Leadership", "Problem Solving"],
          created_at: new Date().toISOString(),
          status: "sample"
        },
      ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-16 py-6 max-w-7xl mx-auto">
        <Logo />
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-primary-200 to-accent flex items-center justify-center">
                  <span className="text-dark-100 font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-foreground font-medium hidden sm:block">{userName}</span>
              </Link>
              <button onClick={signOut} className="btn-secondary p-2.5" title="Sign Out">
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/sign-in" className="btn-secondary">
                Sign In
              </Link>
              <Link to="/sign-up" className="btn-primary hidden sm:block">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="root-layout">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-8 py-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-200/10 border border-primary-200/20">
            <Sparkles className="size-4 text-primary-200" />
            <span className="text-sm text-primary-200 font-medium">AI-Powered Interview Prep</span>
          </div>
          
          <h1 className="max-w-4xl">
            Get Interview-Ready with{" "}
            <span className="bg-gradient-to-r from-primary-200 to-accent bg-clip-text text-transparent">
              AI-Powered
            </span>{" "}
            Practice & Feedback
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl">
            Practice job interviews with our AI voice agent, receive instant feedback, 
            and boost your confidence. Land your dream job with PrepWise.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link 
              to={isSignedIn ? "/interview/new" : "/sign-up"} 
              className="btn-primary flex items-center gap-2 text-base px-8 py-3"
            >
              <Plus className="size-5" />
              <span>Start Interview</span>
            </Link>
            {!isSignedIn && (
              <Link to="/sign-in" className="btn-secondary flex items-center gap-2 text-base px-8 py-3">
                <span>Sign In</span>
              </Link>
            )}
            {isSignedIn && (
              <Link to="/dashboard" className="btn-secondary flex items-center gap-2 text-base px-8 py-3">
                <span>Go to Dashboard</span>
              </Link>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          {[
            {
              icon: Target,
              title: "Role-Specific Prep",
              description: "Tailored questions for your target role and experience level",
            },
            {
              icon: Sparkles,
              title: "AI Voice Agent",
              description: "Practice with realistic AI interviews that adapt to your responses",
            },
            {
              icon: TrendingUp,
              title: "Instant Feedback",
              description: "Get detailed feedback and improvement suggestions after each session",
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="card-border animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="card-content p-6 flex flex-col gap-4">
                <div className="size-12 rounded-xl bg-primary-200/10 flex items-center justify-center">
                  <feature.icon className="size-6 text-primary-200" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>

        {/* CTA Section */}
        <section className="card-cta animate-slide-up">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Ready to ace your next interview?
            </h2>
            <p className="text-muted-foreground">
              Start practicing now and get personalized feedback from our AI interviewer.
            </p>
          </div>
          <Link 
            to={isSignedIn ? "/interview/new" : "/sign-up"} 
            className="btn-primary flex items-center gap-2 text-base px-8 py-3 whitespace-nowrap"
          >
            <Plus className="size-5" />
            <span>Create Interview</span>
          </Link>
        </section>

        {/* Past Interviews */}
        <section className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {isSignedIn ? "Your Recent Interviews" : "Sample Interviews"}
            </h2>
            {isSignedIn && interviews.length > 0 && (
              <Link to="/dashboard" className="text-primary-200 hover:underline text-sm font-medium">
                View all
              </Link>
            )}
          </div>

          <div className="interviews-section">
            {displayInterviews.map((interview, index) => (
              <div
                key={interview.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <InterviewCard
                  id={interview.id}
                  role={interview.role}
                  type={interview.type}
                  techStack={interview.tech_stack}
                  createdAt={interview.created_at}
                  status={interview.status}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-border text-sm text-muted-foreground">
          <Logo />
          <p>© 2024 PrepWise. Built with AI.</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
