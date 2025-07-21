-- Grant admin role to the logged-in user
INSERT INTO user_roles (user_id, role) 
VALUES ('1923058c-49a1-4504-b6ee-f90042403791', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';