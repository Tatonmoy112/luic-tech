-- U03/B004 BUILD-009..013. Additive local catalog and reliability storage.
CREATE EXTENSION btree_gist WITH SCHEMA catalog;
SET LOCAL search_path = pg_catalog, catalog;
CREATE TABLE catalog.brands (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug varchar(160) NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name varchar(100) NOT NULL CHECK(length(btrim(name))>0), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')), archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE TABLE catalog.categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), parent_id uuid REFERENCES catalog.categories(id),
 slug varchar(160) NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), name varchar(100) NOT NULL CHECK(length(btrim(name))>0), description varchar(1000),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')), sort_order integer NOT NULL DEFAULT 0,
 published_at timestamptz, archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), CHECK(parent_id IS DISTINCT FROM id)
);
CREATE INDEX categories_parent ON catalog.categories(parent_id);
-- Hierarchy is immutable after creation in this slice; new nodes can only point to an existing parent.
CREATE FUNCTION catalog.guard_category_parent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM catalog.categories WHERE id=NEW.parent_id) THEN RAISE EXCEPTION 'Existing category parent required' USING ERRCODE='23503'; END IF;
 ELSIF NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN RAISE EXCEPTION 'Category reparenting requires reviewed workflow' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER category_parent BEFORE INSERT OR UPDATE ON catalog.categories FOR EACH ROW EXECUTE FUNCTION catalog.guard_category_parent();
CREATE TABLE catalog.products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), brand_id uuid REFERENCES catalog.brands(id),
 slug varchar(160) NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), title varchar(200) NOT NULL CHECK(length(btrim(title))>0),
 short_description varchar(1000), description varchar(20000), status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 published_at timestamptz, archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE INDEX products_status_id ON catalog.products(status,id);
