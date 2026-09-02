import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const supabaseUrl = requiredEnv("SUPABASE_URL");
const serviceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  (() => {
    const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (!keys) throw new Error("Missing Supabase secret key");
    const parsed = JSON.parse(keys);
    return parsed.default;
  })();
const vapidSubject = requiredEnv("VAPID_SUBJECT");
const vapidPublicKey = requiredEnv("VAPID_PUBLIC_KEY");
const vapidPrivateKey = requiredEnv("VAPID_PRIVATE_KEY");
const schedulerSecret = requiredEnv("SCHEDULER_SECRET");
const schoolTimezone = Deno.env.get("SCHOOL_TIMEZONE") ?? "America/New_York";

const supabase = createClient(supabaseUrl, serviceRoleKey);

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const WEEKLY_SCHEDULE: Record<number, string | null> = {
  0: null,
  1: "Blue",
  2: "White",
  3: "RAM",
  4: "Blue",
  5: "White",
  6: null,
};

const UPCOMING_SECONDS = 120;
const DELIVERY_WINDOW_SECONDS = 90;

type ScheduleBlock = {
  block_id: string;
  name: string;
  kind: "period" | "passing" | "lunch";
  start_time: string;
  end_time: string;
  sort_order: number;
};

type Subscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  enabled: boolean;
  notification_preferences: {
    period_end: boolean;
    lunch_end: boolean;
    upcoming: boolean;
    enabled: boolean;
  } | null;
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function secondsFromTime(time: string) {
  const [hours, minutes, seconds = 0] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: schoolTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function weekday(date: Date) {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: schoolTimezone,
    weekday: "short",
  }).format(date);

  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}

function secondsIntoSchoolDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: schoolTimezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])
  );

  return values.hour * 3600 + values.minute * 60 + values.second;
}

async function getScheduleName(date: Date) {
  const { data, error } = await supabase
    .from("calendar_dates")
    .select("is_school_day, schedule_type:schedule_types(name)")
    .eq("date", dateKey(date))
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    if (!data.is_school_day) {
      return null;
    }

    const schedule = Array.isArray(data.schedule_type) ? data.schedule_type[0] : data.schedule_type;

    return schedule?.name ?? null;
  }

  return WEEKLY_SCHEDULE[weekday(date)] ?? null;
}

async function getBlocks(scheduleName: string) {
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select(
      `block_id, name, kind, start_time, end_time, sort_order,
       schedule_types!inner(name)`
    )
    .eq("schedule_types.name", scheduleName)
    .order("sort_order");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    block_id: row.block_id,
    name: row.name,
    kind: row.kind,
    start_time: row.start_time,
    end_time: row.end_time,
    sort_order: row.sort_order,
  })) as ScheduleBlock[];
}

function eventKey(date: string, scheduleName: string, block: ScheduleBlock, eventType: string) {
  return `${date}:${scheduleName}:${block.block_id}:${eventType}`;
}

async function claimDelivery(subscriptionId: string, key: string) {
  const { data, error } = await supabase
    .from("notification_deliveries")
    .insert({
      subscription_id: subscriptionId,
      event_key: key,
      status: "claimed",
    })
    .select("id")
    .maybeSingle();

  if (error && error.code !== "23505") {
    throw error;
  }

  return Boolean(data);
}

async function finishDelivery(
  subscriptionId: string,
  key: string,
  status: "sent" | "failed",
  errorMessage?: string
) {
  const { error } = await supabase
    .from("notification_deliveries")
    .update({
      status,
      error_message: errorMessage ?? null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("subscription_id", subscriptionId)
    .eq("event_key", key);

  if (error) {
    throw error;
  }
}

async function disableSubscription(subscriptionId: string) {
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ enabled: false })
    .eq("id", subscriptionId);

  if (error) {
    throw error;
  }
}

function isExpiredSubscriptionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /\b(404|410)\b/.test(message);
}

async function sendPush(subscription: Subscription, payload: unknown) {
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload),
    {
      TTL: 300,
      urgency: "high",
    }
  );
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (request.headers.get("x-scheduler-secret") !== schedulerSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const now = new Date();
    const today = dateKey(now);
    const nowSeconds = secondsIntoSchoolDay(now);
    const scheduleName = await getScheduleName(now);

    if (!scheduleName) {
      return json({ sent: 0, reason: "no-school", date: today });
    }

    const blocks = await getBlocks(scheduleName);
    const dueEvents = blocks.flatMap((block) => {
      if (block.kind === "passing") {
        return [];
      }

      const secondsUntilEnd = secondsFromTime(block.end_time) - nowSeconds;
      const events: Array<{
        block: ScheduleBlock;
        type: "period_end" | "lunch_end" | "upcoming";
        body: string;
      }> = [];

      if (secondsUntilEnd >= -DELIVERY_WINDOW_SECONDS && secondsUntilEnd <= 0) {
        events.push({
          block,
          type: block.kind === "lunch" ? "lunch_end" : "period_end",
          body: `${block.name} ended.`,
        });
      }

      if (secondsUntilEnd > 0 && secondsUntilEnd <= UPCOMING_SECONDS) {
        events.push({
          block,
          type: "upcoming",
          body: `${block.name} ends in 2 minutes.`,
        });
      }

      return events;
    });

    if (dueEvents.length === 0) {
      return json({ sent: 0, reason: "no-due-events", date: today });
    }

    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select(
        `id, endpoint, p256dh, auth, enabled,
         notification_preferences(period_end, lunch_end, upcoming, enabled)`
      )
      .eq("enabled", true);

    if (subscriptionError) {
      throw subscriptionError;
    }

    let sent = 0;

    for (const subscription of (subscriptions ?? []) as Subscription[]) {
      const preferences = subscription.notification_preferences;

      if (!preferences?.enabled) {
        continue;
      }

      for (const event of dueEvents) {
        const allowed =
          event.type === "upcoming"
            ? preferences.upcoming
            : event.type === "lunch_end"
              ? preferences.lunch_end
              : preferences.period_end;

        if (!allowed) {
          continue;
        }

        const key = eventKey(today, scheduleName, event.block, event.type);

        if (!(await claimDelivery(subscription.id, key))) {
          continue;
        }

        try {
          await sendPush(subscription, {
            title:
              event.type === "upcoming"
                ? event.block.name
                : event.type === "lunch_end"
                  ? "Lunch ended"
                  : "Period ended",
            body: event.body,
            tag: `vram-${key}`,
            url: "/",
          });

          await finishDelivery(subscription.id, key, "sent");
          sent += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await finishDelivery(subscription.id, key, "failed", message);

          if (isExpiredSubscriptionError(error)) {
            await disableSubscription(subscription.id);
          }
        }
      }
    }

    return json({
      sent,
      events: dueEvents.length,
      schedule: scheduleName,
      date: today,
    });
  } catch (error) {
    console.error(error);

    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
