import { useState, useEffect } from "react";
import { TaskCard } from "@/components/TaskCard";
import { TeamMember } from "@/components/TeamMember";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { CompletedTasks } from "@/components/CompletedTasks";
import { AdminApproval } from "@/components/AdminApproval";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Users, BarChart3, LogOut, CheckSquare, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: "todo" | "in-progress" | "pending_approval" | "completed";
  dueDate: string;
  hasFile?: boolean;
}

const teamMembers = [
  { name: "vathsal", role: "developer" as const },
  { name: "nagasri", role: "developer" as const },
  { name: "sravan", role: "developer" as const },
  { name: "lavanya", role: "developer" as const },
  { name: "bhavana", role: "admin" as const },
];

const Index = () => {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initial mock tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Frontend UI Components",
      description: "Create reusable UI components for the website dashboard",
      assignedTo: "vathsal",
      status: "in-progress",
      dueDate: "2024-12-20",
    },
    {
      id: "2", 
      title: "Backend API Development",
      description: "Develop REST APIs for user authentication and data management",
      assignedTo: "nagasri",
      status: "todo",
      dueDate: "2024-12-22",
    },
    {
      id: "3",
      title: "Database Schema Design",
      description: "Design and implement the database schema for the application",
      assignedTo: "sravan", 
      status: "pending_approval",
      dueDate: "2024-12-15",
      hasFile: true,
    },
    {
      id: "4",
      title: "Responsive Design Implementation",
      description: "Ensure the website works seamlessly across all devices",
      assignedTo: "lavanya",
      status: "todo",
      dueDate: "2024-12-25",
    },
  ]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
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

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
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
  };

  const handleFileUpload = (taskId: string, file: File) => {
    // When user uploads file, set status to pending approval
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { 
          ...task, 
          hasFile: true, 
          status: "pending_approval" as Task["status"] 
        } : task
      )
    );

    toast({
      title: "File Uploaded",
      description: `${file.name} uploaded successfully. Task pending admin approval.`,
    });
  };

  const handleCreateTask = (taskData: {
    title: string;
    description: string;
    assignedTo: string;
    dueDate: string;
  }) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...taskData,
      status: "todo",
    };
    
    setTasks(prev => [...prev, newTask]);
    
    toast({
      title: "Task Created",
      description: `New task assigned to ${taskData.assignedTo}`,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getTaskStats = (memberName: string) => {
    const memberTasks = tasks.filter(task => task.assignedTo === memberName);
    return {
      active: memberTasks.filter(task => task.status !== "completed").length,
      completed: memberTasks.filter(task => task.status === "completed").length,
    };
  };

  const filteredTasks = (status?: Task["status"]) => {
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  };

  // Filter tasks based on user role
  const userTasks = isAdmin 
    ? tasks.filter(task => task.status !== "completed") // Admin sees all non-completed
    : tasks.filter(task => 
        task.assignedTo === profile.email?.split('@')[0] && task.status !== "completed"
      ); // Members see only their non-completed tasks

  const tabCount = isAdmin ? 5 : 4; // Admin has extra tab for approvals

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
          <TabsList className={`grid w-full grid-cols-${tabCount}`}>
            <TabsTrigger value="tasks">
              <BarChart3 className="h-4 w-4 mr-2" />
              Active Tasks
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckSquare className="h-4 w-4 mr-2" />
              Completed
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="approvals">
                <Clock className="h-4 w-4 mr-2" />
                Approvals
              </TabsTrigger>
            )}
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="overview">
              <Settings className="h-4 w-4 mr-2" />
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
                  In Progress: {filteredTasks("in-progress").length}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => {
                const stats = getTaskStats(member.name);
                return (
                  <TeamMember
                    key={member.name}
                    name={member.name}
                    role={member.role}
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