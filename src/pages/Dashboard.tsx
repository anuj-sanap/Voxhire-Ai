import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useInterviews } from "@/hooks/useInterviews";
import Logo from "@/components/Logo";
import InterviewCard from "@/components/InterviewCard";

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { interviews, loading: interviewsLoading } = useInterviews();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/sign-in");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 border-2 border-primary-200 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "User";
  const completedInterviews = interviews.filter(i => i.status === "completed");
  const inProgressInterviews = interviews.filter(i => i.status === "in_progress");

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-16 py-6 max-w-7xl mx-auto">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-primary-200 to-accent flex items-center justify-center">
              <span className="text-dark-100 font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-foreground font-medium hidden sm:block">{userName}</span>
          </div>
          <button onClick={handleSignOut} className="btn-secondary flex items-center gap-2">
            <LogOut className="size-4" />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="root-layout">
        {/* Welcome Section */}
        <section className="flex flex-col gap-4 animate-fade-in">
          <h1>Welcome back, {userName}!</h1>
          <p className="text-muted-foreground text-lg">
            Ready to practice? Start a new interview or review your past sessions.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-border">
            <div className="card-content p-6">
              <p className="text-muted-foreground text-sm">Total Interviews</p>
              <p className="text-3xl font-bold text-foreground">{interviews.length}</p>
            </div>
          </div>
          <div className="card-border">
            <div className="card-content p-6">
              <p className="text-muted-foreground text-sm">Completed</p>
              <p className="text-3xl font-bold text-success-100">{completedInterviews.length}</p>
            </div>
          </div>
          <div className="card-border">
            <div className="card-content p-6">
              <p className="text-muted-foreground text-sm">In Progress</p>
              <p className="text-3xl font-bold text-primary-200">{inProgressInterviews.length}</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="card-cta animate-slide-up">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Start a new interview
            </h2>
            <p className="text-muted-foreground">
              Practice makes perfect. Begin a new AI-powered mock interview now.
            </p>
          </div>
          <Link to="/interview/new" className="btn-primary flex items-center gap-2 text-base px-8 py-3 whitespace-nowrap">
            <Plus className="size-5" />
            <span>New Interview</span>
          </Link>
        </section>

        {/* Past Interviews */}
        <section className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Your Interviews</h2>
          </div>

          {interviewsLoading ? (
            <div className="flex justify-center py-12">
              <div className="size-8 border-2 border-primary-200 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No interviews yet. Start your first one!</p>
              <Link to="/interview/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="size-5" />
                <span>Create Interview</span>
              </Link>
            </div>
          ) : (
            <div className="interviews-section">
              {interviews.map((interview, index) => (
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
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
