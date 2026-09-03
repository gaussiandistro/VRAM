create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'send-schedule-notifications'
  ) then
    perform cron.unschedule('send-schedule-notifications');
  end if;
end;
$$;

select cron.schedule(
  'send-schedule-notifications',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://upjgstxbzgvlbleerszj.supabase.co/functions/v1/send-schedule-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $cron$
);
