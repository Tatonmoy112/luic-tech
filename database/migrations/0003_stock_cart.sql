-- U04/B005, AUTH-009. Five tables only; future reservation FK deferred.
CREATE TABLE inventory.stock_locations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE CHECK(code='TEST-WH'),
 name varchar(100) NOT NULL, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 timezone text NOT NULL DEFAULT 'Asia/Dhaka', is_sellable boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE TABLE inventory.stock_positions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), variant_id uuid NOT NULL REFERENCES catalog.product_variants(id),
 stock_location_id uuid NOT NULL REFERENCES inventory.stock_locations(id), sellable_on_hand bigint NOT NULL DEFAULT 0 CHECK(sellable_on_hand>=0),
 reserved_quantity bigint NOT NULL DEFAULT 0 CHECK(reserved_quantity>=0 AND reserved_quantity<=sellable_on_hand),
 low_stock_threshold bigint CHECK(low_stock_threshold>=0), last_movement_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(variant_id,stock_location_id)
);
CREATE INDEX stock_positions_location_variant ON inventory.stock_positions(stock_location_id,variant_id);
CREATE FUNCTION inventory.guard_position() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' AND (NEW.sellable_on_hand<>0 OR NEW.reserved_quantity<>0) THEN RAISE EXCEPTION 'Opening movement required' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND current_user<>'commerce_migrator' THEN RAISE EXCEPTION 'Movement required' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER stock_position_guard BEFORE INSERT OR UPDATE ON inventory.stock_positions FOR EACH ROW EXECUTE FUNCTION inventory.guard_position();
CREATE TABLE inventory.stock_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), stock_position_id uuid NOT NULL REFERENCES inventory.stock_positions(id),
 movement_type text NOT NULL CHECK(movement_type IN ('opening','adjustment')), delta_sellable integer NOT NULL CHECK(delta_sellable BETWEEN -1000 AND 1000 AND delta_sellable<>0),
 delta_reserved integer NOT NULL DEFAULT 0 CHECK(delta_reserved=0), sellable_after bigint NOT NULL CHECK(sellable_after>=0),
 reserved_after bigint NOT NULL CHECK(reserved_after>=0 AND reserved_after<=sellable_after),
 position_version bigint NOT NULL CHECK(position_version>1), operation_key uuid NOT NULL UNIQUE,
 actor_staff_id uuid NOT NULL REFERENCES iam.staff_accounts(id), reason_code varchar(64) NOT NULL CHECK(reason_code ~ '^[a-z][a-z0-9_]*$'),
 reason_note varchar(200), occurred_at timestamptz NOT NULL DEFAULT now(), correlation_id uuid NOT NULL,
 UNIQUE(stock_position_id,position_version)
);
CREATE INDEX stock_movement_position_id ON inventory.stock_movements(stock_position_id,id);
CREATE INDEX stock_movement_actor ON inventory.stock_movements(actor_staff_id);
-- Only the trigger owner may change positions. Caller-supplied resulting balances are independently checked.
CREATE FUNCTION inventory.apply_movement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,inventory AS $$
DECLARE p inventory.stock_positions%ROWTYPE;
BEGIN
 SELECT * INTO p FROM inventory.stock_positions WHERE id=NEW.stock_position_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Position absent' USING ERRCODE='23503'; END IF;
 IF NOT EXISTS(SELECT 1 FROM inventory.stock_locations WHERE id=p.stock_location_id AND status='active' AND is_sellable) THEN RAISE EXCEPTION 'Location unavailable' USING ERRCODE='23514'; END IF;
 IF NEW.sellable_after<>p.sellable_on_hand+NEW.delta_sellable OR NEW.reserved_after<>p.reserved_quantity OR NEW.position_version<>p.version+1
 OR (NEW.movement_type='opening' AND (p.version<>1 OR NEW.delta_sellable<0)) THEN RAISE EXCEPTION 'Invalid movement' USING ERRCODE='23514'; END IF;
 UPDATE inventory.stock_positions SET sellable_on_hand=NEW.sellable_after,last_movement_at=NEW.occurred_at,updated_at=now(),version=NEW.position_version WHERE id=p.id;
 RETURN NEW;
