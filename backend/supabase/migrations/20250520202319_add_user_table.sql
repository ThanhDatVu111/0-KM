-- up: create (or recreate) the users table
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  user_id    TEXT      PRIMARY KEY    NOT NULL,
  email      TEXT      UNIQUE         NOT NULL,
  username   TEXT                    NULL,
  birthdate  DATE                    NULL,
  photo_url  TEXT                    NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);