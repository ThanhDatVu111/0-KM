# Backend Models — UML Class Diagram

> Generated from `backend/src/models/`. Focus: primary keys, foreign keys, and entity relationships.

## Mermaid Class Diagram

```mermaid
classDiagram
    class User {
        <<PK>> user_id
    }

    class Room {
        <<PK>> room_id
        <<FK>> user_1
        <<FK>> user_2
    }

    class AccessToken {
        <<FK>> user_id
    }

    class Library {
        <<PK>> id
        couple_id
    }

    class Entry {
        <<PK>> id
        <<FK>> book_id
    }

    class Event {
        <<FK>> room_id
        <<FK>> user_1
        <<FK>> user_2
    }

    class Chat {
        <<PK>> message_id
        <<FK>> room_id
        <<FK>> sender_id
    }

    class PlaybackCommand {
        <<PK>> id
        <<FK>> room_id
        <<FK>> requested_by_user_id
    }

    class RoomYouTubeVideo {
        <<PK>> id
        <<FK>> room_id
        <<FK>> added_by_user_id
    }

    class RoomSpotifyTrack {
        <<PK>> id
        <<FK>> room_id
        <<FK>> added_by_user_id
    }

    class YouTubeVideo <<legacy>> {
        <<PK>> id
        <<FK>> user_id
    }

    class SpotifyTrack <<legacy>> {
        <<PK>> id
        <<FK>> user_id
    }

    User "1" -- "0..1" AccessToken : user_id
    User "1" -- "0..*" Room : user_1
    User "1" -- "0..*" Room : user_2
    Room "1" -- "*" Chat : room_id
    Room "1" -- "*" PlaybackCommand : room_id
    Room "1" -- "0..1" RoomYouTubeVideo : room_id
    Room "1" -- "0..1" RoomSpotifyTrack : room_id
    Room "1" -- "*" Event : room_id
    Library "1" -- "*" Entry : book_id
    User "1" -- "*" Chat : sender_id
    User "1" -- "*" PlaybackCommand : requested_by_user_id
    User "1" -- "*" RoomYouTubeVideo : added_by_user_id
    User "1" -- "*" RoomSpotifyTrack : added_by_user_id
    User "1" -- "*" Event : user_1, user_2
    User "1" -- "*" YouTubeVideo : user_id
    User "1" -- "*" SpotifyTrack : user_id
```

## Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o| AccessToken : "user_id"
    User ||--o{ Room : "user_1"
    User ||--o{ Room : "user_2"
    Room ||--o{ Chat : "room_id"
    Room ||--o{ PlaybackCommand : "room_id"
    Room ||--o| RoomYouTubeVideo : "room_id"
    Room ||--o| RoomSpotifyTrack : "room_id"
    Room ||--o{ Event : "room_id"
    Library ||--o{ Entry : "book_id"
    User ||--o{ Chat : "sender_id"
    User ||--o{ PlaybackCommand : "requested_by_user_id"
    User ||--o{ RoomYouTubeVideo : "added_by_user_id"
    User ||--o{ RoomSpotifyTrack : "added_by_user_id"
    User ||--o{ Event : "user_1, user_2"
    User ||--o{ YouTubeVideo : "user_id"
    User ||--o{ SpotifyTrack : "user_id"

    User {
        string user_id PK
    }

    Room {
        string room_id PK
        string user_1 FK
        string user_2 FK
    }

    AccessToken {
        string user_id FK
    }

    Library {
        string id PK
        string couple_id
    }

    Entry {
        string id PK
        string book_id FK
    }

    Event {
        string room_id FK
        string user_1 FK
        string user_2 FK
    }

    Chat {
        string message_id PK
        string room_id FK
        string sender_id FK
    }

    PlaybackCommand {
        string id PK
        string room_id FK
        string requested_by_user_id FK
    }

    RoomYouTubeVideo {
        string id PK
        string room_id FK
        string added_by_user_id FK
    }

    RoomSpotifyTrack {
        string id PK
        string room_id FK
        string added_by_user_id FK
    }

    YouTubeVideo {
        string id PK
        string user_id FK
    }

    SpotifyTrack {
        string id PK
        string user_id FK
    }
```

## PK / FK Summary

| Entity | Primary Key | Foreign Keys |
|--------|-------------|--------------|
| User | user_id | — |
| Room | room_id | user_1 → User, user_2 → User |
| AccessToken | — | user_id → User |
| Library | id | — |
| Entry | id | book_id → Library |
| Event | — | room_id → Room, user_1 → User, user_2 → User |
| Chat | message_id | room_id → Room, sender_id → User |
| PlaybackCommand | id | room_id → Room, requested_by_user_id → User |
| RoomYouTubeVideo | id | room_id → Room, added_by_user_id → User |
| RoomSpotifyTrack | id | room_id → Room, added_by_user_id → User |
| YouTubeVideo (legacy) | id | user_id → User |
| SpotifyTrack (legacy) | id | user_id → User |

## Relationship Graph

```
                    ┌──────────┐
                    │   User   │
                    │ user_id  │
                    └────┬─────┘
         ┌───────────────┼───────────────┬───────────────┬───────────────┬──────────────┐
         │               │               │               │               │              │
         ▼               ▼               ▼               ▼               ▼              ▼
  ┌──────────────┐ ┌──────────┐  ┌──────────┐  ┌─────────────────┐ ┌─────────────────┐ ┌──────────┐
  │ AccessToken  │ │   Room   │  │   Chat   │  │ RoomYouTubeVideo │ │ RoomSpotifyTrack│ │  Event   │
  │  user_id    │ │ room_id  │  │msg_id   │  │       id         │ │       id        │ │ room_id  │
  └──────────────┘ │ user_1   │  │ room_id  │  │ room_id          │ │ room_id         │ │ user_1   │
                  │ user_2   │  │ sender_id│  │ added_by_user_id │ │ added_by_user_id│ │ user_2   │
                  └────┬─────┘  └──────────┘  └─────────────────┘ └─────────────────┘ └──────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
  ┌──────────┐ ┌──────────────────┐ ┌──────────┐
  │   Chat   │ │ PlaybackCommand   │ │  Event   │
  │ room_id  │ │ room_id           │ │ room_id  │
  └──────────┘ │ requested_by_uid  │ └──────────┘
               └──────────────────┘

  ┌──────────┐       book_id        ┌──────────┐
  │ Library  │ ───────────────────▶│  Entry   │
  │    id    │                      │    id    │
  └──────────┘                      │ book_id  │
                                    └──────────┘
```
