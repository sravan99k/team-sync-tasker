-- Create a junction table for task assignments to support multiple assignees
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, assigned_to)
);

-- Enable RLS on task_assignments
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for task_assignments
CREATE POLICY "Admins can view all task assignments"
ON public.task_assignments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own task assignments"
ON public.task_assignments 
FOR SELECT 
USING (auth.uid() = assigned_to);

CREATE POLICY "Admins can create task assignments"
ON public.task_assignments 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update task assignments"
ON public.task_assignments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete task assignments"
ON public.task_assignments 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update tasks table policies to work with new assignment model
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;

-- Create new policies for tasks that check via task_assignments
CREATE POLICY "Users can view tasks assigned to them"
ON public.tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.task_assignments 
    WHERE task_id = tasks.id AND assigned_to = auth.uid()
  )
);

CREATE POLICY "Users can update tasks assigned to them"
ON public.tasks 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.task_assignments 
    WHERE task_id = tasks.id AND assigned_to = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.task_assignments 
    WHERE task_id = tasks.id AND assigned_to = auth.uid()
  )
);