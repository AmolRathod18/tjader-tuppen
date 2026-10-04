DELETE FROM public.admin_profiles
WHERE username = 'newadmin'; // This line deletes any existing admin profile with the username 'newadmin' to avoid conflicts before inserting a new admin profile.  

insert into public.admin_profiles (id, username, email, role)
values (
  'PASTE_AUTH_USER_ID_HERE',// Replace with the actual auth user ID of the new admin
  'newadmin', // Replace with the actual username of the new admin
  'newadmin@example.com', // Replace with the actual email of the new admin
  'admin'
)
on conflict (id) do update
set
  username = excluded.username,
  email = excluded.email,
  role = 'admin';