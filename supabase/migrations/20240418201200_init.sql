-- USERS
CREATE TABLE users (
  user_id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  birthdate DATE NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
