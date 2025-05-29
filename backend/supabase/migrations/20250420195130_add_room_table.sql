-- ROOM
CREATE TABLE room (
  room_id    TEXT    PRIMARY KEY    NOT NULL DEFAULT gen_random_uuid()::text,
  user_1     TEXT                    NOT NULL REFERENCES users(user_id),
  user_2     TEXT                    NULL      REFERENCES users(user_id),
  created_at TIMESTAMP               NOT NULL DEFAULT now(),
  filled     BOOLEAN                 NOT NULL DEFAULT FALSE,
);

-- enforce one room per unordered pair
CREATE UNIQUE INDEX one_room_per_pair
  ON room (
    LEAST(user_1, user_2),
    GREATEST(user_1, user_2)
  );

-- By applying UNIQUE(LEAST(...), GREATEST(...)), you make sure the unordered pair {A,B} 
-- can only ever exist once. If A tries to “join” B’s room after B already joined A’s, 
-- they’ll get the same room rather than spinning up a new one.