import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  filePath?: string;
  submittedAt: string;
}

export function AdminApproval() {
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Mock data for now - will be replaced with real database queries
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setPendingTasks([
        {
          id: "1",
          title: "Website Header Component",
          description: "Create responsive header with navigation menu",
          assignedTo: "vathsal",
          assignedToName: "Vathsal",
          filePath: "header-component.zip",
          submittedAt: new Date().toISOString(),
        },
        {
          id: "2", 
          title: "User Authentication API",
          description: "Implement login/logout functionality",
          assignedTo: "sravan",
          assignedToName: "Sravan", 
          filePath: "auth-api.zip",
          submittedAt: new Date().toISOString(),
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleApprove = async (taskId: string) => {
    try {
      // TODO: Update task status to 'completed' in database
      setPendingTasks(prev => prev.filter(task => task.id !== taskId));
      toast({
        title: "Task Approved",
        description: "The task has been approved and marked as completed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (taskId: string) => {
    try {
      // TODO: Update task status back to 'in_progress' in database
      setPendingTasks(prev => prev.filter(task => task.id !== taskId));
      toast({
        title: "Task Rejected",
        description: "The task has been rejected and sent back for revision.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to reject task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    // TODO: Implement file download from Supabase storage
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}...`,
    });
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading pending approvals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Pending Approvals</h2>
        <Badge variant="secondary" className="bg-warning/10 text-warning">
          {pendingTasks.length} Pending
        </Badge>
      </div>

      {pendingTasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tasks pending approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <Badge className="bg-warning text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Approval
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Submitted by: <strong>{task.assignedToName}</strong></span>
                  <span>On: {new Date(task.submittedAt).toLocaleDateString()}</span>
                </div>

                {task.filePath && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Submission file: {task.filePath}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(task.filePath!, task.filePath!)}
                    >
                      Download
                    </Button>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(task.id)}
                    className="flex-1 bg-success hover:bg-success/90 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(task.id)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}