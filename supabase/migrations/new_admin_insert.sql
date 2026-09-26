insert into public.admin_profiles (id, username, email, role)
values (
  'PASTE_AUTH_USER_ID_HERE',// Replace with the actual auth user ID of the new admin
  'newadmin',
  'newadmin@example.com', // Replace with the actual email of the new admin
  'admin'
)
on conflict (id) do update
set
  username = excluded.username,
  email = excluded.email,
  role = 'admin';