CREATE INDEX products_brand ON catalog.products(brand_id);
CREATE TABLE catalog.product_categories (
 product_id uuid NOT NULL REFERENCES catalog.products(id), category_id uuid NOT NULL REFERENCES catalog.categories(id),
 is_primary boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0, assigned_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(product_id,category_id)
);
CREATE UNIQUE INDEX product_primary_category ON catalog.product_categories(product_id) WHERE is_primary;
CREATE INDEX product_categories_category ON catalog.product_categories(category_id,product_id);
CREATE TABLE catalog.attributes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(64) NOT NULL UNIQUE CHECK(code ~ '^[a-z][a-z0-9_]*$'), name varchar(100) NOT NULL,
 selection_mode text NOT NULL DEFAULT 'single' CHECK(selection_mode='single'), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
 sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE TABLE catalog.attribute_values (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attribute_id uuid NOT NULL REFERENCES catalog.attributes(id), code varchar(64) NOT NULL,
 display_value varchar(100) NOT NULL, sort_order integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(attribute_id,code), UNIQUE(attribute_id,id)
);
CREATE TABLE catalog.product_variants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES catalog.products(id),
 sku varchar(64) NOT NULL CHECK(sku ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'), sku_normalized text GENERATED ALWAYS AS (upper(sku COLLATE "C")) STORED UNIQUE,
 barcode varchar(64), title varchar(200) NOT NULL CHECK(length(btrim(title))>0), status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 track_inventory boolean NOT NULL DEFAULT true CHECK(track_inventory), max_order_quantity integer CHECK(max_order_quantity BETWEEN 1 AND 20), weight_grams integer CHECK(weight_grams>0),
 published_at timestamptz, archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(product_id,id)
);
CREATE INDEX variants_product ON catalog.product_variants(product_id,id);
CREATE FUNCTION catalog.guard_variant_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW.id,NEW.product_id,NEW.sku) IS DISTINCT FROM ROW(OLD.id,OLD.product_id,OLD.sku) THEN RAISE EXCEPTION 'Variant identity immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER variant_identity BEFORE UPDATE ON catalog.product_variants FOR EACH ROW EXECUTE FUNCTION catalog.guard_variant_identity();
CREATE TABLE catalog.variant_attribute_values (
 variant_id uuid NOT NULL REFERENCES catalog.product_variants(id), attribute_id uuid NOT NULL REFERENCES catalog.attributes(id), attribute_value_id uuid NOT NULL,
 assigned_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(variant_id,attribute_id),
 FOREIGN KEY(attribute_id,attribute_value_id) REFERENCES catalog.attribute_values(attribute_id,id)
);
CREATE INDEX variant_values_value ON catalog.variant_attribute_values(attribute_id,attribute_value_id);
CREATE TABLE catalog.price_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), variant_id uuid NOT NULL REFERENCES catalog.product_variants(id), currency text NOT NULL CHECK(currency='BDT'),
 channel text NOT NULL DEFAULT 'web' CHECK(channel='web'), unit_price_minor bigint NOT NULL CHECK(unit_price_minor>0), compare_at_minor bigint CHECK(compare_at_minor>=unit_price_minor),
 valid_from timestamptz NOT NULL CHECK(isfinite(valid_from)), valid_to timestamptz CHECK(isfinite(valid_to)), reason varchar(200) NOT NULL,
 created_by_staff_id uuid NOT NULL REFERENCES iam.staff_accounts(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), CHECK(valid_to IS NULL OR valid_to>valid_from),
 EXCLUDE USING gist (variant_id WITH =, currency WITH =, channel WITH =, tstzrange(valid_from,valid_to,'[)') WITH &&)
);
CREATE INDEX prices_variant_time ON catalog.price_records(variant_id,valid_from);
CREATE INDEX prices_actor ON catalog.price_records(created_by_staff_id);
-- Historical amount/identity cannot be edited; closing an open/future interval is a separate versioned command.
CREATE FUNCTION catalog.guard_price_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW.id,NEW.variant_id,NEW.currency,NEW.channel,NEW.unit_price_minor,NEW.compare_at_minor,NEW.valid_from,NEW.reason,NEW.created_by_staff_id,NEW.created_at)
 IS DISTINCT FROM ROW(OLD.id,OLD.variant_id,OLD.currency,OLD.channel,OLD.unit_price_minor,OLD.compare_at_minor,OLD.valid_from,OLD.reason,OLD.created_by_staff_id,OLD.created_at)
 OR (OLD.valid_to IS NOT NULL AND OLD.valid_to<=clock_timestamp()) OR NEW.valid_to IS NULL OR NEW.valid_to<=clock_timestamp()
 OR (OLD.valid_to IS NOT NULL AND NEW.valid_to>OLD.valid_to) THEN
 RAISE EXCEPTION 'Immutable price facts' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER price_history BEFORE UPDATE ON catalog.price_records FOR EACH ROW EXECUTE FUNCTION catalog.guard_price_history();
