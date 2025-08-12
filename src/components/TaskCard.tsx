import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Upload, User, Calendar, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: "todo" | "in-progress" | "pending_approval" | "completed";
  dueDate: string;
  hasFile?: boolean;
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void;
  onFileUpload: (taskId: string, file: File) => void;
  isAdmin?: boolean;
}

const statusColors = {
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-info text-white",
  "pending_approval": "bg-warning text-white",
  completed: "bg-success text-white"
};

const statusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  "pending_approval": "Pending Approval",
  completed: "Completed"
};

export function TaskCard({ task, onStatusChange, onFileUpload, isAdmin }: TaskCardProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(task.id, file);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="group hover:shadow-glow transition-all duration-300 animate-scale-in bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {task.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          </div>
          <Badge className={statusColors[task.status]}>
            {statusLabels[task.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(task.assignedTo)}
              </AvatarFallback>
            </Avatar>
            <span>{task.assignedTo}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{task.dueDate}</span>
          </div>
          {task.hasFile && (
            <div className="flex items-center space-x-1 text-success">
              <CheckCircle className="h-4 w-4" />
              <span>File attached</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 space-x-2">
        {(isAdmin || task.status !== "completed") && (
          <div className="flex space-x-2 w-full">
            {task.status === "todo" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(task.id, "in-progress")}
                className="flex-1"
              >
                Start Task
              </Button>
            )}
            
            {task.status === "in-progress" && (
              <>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileUpload}
                  className="hidden"
                  id={`file-${task.id}`}
                />
                <label
                  htmlFor={`file-${task.id}`}
                  className="flex-1"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <span className="flex items-center space-x-1">
                      <Upload className="h-4 w-4" />
                      <span>Upload ZIP</span>
                    </span>
                  </Button>
                </label>
                <Button
                  size="sm"
                  onClick={() => onStatusChange(task.id, "completed")}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  Complete
                </Button>
              </>
            )}

            {isAdmin && task.status === "completed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(task.id, "in-progress")}
                className="flex-1"
              >
                Reopen Task
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}