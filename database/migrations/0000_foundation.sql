-- U01/B002 BUILD-005, OPS-01; additive ownership boundaries only.
-- No commerce tables or business fixtures. Compatible with the B001 artifact.
CREATE SCHEMA "iam";
--> statement-breakpoint
CREATE SCHEMA "catalog";
--> statement-breakpoint
CREATE SCHEMA "pricing";
--> statement-breakpoint
CREATE SCHEMA "inventory";
--> statement-breakpoint
CREATE SCHEMA "sales";
--> statement-breakpoint
CREATE SCHEMA "finance";
--> statement-breakpoint
CREATE SCHEMA "fulfillment";
--> statement-breakpoint
CREATE SCHEMA "platform";
--> statement-breakpoint
REVOKE ALL ON SCHEMA public FROM PUBLIC;
--> statement-breakpoint
GRANT USAGE ON SCHEMA drizzle TO commerce_api, commerce_worker;
--> statement-breakpoint
GRANT SELECT ON TABLE drizzle.__drizzle_migrations TO commerce_api, commerce_worker;