CREATE TABLE catalog.media_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), storage_class text NOT NULL CHECK(storage_class='synthetic-local'), object_key varchar(200) NOT NULL,
 content_sha256 text NOT NULL CHECK(content_sha256 ~ '^[0-9a-f]{64}$'), mime_type text NOT NULL CHECK(mime_type IN ('image/png','image/jpeg','image/webp')),
 byte_size bigint NOT NULL CHECK(byte_size BETWEEN 1 AND 10485760), width_px integer NOT NULL CHECK(width_px>0), height_px integer NOT NULL CHECK(height_px>0),
 default_alt_text varchar(200), state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','approved','rejected')),
 public_versioned_path varchar(300), created_by_staff_id uuid NOT NULL REFERENCES iam.staff_accounts(id), approved_by_staff_id uuid REFERENCES iam.staff_accounts(id),
 approved_at timestamptz, quarantine_reason varchar(200), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(storage_class,object_key), CHECK(width_px::bigint*height_px<=25000000),
 CHECK((state='approved' AND public_versioned_path IS NOT NULL AND approved_by_staff_id IS NOT NULL AND approved_at IS NOT NULL) OR (state<>'approved' AND public_versioned_path IS NULL)),
 CHECK(public_versioned_path IS NULL OR public_versioned_path ~ '^/synthetic-media/[a-zA-Z0-9._/-]+$')
);
CREATE TABLE catalog.product_media (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES catalog.products(id), variant_id uuid,
 media_asset_id uuid NOT NULL REFERENCES catalog.media_assets(id), role text NOT NULL DEFAULT 'gallery' CHECK(role IN ('gallery','hero')),
 alt_text varchar(200), sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order BETWEEN 0 AND 19), is_primary boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 FOREIGN KEY(product_id,variant_id) REFERENCES catalog.product_variants(product_id,id), UNIQUE NULLS NOT DISTINCT(product_id,variant_id,media_asset_id,role)
);
CREATE UNIQUE INDEX primary_product_media ON catalog.product_media(product_id,variant_id,role) NULLS NOT DISTINCT WHERE is_primary;
CREATE INDEX product_media_asset ON catalog.product_media(media_asset_id);
CREATE TABLE catalog.content_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entry_key varchar(100) NOT NULL UNIQUE, content_type varchar(64) NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')), starts_at timestamptz, ends_at timestamptz, archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0), CHECK(ends_at IS NULL OR ends_at>starts_at)
);
CREATE TABLE catalog.content_revisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_entry_id uuid NOT NULL REFERENCES catalog.content_entries(id), revision_number integer NOT NULL CHECK(revision_number>0),
 title varchar(200), content_payload jsonb NOT NULL CHECK(jsonb_typeof(content_payload)='object' AND octet_length(content_payload::text)<=65536),
 created_by_staff_id uuid NOT NULL REFERENCES iam.staff_accounts(id), approved_by_staff_id uuid REFERENCES iam.staff_accounts(id), approved_at timestamptz, published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(content_entry_id,revision_number), CHECK(published_at IS NULL OR (approved_at IS NOT NULL AND approved_by_staff_id IS NOT NULL))
);
CREATE FUNCTION catalog.guard_content_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.published_at IS NOT NULL THEN RAISE EXCEPTION 'Published revision immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER content_history BEFORE UPDATE OR DELETE ON catalog.content_revisions FOR EACH ROW EXECUTE FUNCTION catalog.guard_content_revision();
-- Generic audit additions preserve all B003 field values and bootstrap compatibility.
ALTER TABLE platform.audit_events ALTER COLUMN actor_staff_id DROP NOT NULL;
ALTER TABLE platform.audit_events ADD COLUMN actor_type text NOT NULL DEFAULT 'staff' CHECK(actor_type IN ('staff','customer')),
 ADD COLUMN actor_customer_id uuid REFERENCES iam.customers(id),
 ADD COLUMN target_schema text NOT NULL DEFAULT 'iam', ADD COLUMN target_table text NOT NULL DEFAULT 'staff_accounts',
 ADD COLUMN target_reference varchar(160), ADD COLUMN request_ip_hash varchar(64), ADD COLUMN user_agent_class varchar(64),
 ADD COLUMN change_summary jsonb GENERATED ALWAYS AS (summary) STORED,
 ADD COLUMN reason_code varchar(200) GENERATED ALWAYS AS (reason) STORED,
 ADD COLUMN occurred_at timestamptz GENERATED ALWAYS AS (created_at) STORED,
 ADD CONSTRAINT audit_actor CHECK((actor_type='staff' AND actor_staff_id IS NOT NULL AND actor_customer_id IS NULL) OR (actor_type='customer' AND actor_customer_id IS NOT NULL AND actor_staff_id IS NULL));
