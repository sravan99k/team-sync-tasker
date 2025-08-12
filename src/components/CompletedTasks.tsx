import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CompletedTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  dueDate: string;
  filePath?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
}

export function CompletedTasks() {
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile, isAdmin } = useAuth();

  useEffect(() => {
    if (profile) {
      fetchCompletedTasks();
    }
  }, [profile, isAdmin]);

  const fetchCompletedTasks = async () => {
    try {
      // TODO: Replace with actual database query once types are updated
      // Mock completed tasks for now
      const mockTasks: CompletedTask[] = [
        {
          id: "1",
          title: "Website Header Component",
          description: "Create responsive header with navigation menu",
          assignedTo: "vathsal",
          assignedToName: "Vathsal",
          dueDate: "2024-08-15",
          filePath: "header-component.zip",
          approvedBy: "bhavana",
          approvedByName: "Bhavana",
          approvedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "User Authentication API", 
          description: "Implement login/logout functionality",
          assignedTo: "sravan",
          assignedToName: "Sravan",
          dueDate: "2024-08-10",
          filePath: "auth-api.zip",
          approvedBy: "bhavana",
          approvedByName: "Bhavana",
          approvedAt: new Date().toISOString(),
        }
      ];

      // Filter tasks based on user role
      const filteredTasks = isAdmin 
        ? mockTasks 
        : mockTasks.filter(task => task.assignedTo === profile?.email?.split('@')[0]);

      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-files')
        .download(filePath);

      if (error) {
        console.error('Error downloading file:', error);
        return;
      }

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading completed tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Completed Tasks</h2>
        <Badge variant="secondary" className="bg-success/10 text-success">
          {tasks.length} Completed
        </Badge>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No completed tasks found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <Badge className="bg-success text-white">Completed</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(task.assignedToName)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{task.assignedToName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {task.dueDate}</span>
                  </div>
                </div>

                {task.approvedAt && (
                  <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                    <p className="text-sm text-success font-medium">
                      Approved by {task.approvedByName} on {new Date(task.approvedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {task.filePath && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Task file available</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(task.filePath!, `${task.title}-submission.zip`)}
                    >
                      Download
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}