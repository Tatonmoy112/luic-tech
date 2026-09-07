-- U02/B003 BUILD-007/008. UUIDv4 until UUIDv7 compatibility is approved.
CREATE TABLE iam.customers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 auth_issuer text NOT NULL CHECK (length(btrim(auth_issuer)) BETWEEN 1 AND 200),
 auth_subject text NOT NULL CHECK (length(btrim(auth_subject)) BETWEEN 1 AND 200),
 email_display varchar(254), email_normalized varchar(254), phone_e164 varchar(16), display_name varchar(100),
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','anonymized')),
 email_verified_at timestamptz, last_authenticated_at timestamptz, anonymized_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
 UNIQUE(auth_issuer, auth_subject)
);
CREATE TABLE iam.customer_addresses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES iam.customers(id),
 label varchar(50), recipient_name varchar(100) NOT NULL CHECK (length(btrim(recipient_name)) > 0),
 phone_e164 varchar(16) NOT NULL CHECK (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
 line_1 varchar(200) NOT NULL CHECK (length(btrim(line_1)) > 0), line_2 varchar(200),
 area varchar(100), city varchar(100) NOT NULL CHECK (length(btrim(city)) > 0), postal_code varchar(20),
 country_code text NOT NULL CHECK (country_code = 'BD'),
 is_default_shipping boolean NOT NULL DEFAULT false, is_default_billing boolean NOT NULL DEFAULT false,
 archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE INDEX customer_addresses_owner ON iam.customer_addresses(customer_id, id) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX customer_default_shipping ON iam.customer_addresses(customer_id) WHERE is_default_shipping AND archived_at IS NULL;
CREATE UNIQUE INDEX customer_default_billing ON iam.customer_addresses(customer_id) WHERE is_default_billing AND archived_at IS NULL;
CREATE TABLE iam.staff_accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 auth_issuer text NOT NULL CHECK (length(btrim(auth_issuer)) BETWEEN 1 AND 200),
 auth_subject text NOT NULL CHECK (length(btrim(auth_subject)) BETWEEN 1 AND 200),
 email_display varchar(254), email_normalized varchar(254), display_name varchar(100) NOT NULL CHECK (length(btrim(display_name)) > 0),
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
 permission_epoch bigint NOT NULL DEFAULT 1 CHECK (permission_epoch > 0),
 last_authenticated_at timestamptz, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK (version > 0), UNIQUE(auth_issuer, auth_subject)
);
CREATE TABLE iam.roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE CHECK (code ~ '^[a-z][a-z._]{0,63}$'),
 name varchar(100) NOT NULL, description varchar(500), status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE TABLE iam.permissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE CHECK (code ~ '^[a-z][a-z._]{0,63}$'),
 resource text NOT NULL, action text NOT NULL, description varchar(500),
 risk_level text NOT NULL CHECK (risk_level IN ('ordinary','sensitive')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
 UNIQUE(resource, action)
);
CREATE TABLE iam.staff_role_assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_account_id uuid NOT NULL REFERENCES iam.staff_accounts(id),
 role_id uuid NOT NULL REFERENCES iam.roles(id), granted_by_staff_id uuid NOT NULL REFERENCES iam.staff_accounts(id),
 starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz, revoked_at timestamptz,
 revoked_by_staff_id uuid REFERENCES iam.staff_accounts(id), reason varchar(200) NOT NULL CHECK (length(btrim(reason)) > 0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
 CHECK (ends_at IS NULL OR ends_at > starts_at), CHECK ((revoked_at IS NULL) = (revoked_by_staff_id IS NULL))
);
-- Conservative: an expired assignment must be explicitly revoked before a new grant.
CREATE UNIQUE INDEX staff_unrevoked_role ON iam.staff_role_assignments(staff_account_id, role_id) WHERE revoked_at IS NULL;
CREATE TABLE iam.role_permissions (
 role_id uuid NOT NULL REFERENCES iam.roles(id), permission_id uuid NOT NULL REFERENCES iam.permissions(id),
 granted_at timestamptz NOT NULL DEFAULT now(), granted_by_staff_id uuid NOT NULL REFERENCES iam.staff_accounts(id),
 PRIMARY KEY(role_id, permission_id)
);
CREATE TABLE platform.audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_staff_id uuid NOT NULL REFERENCES iam.staff_accounts(id),
 action varchar(64) NOT NULL, target_id uuid NOT NULL, reason varchar(200) NOT NULL,
 correlation_id uuid NOT NULL, summary jsonb NOT NULL CHECK (jsonb_typeof(summary) = 'object' AND octet_length(summary::text) <= 2048),
 created_at timestamptz NOT NULL DEFAULT now()
);
-- Irreversible bootstrap marker in protected audit, including after all staff are disabled.
CREATE UNIQUE INDEX initial_admin_once ON platform.audit_events(action) WHERE action = 'access.bootstrap';
CREATE INDEX audit_target ON platform.audit_events(target_id, created_at);
GRANT USAGE ON SCHEMA iam, platform TO commerce_api;
GRANT SELECT, INSERT, UPDATE ON iam.customers, iam.customer_addresses, iam.staff_accounts, iam.staff_role_assignments TO commerce_api;
GRANT SELECT ON iam.roles, iam.permissions, iam.role_permissions TO commerce_api;
GRANT INSERT ON platform.audit_events TO commerce_api;
-- No runtime UPDATE/DELETE/TRUNCATE/SELECT on protected audit; no worker IAM access.
-- Prevent runtime insert of the deployment-only marker as well.
CREATE FUNCTION platform.guard_bootstrap_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.action = 'access.bootstrap' AND current_user <> 'commerce_migrator' THEN
  RAISE EXCEPTION 'Deployment role required' USING ERRCODE = '42501';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_bootstrap_audit BEFORE INSERT ON platform.audit_events FOR EACH ROW EXECUTE FUNCTION platform.guard_bootstrap_audit();
REVOKE ALL ON FUNCTION platform.guard_bootstrap_audit() FROM PUBLIC;