CREATE TABLE platform.idempotency_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), surface text NOT NULL, actor_scope text NOT NULL, actor_reference varchar(200) NOT NULL,
 operation varchar(200) NOT NULL, idempotency_key uuid NOT NULL, request_hash text NOT NULL CHECK(request_hash ~ '^[0-9a-f]{64}$'),
 state text NOT NULL CHECK(state IN ('started','completed')), resource_type varchar(64), resource_id uuid, http_status integer,
 response_fingerprint text, response_snapshot jsonb, response_schema_version integer,
 started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(surface,actor_scope,actor_reference,operation,idempotency_key), CHECK(expires_at>started_at),
 CHECK((state='started' AND completed_at IS NULL AND response_snapshot IS NULL) OR (state='completed' AND completed_at IS NOT NULL AND response_snapshot IS NOT NULL AND response_schema_version=1 AND http_status BETWEEN 200 AND 499 AND response_fingerprint IS NOT NULL)),
 CHECK(response_snapshot IS NULL OR (jsonb_typeof(response_snapshot)='object' AND octet_length(response_snapshot::text)<=65536))
);
CREATE INDEX idempotency_expiry ON platform.idempotency_records(expires_at);
CREATE FUNCTION platform.guard_idempotency() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.state='completed' THEN RAISE EXCEPTION 'Completed outcome immutable' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER idempotency_history BEFORE UPDATE ON platform.idempotency_records FOR EACH ROW EXECUTE FUNCTION platform.guard_idempotency();
CREATE TABLE platform.outbox_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), aggregate_type varchar(64) NOT NULL, aggregate_id uuid NOT NULL, aggregate_version bigint NOT NULL CHECK(aggregate_version>0),
 event_type varchar(100) NOT NULL, event_schema_version integer NOT NULL CHECK(event_schema_version>0), payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object' AND octet_length(payload::text)<=8192),
 correlation_id uuid NOT NULL, causation_id uuid, producer varchar(100) NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now(), available_at timestamptz NOT NULL DEFAULT now(),
 routing_version integer NOT NULL CHECK(routing_version>0), published_at timestamptz, UNIQUE(aggregate_type,aggregate_id,aggregate_version,event_type)
);
CREATE TABLE platform.outbox_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES platform.outbox_events(id), destination_key varchar(100) NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','leased','published')), available_at timestamptz NOT NULL DEFAULT now(),
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0), claimed_by varchar(100), lease_token uuid, locked_until timestamptz, published_at timestamptz, last_error_code varchar(64),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id,destination_key),
 CHECK((state='leased' AND claimed_by IS NOT NULL AND lease_token IS NOT NULL AND locked_until IS NOT NULL) OR (state<>'leased' AND claimed_by IS NULL AND lease_token IS NULL AND locked_until IS NULL)),
 CHECK((state='published')=(published_at IS NOT NULL))
);
CREATE INDEX deliveries_due ON platform.outbox_deliveries(available_at,id) WHERE state<>'published';
GRANT USAGE ON SCHEMA catalog TO commerce_api;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO commerce_api;
GRANT INSERT,UPDATE ON catalog.products,catalog.product_variants,catalog.product_media TO commerce_api;
GRANT INSERT,DELETE ON catalog.product_categories,catalog.variant_attribute_values TO commerce_api;
GRANT INSERT ON catalog.price_records TO commerce_api;
GRANT UPDATE(valid_to,updated_at,version) ON catalog.price_records TO commerce_api;
GRANT SELECT,INSERT,UPDATE ON platform.idempotency_records TO commerce_api;
GRANT INSERT ON platform.outbox_events,platform.outbox_deliveries TO commerce_api;
-- Worker/dispatcher privileges are deliberately deferred to BUILD-027. Fixture metadata is migrator-only.
REVOKE ALL ON FUNCTION catalog.guard_category_parent(),catalog.guard_variant_identity(),catalog.guard_price_history(),catalog.guard_content_revision(),platform.guard_idempotency() FROM PUBLIC;
