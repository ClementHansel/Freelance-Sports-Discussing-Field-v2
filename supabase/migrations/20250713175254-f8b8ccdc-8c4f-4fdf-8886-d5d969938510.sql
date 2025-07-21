-- First, you need to log in to your app, then come back and run this query
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users

-- Example of how to grant admin role (run this after logging in):
-- INSERT INTO user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- To help debug, let's see current users:
SELECT * FROM auth.users LIMIT 5;