END $$;
CREATE TRIGGER stock_movement_apply BEFORE INSERT ON inventory.stock_movements FOR EACH ROW EXECUTE FUNCTION inventory.apply_movement();
CREATE TABLE sales.carts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid REFERENCES iam.customers(id), guest_owner_hash text UNIQUE CHECK(guest_owner_hash ~ '^[0-9a-f]{64}$'),
 state text NOT NULL DEFAULT 'active' CHECK(state IN ('active','merged','expired')), currency text NOT NULL DEFAULT 'BDT' CHECK(currency='BDT'),
 channel text NOT NULL DEFAULT 'web' CHECK(channel='web'), merged_into_cart_id uuid REFERENCES sales.carts(id),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days' CHECK(isfinite(expires_at)), last_activity_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 CHECK((customer_id IS NOT NULL)::integer+(guest_owner_hash IS NOT NULL)::integer=1),
 CHECK((state='merged')=(merged_into_cart_id IS NOT NULL)), CHECK(merged_into_cart_id IS DISTINCT FROM id), CHECK(expires_at>last_activity_at)
);
CREATE UNIQUE INDEX cart_active_customer ON sales.carts(customer_id,channel) WHERE state='active' AND customer_id IS NOT NULL;
CREATE INDEX cart_expiry ON sales.carts(expires_at,id) WHERE state='active';
CREATE INDEX cart_merge_target ON sales.carts(merged_into_cart_id);
CREATE FUNCTION sales.guard_cart() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW.id,NEW.customer_id,NEW.guest_owner_hash,NEW.currency,NEW.channel,NEW.created_at) IS DISTINCT FROM ROW(OLD.id,OLD.customer_id,OLD.guest_owner_hash,OLD.currency,OLD.channel,OLD.created_at)
 OR (OLD.state<>'active' AND current_user<>'commerce_migrator') OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Immutable cart identity or terminal cart' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cart_guard BEFORE UPDATE ON sales.carts FOR EACH ROW EXECUTE FUNCTION sales.guard_cart();
CREATE TABLE sales.cart_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cart_id uuid NOT NULL REFERENCES sales.carts(id), variant_id uuid NOT NULL REFERENCES catalog.product_variants(id),
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 20), observed_unit_price_minor bigint CHECK(observed_unit_price_minor>0), observed_currency text CHECK(observed_currency='BDT'),
 added_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(cart_id,variant_id), CHECK((observed_unit_price_minor IS NULL)=(observed_currency IS NULL))
);
CREATE INDEX cart_lines_variant ON sales.cart_lines(variant_id);
CREATE FUNCTION sales.guard_cart_line() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cart uuid; parent sales.carts%ROWTYPE;
BEGIN
 cart=CASE WHEN TG_OP='DELETE' THEN OLD.cart_id ELSE NEW.cart_id END;
 IF TG_OP='UPDATE' AND ROW(NEW.id,NEW.cart_id,NEW.variant_id,NEW.added_at) IS DISTINCT FROM ROW(OLD.id,OLD.cart_id,OLD.variant_id,OLD.added_at) THEN RAISE EXCEPTION 'Line identity immutable' USING ERRCODE='23514'; END IF;
 SELECT * INTO parent FROM sales.carts WHERE id=cart FOR UPDATE;
 IF current_user<>'commerce_migrator' AND (parent.state<>'active' OR parent.expires_at<=clock_timestamp()) THEN RAISE EXCEPTION 'Inactive cart' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM sales.cart_lines WHERE cart_id=cart AND variant_id=NEW.variant_id)
 AND (SELECT count(*) FROM sales.cart_lines WHERE cart_id=cart)>=50 THEN RAISE EXCEPTION 'Cart line cap' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER cart_line_guard BEFORE INSERT OR UPDATE OR DELETE ON sales.cart_lines FOR EACH ROW EXECUTE FUNCTION sales.guard_cart_line();
GRANT USAGE ON SCHEMA inventory,sales TO commerce_api;
GRANT SELECT ON inventory.stock_locations,inventory.stock_positions,inventory.stock_movements,sales.carts,sales.cart_lines TO commerce_api;
-- SELECT FOR UPDATE requires an UPDATE privilege; the trigger still denies direct writes.
GRANT UPDATE(version) ON inventory.stock_positions TO commerce_api;
GRANT INSERT ON inventory.stock_movements,sales.carts,sales.cart_lines TO commerce_api;
GRANT UPDATE ON sales.carts,sales.cart_lines TO commerce_api;
GRANT DELETE ON sales.cart_lines TO commerce_api;
REVOKE ALL ON FUNCTION inventory.guard_position(),inventory.apply_movement(),sales.guard_cart(),sales.guard_cart_line() FROM PUBLIC;
