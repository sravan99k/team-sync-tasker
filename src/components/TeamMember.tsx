import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface TeamMemberProps {
  name: string;
  role: "developer" | "admin";
  activeTasks: number;
  completedTasks: number;
}

export function TeamMember({ name, role, activeTasks, completedTasks }: TeamMemberProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role: string) => {
    return role === "admin" ? "bg-gradient-primary text-white" : "bg-secondary text-secondary-foreground";
  };

  return (
    <Card className="hover:shadow-soft transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground capitalize">{name}</h3>
              <Badge className={getRoleColor(role)}>
                {role}
              </Badge>
            </div>
            
            <div className="flex space-x-4 text-sm text-muted-foreground">
              <span>
                <span className="text-info font-medium">{activeTasks}</span> active
              </span>
              <span>
                <span className="text-success font-medium">{completedTasks}</span> completed
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}