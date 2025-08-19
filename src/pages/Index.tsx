import { useState, useEffect } from "react";
import { TaskCard } from "@/components/TaskCard";
import { TeamMember } from "@/components/TeamMember";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { CompletedTasks } from "@/components/CompletedTasks";
import { AdminApproval } from "@/components/AdminApproval";
import { AddTeamMemberDialog } from "@/components/AddTeamMemberDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Users, BarChart3, LogOut, CheckSquare, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to?: string; // Legacy field, kept for compatibility
  assignees: { user_id: string; name: string }[];
  status: "todo" | "in_progress" | "pending_approval" | "completed";
  due_date: string;
  file_path?: string;
  created_by: string;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
}

const Index = () => {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    if (!profile) return;
    
    try {
      setTasksLoading(true);
      
      // Query tasks with their assignments
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          due_date,
          file_path,
          created_by,
          task_assignments(
            assigned_to,
            profiles(user_id, name)
          )
        `)
        .neq('status', 'completed');

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive",
        });
        return;
      }

      let formattedTasks = data?.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        assignees: task.task_assignments?.map((assignment: any) => ({
          user_id: assignment.assigned_to,
          name: assignment.profiles?.name || ''
        })) || [],
        status: task.status as Task['status'],
        due_date: task.due_date || '',
        file_path: task.file_path,
        created_by: task.created_by,
      })) || [];

      // If not admin, only show user's tasks
      if (!isAdmin) {
        formattedTasks = formattedTasks.filter(task => 
          task.assignees.some(assignee => assignee.user_id === profile.user_id)
        );
      }

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching team members:', error);
        return;
      }

      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Fetch data when profile is available
  useEffect(() => {
    if (profile) {
      fetchTasks();
      fetchTeamMembers();
    }
  }, [profile, isAdmin]);

  // Show loading state
  if (isLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user || !profile) {
    return null;
  }

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task status:', error);
        toast({
          title: "Error",
          description: "Failed to update task status",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      const statusDisplay = newStatus === "pending_approval" ? "pending approval" : newStatus.replace('-', ' ');
      toast({
        title: "Task Updated",
        description: `Task status changed to ${statusDisplay}`,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleFileUpload = async (taskId: string, file: File) => {
    try {
      // Upload file to storage
      const fileName = `${taskId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
        return;
      }

      // Update task with file path and status
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          file_path: fileName, 
          status: 'pending_approval' 
        })
        .eq('id', taskId);

      if (updateError) {
        console.error('Error updating task:', updateError);
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { 
            ...task, 
            file_path: fileName, 
            status: "pending_approval" as Task["status"] 
          } : task
        )
      );

      toast({
        title: "File Uploaded",
        description: `${file.name} uploaded successfully. Task pending admin approval.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    assignedTo: string[];
    dueDate: string;
  }) => {
    if (!profile) return;

    try {
      // First create the task with a dummy assigned_to (since it's required in current schema)
      const { data: taskData_result, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          assigned_to: taskData.assignedTo[0], // Use first assignee for legacy field
          due_date: taskData.dueDate,
          created_by: profile.user_id,
          status: 'todo'
        })
        .select('id')
        .single();

      if (taskError) {
        console.error('Error creating task:', taskError);
        toast({
          title: "Error",
          description: "Failed to create task",
          variant: "destructive",
        });
        return;
      }

      // Then create the task assignments
      const assignments = taskData.assignedTo.map(userId => ({
        task_id: taskData_result.id,
        assigned_to: userId
      }));

      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error creating task assignments:', assignmentError);
        toast({
          title: "Error",
          description: "Failed to assign task to members",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      // Refresh tasks
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getTaskStats = (memberUserId: string) => {
    const memberTasks = tasks.filter(task => 
      task.assignees.some(assignee => assignee.user_id === memberUserId)
    );
    return {
      active: memberTasks.filter(task => task.status !== "completed").length,
      completed: 0, // Will be calculated from completed tasks later
    };
  };

  const filteredTasks = (status?: Task["status"]) => {
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  };

  // All tasks are already filtered by user role in fetchTasks
  const userTasks = tasks;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text">IT Project Tracker</h1>
              <p className="text-muted-foreground mt-1">Website Development Team</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-primary border-primary/50">
                {profile.name} • {isAdmin ? "Admin" : "Developer"}
              </Badge>
              {isAdmin && (
                <CreateTaskDialog onCreateTask={handleCreateTask} />
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Active Tasks
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Completed
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="approvals" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Approvals
              </TabsTrigger>
            )}
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            {/* Task Status Filters */}
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-muted text-muted-foreground">
                  To Do: {filteredTasks("todo").length}
                </Badge>
                <Badge className="bg-info text-white">
                  In Progress: {filteredTasks("in_progress").length}
                </Badge>
                <Badge className="bg-warning text-white">
                  Pending Approval: {filteredTasks("pending_approval").length}
                </Badge>
              </div>
            </div>

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onFileUpload={handleFileUpload}
                  isAdmin={isAdmin}
                />
              ))}
            </div>

            {userTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {isAdmin ? "No active tasks to display." : "You have no active tasks assigned."}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <CompletedTasks />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="approvals">
              <AdminApproval />
            </TabsContent>
          )}

          <TabsContent value="team" className="space-y-6">
            {isAdmin && (
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Team Members</h2>
                <AddTeamMemberDialog onMemberAdded={fetchTeamMembers} />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => {
                const stats = getTaskStats(member.user_id);
                return (
                  <TeamMember
                    key={member.user_id}
                    name={member.name}
                    role={member.role === 'admin' ? 'admin' : 'developer'}
                    activeTasks={stats.active}
                    completedTasks={stats.completed}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-primary rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Total Tasks</h3>
                <p className="text-3xl font-bold">{tasks.length}</p>
              </div>
              
              <div className="bg-gradient-secondary rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Completed</h3>
                <p className="text-3xl font-bold">{filteredTasks("completed").length}</p>
              </div>
              
              <div className="bg-card border border-border/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-foreground">Team Members</h3>
                <p className="text-3xl font-bold text-primary">{teamMembers.length}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;