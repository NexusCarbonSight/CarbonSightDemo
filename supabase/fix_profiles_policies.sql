
drop policy if exists profiles_self_read on profiles;
drop policy if exists profiles_self_update on profiles;
drop policy if exists profiles_admin_manage on profiles;
drop policy if exists profiles_self_access on profiles;
drop policy if exists profiles_service_role on profiles;
drop policy if exists profiles_insert_new on profiles;


create policy profiles_self_access on profiles
    for all
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy profiles_service_role on profiles
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

create policy profiles_insert_new on profiles
    for insert
    with check (auth.uid() = id);
