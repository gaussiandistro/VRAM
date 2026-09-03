create or replace function public.upsert_push_subscription(
  p_installation_id uuid,
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription_id uuid;
begin
  insert into public.push_subscriptions (
    installation_id,
    endpoint,
    p256dh,
    auth,
    enabled,
    last_seen_at
  )
  values (
    p_installation_id,
    p_endpoint,
    p_p256dh,
    p_auth,
    true,
    now()
  )
  on conflict (endpoint)
  do update set
    installation_id = excluded.installation_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    enabled = true,
    last_seen_at = now(),
    updated_at = now()
  returning id into v_subscription_id;

  insert into public.notification_preferences (subscription_id)
  values (v_subscription_id)
  on conflict (subscription_id) do nothing;

  return v_subscription_id;
end;
$$;
