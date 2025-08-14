-- Create profile for existing user who doesn't have one
INSERT INTO public.profiles (user_id, email, name, role) 
VALUES ('749671e2-60aa-4b9f-a5ea-f85341a72458', 'sravan@gmail.com', 'Sravan', 'member')
ON CONFLICT (user_id) DO NOTHING;