CREATE TABLE calendar (
    room_id TEXT PRIMARY KEY REFERENCES room(room_id),
    user_1 TEXT,
    user_2 TEXT,
    filled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);