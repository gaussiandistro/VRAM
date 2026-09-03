SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notification_preferences"("p_subscription_id" "uuid", "p_enabled" boolean, "p_period_end" boolean, "p_lunch_end" boolean, "p_upcoming" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.push_subscriptions
  set
    enabled = p_enabled,
    updated_at = now()
  where id = p_subscription_id;

  update public.notification_preferences
  set
    enabled = p_enabled,
    period_end = p_period_end,
    lunch_end = p_lunch_end,
    upcoming = p_upcoming,
    updated_at = now()
  where subscription_id = p_subscription_id;
end;
$$;


ALTER FUNCTION "public"."update_notification_preferences"("p_subscription_id" "uuid", "p_enabled" boolean, "p_period_end" boolean, "p_lunch_end" boolean, "p_upcoming" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_push_subscription"("p_installation_id" "uuid", "p_endpoint" "text", "p_p256dh" "text", "p_auth" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  subscription_id uuid;
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
  returning id into subscription_id;

  insert into public.notification_preferences (subscription_id)
  values (subscription_id)
  on conflict (subscription_id) do nothing;

  return subscription_id;
end;
$$;


ALTER FUNCTION "public"."upsert_push_subscription"("p_installation_id" "uuid", "p_endpoint" "text", "p_p256dh" "text", "p_auth" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."calendar_dates" (
    "date" "date" NOT NULL,
    "schedule_type_id" "uuid",
    "is_school_day" boolean NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "calendar_dates_check" CHECK (((("is_school_day" = true) AND ("schedule_type_id" IS NOT NULL)) OR (("is_school_day" = false) AND ("schedule_type_id" IS NULL))))
);


ALTER TABLE "public"."calendar_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "event_key" "text" NOT NULL,
    "status" "text" NOT NULL,
    "error_message" "text",
    "claimed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sent_at" timestamp with time zone,
    CONSTRAINT "notification_deliveries_status_check" CHECK (("status" = ANY (ARRAY['claimed'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."notification_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "subscription_id" "uuid" NOT NULL,
    "period_end" boolean DEFAULT true NOT NULL,
    "lunch_end" boolean DEFAULT true NOT NULL,
    "upcoming" boolean DEFAULT true NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "installation_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_type_id" "uuid" NOT NULL,
    "block_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "sort_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "schedule_blocks_check" CHECK (("end_time" > "start_time")),
    CONSTRAINT "schedule_blocks_kind_check" CHECK (("kind" = ANY (ARRAY['period'::"text", 'passing'::"text", 'lunch'::"text"])))
);


ALTER TABLE "public"."schedule_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."schedule_types" OWNER TO "postgres";


ALTER TABLE ONLY "public"."calendar_dates"
    ADD CONSTRAINT "calendar_dates_pkey" PRIMARY KEY ("date");



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_subscription_id_event_key_key" UNIQUE ("subscription_id", "event_key");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("subscription_id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_blocks"
    ADD CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_blocks"
    ADD CONSTRAINT "schedule_blocks_schedule_type_id_block_id_key" UNIQUE ("schedule_type_id", "block_id");



ALTER TABLE ONLY "public"."schedule_blocks"
    ADD CONSTRAINT "schedule_blocks_schedule_type_id_sort_order_key" UNIQUE ("schedule_type_id", "sort_order");



ALTER TABLE ONLY "public"."schedule_types"
    ADD CONSTRAINT "schedule_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."schedule_types"
    ADD CONSTRAINT "schedule_types_pkey" PRIMARY KEY ("id");



CREATE INDEX "notification_deliveries_event_key_idx" ON "public"."notification_deliveries" USING "btree" ("event_key");



CREATE INDEX "push_subscriptions_installation_id_idx" ON "public"."push_subscriptions" USING "btree" ("installation_id");



CREATE OR REPLACE TRIGGER "notification_preferences_set_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "push_subscriptions_set_updated_at" BEFORE UPDATE ON "public"."push_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."calendar_dates"
    ADD CONSTRAINT "calendar_dates_schedule_type_id_fkey" FOREIGN KEY ("schedule_type_id") REFERENCES "public"."schedule_types"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_blocks"
    ADD CONSTRAINT "schedule_blocks_schedule_type_id_fkey" FOREIGN KEY ("schedule_type_id") REFERENCES "public"."schedule_types"("id") ON DELETE CASCADE;



CREATE POLICY "Public can read active schedule types" ON "public"."schedule_types" FOR SELECT TO "authenticated", "anon" USING (("active" = true));



CREATE POLICY "Public can read calendar dates" ON "public"."calendar_dates" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can read schedule blocks" ON "public"."schedule_blocks" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."schedule_types" "st"
  WHERE (("st"."id" = "schedule_blocks"."schedule_type_id") AND ("st"."active" = true)))));



ALTER TABLE "public"."calendar_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read calendar_dates" ON "public"."calendar_dates" FOR SELECT TO "anon" USING (true);



CREATE POLICY "public read schedule_blocks" ON "public"."schedule_blocks" FOR SELECT TO "anon" USING (true);



CREATE POLICY "public read schedule_types" ON "public"."schedule_types" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_types" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."calendar_dates" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."calendar_dates" TO "authenticated";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."calendar_dates" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notification_deliveries" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notification_deliveries" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notification_deliveries" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notification_preferences" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notification_preferences" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."push_subscriptions" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."schedule_blocks" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."schedule_blocks" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."schedule_blocks" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."schedule_types" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."schedule_types" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."schedule_types" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";































drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";

drop policy "Public can read calendar dates" on "public"."calendar_dates";

drop policy "Public can read schedule blocks" on "public"."schedule_blocks";

drop policy "Public can read active schedule types" on "public"."schedule_types";

revoke delete on table "public"."calendar_dates" from "anon";

revoke insert on table "public"."calendar_dates" from "anon";

revoke update on table "public"."calendar_dates" from "anon";

revoke delete on table "public"."calendar_dates" from "authenticated";

revoke insert on table "public"."calendar_dates" from "authenticated";

revoke select on table "public"."calendar_dates" from "authenticated";

revoke update on table "public"."calendar_dates" from "authenticated";

revoke delete on table "public"."calendar_dates" from "service_role";

revoke insert on table "public"."calendar_dates" from "service_role";

revoke update on table "public"."calendar_dates" from "service_role";

revoke delete on table "public"."notification_deliveries" from "anon";

revoke insert on table "public"."notification_deliveries" from "anon";

revoke select on table "public"."notification_deliveries" from "anon";

revoke update on table "public"."notification_deliveries" from "anon";

revoke delete on table "public"."notification_deliveries" from "authenticated";

revoke insert on table "public"."notification_deliveries" from "authenticated";

revoke select on table "public"."notification_deliveries" from "authenticated";

revoke update on table "public"."notification_deliveries" from "authenticated";

revoke delete on table "public"."notification_deliveries" from "service_role";

revoke insert on table "public"."notification_deliveries" from "service_role";

revoke select on table "public"."notification_deliveries" from "service_role";

revoke update on table "public"."notification_deliveries" from "service_role";

revoke delete on table "public"."notification_preferences" from "anon";

revoke insert on table "public"."notification_preferences" from "anon";

revoke select on table "public"."notification_preferences" from "anon";

revoke update on table "public"."notification_preferences" from "anon";

revoke delete on table "public"."notification_preferences" from "authenticated";

revoke insert on table "public"."notification_preferences" from "authenticated";

revoke select on table "public"."notification_preferences" from "authenticated";

revoke update on table "public"."notification_preferences" from "authenticated";

revoke delete on table "public"."notification_preferences" from "service_role";

revoke insert on table "public"."notification_preferences" from "service_role";

revoke select on table "public"."notification_preferences" from "service_role";

revoke update on table "public"."notification_preferences" from "service_role";

revoke delete on table "public"."push_subscriptions" from "anon";

revoke insert on table "public"."push_subscriptions" from "anon";

revoke select on table "public"."push_subscriptions" from "anon";

revoke update on table "public"."push_subscriptions" from "anon";

revoke delete on table "public"."push_subscriptions" from "authenticated";

revoke insert on table "public"."push_subscriptions" from "authenticated";

revoke select on table "public"."push_subscriptions" from "authenticated";

revoke update on table "public"."push_subscriptions" from "authenticated";

revoke delete on table "public"."push_subscriptions" from "service_role";

revoke insert on table "public"."push_subscriptions" from "service_role";

revoke select on table "public"."push_subscriptions" from "service_role";

revoke update on table "public"."push_subscriptions" from "service_role";

revoke delete on table "public"."schedule_blocks" from "anon";

revoke insert on table "public"."schedule_blocks" from "anon";

revoke update on table "public"."schedule_blocks" from "anon";

revoke delete on table "public"."schedule_blocks" from "authenticated";

revoke insert on table "public"."schedule_blocks" from "authenticated";

revoke select on table "public"."schedule_blocks" from "authenticated";

revoke update on table "public"."schedule_blocks" from "authenticated";

revoke delete on table "public"."schedule_blocks" from "service_role";

revoke insert on table "public"."schedule_blocks" from "service_role";

revoke select on table "public"."schedule_blocks" from "service_role";

revoke update on table "public"."schedule_blocks" from "service_role";

revoke delete on table "public"."schedule_types" from "anon";

revoke insert on table "public"."schedule_types" from "anon";

revoke update on table "public"."schedule_types" from "anon";

revoke delete on table "public"."schedule_types" from "authenticated";

revoke insert on table "public"."schedule_types" from "authenticated";

revoke select on table "public"."schedule_types" from "authenticated";

revoke update on table "public"."schedule_types" from "authenticated";

revoke delete on table "public"."schedule_types" from "service_role";

revoke insert on table "public"."schedule_types" from "service_role";

revoke update on table "public"."schedule_types" from "service_role";


  create policy "Public can read calendar dates"
  on "public"."calendar_dates"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public can read schedule blocks"
  on "public"."schedule_blocks"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.schedule_types st
  WHERE ((st.id = schedule_blocks.schedule_type_id) AND (st.active = true)))));



  create policy "Public can read active schedule types"
  on "public"."schedule_types"
  as permissive
  for select
  to anon, authenticated
using ((active = true));
