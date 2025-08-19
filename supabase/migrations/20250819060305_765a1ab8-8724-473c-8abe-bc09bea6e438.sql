-- Add foreign key constraint to link task_assignments.assigned_to to profiles.user_id
ALTER TABLE public.task_assignments 
ADD CONSTRAINT fk_task_assignments_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(user_id) ON DELETE CASCADE;