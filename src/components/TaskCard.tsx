import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Upload, User, Calendar, CheckCircle, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to?: string; // Legacy field, kept for compatibility
  assignees: { user_id: string; name: string }[];
  status: "todo" | "in_progress" | "pending_approval" | "completed";
  due_date: string;
  file_path?: string;
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void;
  onFileUpload: (taskId: string, file: File) => void;
  isAdmin?: boolean;
}

const statusColors = {
  todo: "bg-muted text-muted-foreground",
  "in_progress": "bg-info text-white",
  "pending_approval": "bg-warning text-white",
  completed: "bg-success text-white"
};

const statusLabels = {
  todo: "To Do",
  "in_progress": "In Progress",
  "pending_approval": "Pending Approval",
  completed: "Completed"
};

export function TaskCard({ task, onStatusChange, onFileUpload, isAdmin }: TaskCardProps) {
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(task.id, file);
    }
  };

  const downloadFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-files')
        .download(filePath);

      if (error) {
        console.error('Error downloading file:', error);
        toast({
          title: "Error",
          description: "Failed to download file",
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "File download started successfully.",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const renderAssignees = () => {
    if (task.assignees.length === 0) return null;
    
    if (task.assignees.length === 1) {
      const assignee = task.assignees[0];
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(assignee.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{assignee.name}</span>
        </div>
      );
    }
    
    // Multiple assignees
    return (
      <div className="flex items-center space-x-2">
        <div className="flex -space-x-2">
          {task.assignees.slice(0, 3).map((assignee, index) => (
            <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(assignee.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {task.assignees.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-xs text-muted-foreground">+{task.assignees.length - 3}</span>
            </div>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {task.assignees.length} assignees
        </span>
      </div>
    );
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
          {renderAssignees()}
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Due: {task.due_date}</span>
          </div>
          {task.file_path && (
            <div className="flex items-center space-x-1 text-success">
              <CheckCircle className="h-4 w-4" />
              <span>File attached</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => downloadFile(task.file_path!)}
                className="h-auto p-1 text-success hover:text-success/80"
              >
                <Download className="h-3 w-3" />
              </Button>
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
                onClick={() => onStatusChange(task.id, "in_progress")}
                className="flex-1"
              >
                Start Task
              </Button>
            )}
            
            {task.status === "in_progress" && (
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
                onClick={() => onStatusChange(task.id, "in_progress")}
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