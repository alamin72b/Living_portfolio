CREATE TABLE revisions (
 id uuid PRIMARY KEY, entity_type text NOT NULL CHECK(entity_type IN ('piece','profile')), entity_id uuid NOT NULL,
 number integer NOT NULL CHECK(number > 0), base_revision_id uuid REFERENCES revisions(id), body jsonb NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','validated','approved','published','superseded')),
 created_by text NOT NULL CHECK(created_by IN ('owner','agent')), created_at timestamptz NOT NULL DEFAULT now(),
 validated_version integer, preview_digest text, approval_digest text, approved_at timestamptz, published_at timestamptz,
 CONSTRAINT revision_entity_number UNIQUE(entity_type,entity_id,number)
);
CREATE TABLE pieces (id uuid PRIMARY KEY, published_revision_id uuid REFERENCES revisions(id), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE site_state (id integer PRIMARY KEY CHECK(id=1), version integer NOT NULL DEFAULT 0, profile_revision_id uuid REFERENCES revisions(id));
INSERT INTO site_state(id,version) VALUES(1,0);
CREATE TABLE revision_evidence (id serial PRIMARY KEY, revision_id uuid NOT NULL REFERENCES revisions(id), ordinal integer NOT NULL, claim text NOT NULL, url text NOT NULL, note text NOT NULL, visibility text NOT NULL CHECK(visibility IN ('private','public')));
CREATE INDEX revision_evidence_revision ON revision_evidence(revision_id);
CREATE TABLE revision_media (id serial PRIMARY KEY, revision_id uuid NOT NULL REFERENCES revisions(id), ordinal integer NOT NULL, kind text NOT NULL CHECK(kind IN ('image','video','preview')), url text NOT NULL, alt text NOT NULL);
CREATE INDEX revision_media_revision ON revision_media(revision_id);
CREATE TABLE revision_relationships (id serial PRIMARY KEY, revision_id uuid NOT NULL REFERENCES revisions(id), target_id uuid NOT NULL REFERENCES pieces(id), type text NOT NULL CHECK(type IN ('contains','reuses','depends_on','inspired_by','evolves_from')), note text NOT NULL, UNIQUE(revision_id,target_id,type));
CREATE TABLE revision_layouts (revision_id uuid PRIMARY KEY REFERENCES revisions(id), x double precision NOT NULL CHECK(x BETWEEN -100000 AND 100000), y double precision NOT NULL CHECK(y BETWEEN -100000 AND 100000));
CREATE TABLE layouts (piece_id uuid PRIMARY KEY REFERENCES pieces(id), x double precision NOT NULL CHECK(x BETWEEN -100000 AND 100000), y double precision NOT NULL CHECK(y BETWEEN -100000 AND 100000));
CREATE TABLE connections (id uuid PRIMARY KEY, source_id uuid NOT NULL REFERENCES pieces(id), target_id uuid NOT NULL REFERENCES pieces(id), type text NOT NULL CHECK(type IN ('contains','reuses','depends_on','inspired_by','evolves_from')), note text NOT NULL, CONSTRAINT unique_connection UNIQUE(source_id,target_id,type), CHECK(source_id <> target_id));
CREATE INDEX connection_target ON connections(target_id);
CREATE TABLE audit_events (id serial PRIMARY KEY, action text NOT NULL, actor text NOT NULL, revision_id uuid REFERENCES revisions(id), created_at timestamptz NOT NULL DEFAULT now(), metadata jsonb NOT NULL DEFAULT '{}');
CREATE INDEX revision_creation_order ON revisions(created_at DESC);
-- Revision content is append-only. Only workflow metadata may change in place.
CREATE FUNCTION protect_revision_content() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.body IS DISTINCT FROM OLD.body OR NEW.entity_type IS DISTINCT FROM OLD.entity_type OR NEW.entity_id IS DISTINCT FROM OLD.entity_id OR NEW.number IS DISTINCT FROM OLD.number OR NEW.base_revision_id IS DISTINCT FROM OLD.base_revision_id OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Revision content is immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER immutable_revision BEFORE UPDATE ON revisions FOR EACH ROW EXECUTE FUNCTION protect_revision_content();

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
