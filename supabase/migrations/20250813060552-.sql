-- Insert profiles for the team members
INSERT INTO public.profiles (user_id, email, name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'vathsal@gmail.com', 'Vathsal', 'member'),
('00000000-0000-0000-0000-000000000002', 'nagasri@gmail.com', 'Nagasri', 'member'),
('00000000-0000-0000-0000-000000000003', 'sravan@gmail.com', 'Sravan', 'member'),
('00000000-0000-0000-0000-000000000004', 'lavanya@gmail.com', 'Lavanya', 'member'),
('00000000-0000-0000-0000-000000000005', 'bhavana@gmail.com', 'Bhavana', 'admin')
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role;