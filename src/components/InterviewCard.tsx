import { Link } from "react-router-dom";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TechIcons from "./TechIcons";

interface InterviewCardProps {
  id: string;
  role: string;
  type: string;
  techStack: string[];
  createdAt: string;
  coverImage?: string;
  status?: string;
}

const InterviewCard = ({
  id,
  role,
  type,
  techStack,
  createdAt,
  coverImage,
  status,
}: InterviewCardProps) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="card-border group">
      <div className="card-interview">
        {/* Cover Image */}
        <div className="relative h-32 -mx-6 -mt-6 overflow-hidden rounded-t-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: coverImage
                ? `url(${coverImage})`
                : "linear-gradient(135deg, hsl(var(--primary-200) / 0.2), hsl(var(--accent) / 0.1))",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          
          {/* Type Badge */}
          <Badge
            variant={type === "technical" ? "default" : "secondary"}
            className="absolute top-4 right-4 capitalize"
          >
            {type}
          </Badge>
          
          {/* Status Badge */}
          {status && (
            <Badge
              variant={status === "completed" ? "default" : "outline"}
              className={`absolute top-4 left-4 capitalize ${
                status === "completed" 
                  ? "bg-[hsl(var(--success-100))] text-white" 
                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              }`}
            >
              {status === "completed" ? "Completed" : "In Progress"}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 flex-1">
          <h3 className="text-xl font-semibold text-foreground line-clamp-2 group-hover:text-primary-200 transition-colors duration-300">
            {role}
          </h3>

          {/* Tech Stack */}
          <TechIcons techStack={techStack} />

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              <span>{formatDate(createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4" />
              <span>30 min</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <Link
          to={`/interview/${id}`}
          className="btn-primary flex items-center justify-center gap-2 w-full mt-2"
        >
          <span>{status === "completed" ? "View Feedback" : "Continue"}</span>
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
};

export default InterviewCard;
