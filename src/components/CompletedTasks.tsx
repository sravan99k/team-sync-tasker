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
  assignees: { user_id: string; name: string }[];
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
      // Query completed tasks with their assignments
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          due_date,
          file_path,
          approved_by,
          approved_at,
          task_assignments(
            assigned_to,
            profiles(user_id, name)
          ),
          profiles!tasks_approved_by_fkey(name)
        `)
        .eq('status', 'completed');

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching completed tasks:', error);
        return;
      }

      const formattedTasks = data?.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        assignees: task.task_assignments?.map((assignment: any) => ({
          user_id: assignment.assigned_to,
          name: assignment.profiles?.name || ''
        })) || [],
        dueDate: task.due_date || '',
        filePath: task.file_path,
        approvedBy: task.approved_by,
        approvedByName: task.profiles?.name || '',
        approvedAt: task.approved_at,
      })) || [];

      // If not admin, only show user's tasks
      let finalTasks = formattedTasks;
      if (!isAdmin && profile) {
        finalTasks = formattedTasks.filter(task => 
          task.assignees.some(assignee => assignee.user_id === profile.user_id)
        );
      }

      setTasks(finalTasks);
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
                     {task.assignees.length > 0 && (
                       <>
                         <div className="flex -space-x-2">
                           {task.assignees.slice(0, 3).map((assignee) => (
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
                         <span>
                           {task.assignees.length === 1 
                             ? task.assignees[0].name 
                             : `${task.assignees.length} assignees`
                           }
                         </span>
                       </>
                     )}
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