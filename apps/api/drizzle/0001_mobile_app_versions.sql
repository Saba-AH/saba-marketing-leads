-- La tabla ya existía en Supabase antes de este repo: IF NOT EXISTS la crea en
-- Docker (dev y tests) y es un no-op en Supabase.
CREATE TABLE IF NOT EXISTS "mobile_app_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"latest_version" text NOT NULL,
	"min_supported_version" text,
	"store_url" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mobile_app_versions_platform_check" CHECK ("mobile_app_versions"."platform" = ANY (ARRAY['ios'::text, 'android'::text]))
);
