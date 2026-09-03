create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  secret_value text;
begin
  if not exists (select 1 from vault.secrets where name = 'scheduler_secret') then
    secret_value := gen_random_uuid()::text;
    perform vault.create_secret(secret_value, 'scheduler_secret');
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'send-schedule-notifications') then
    perform cron.schedule(
      'send-schedule-notifications',
      '* * * * *',
      $cron$
      select net.http_post(
        url := 'https://upjgstxbzgvlbleerszj.supabase.co/functions/v1/send-schedule-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-scheduler-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'scheduler_secret'
          )
        ),
        body := '{}'::jsonb
      );
      $cron$
    );
  end if;
end;
$$;
