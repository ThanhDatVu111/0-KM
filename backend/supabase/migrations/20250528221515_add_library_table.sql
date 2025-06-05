-- create_library_table

-- 1) Create the table
CREATE TABLE library (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid        NOT NULL
                        REFERENCES couples(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  color       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2) Create a function to update updated_at
CREATE FUNCTION set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- 3) Attach the trigger
CREATE TRIGGER trg_library_updated
  BEFORE UPDATE ON library
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
