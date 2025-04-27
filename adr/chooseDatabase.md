# Title

Decisions Made On the Database Choice for 0-KM

## Status

Approved and implemented: After discussion between the members over several options, the team came to a final proposal of using Supabase, which was approved by the advisors, and have so far finished setting up the first implementation steps (database connection, schema migration, and first post request).

## Context

The 3 main database platforms debated for use were Firebase, Supabase, MongoDB. The main issues of concern in making the database choice:

- We need a way to allow both data with pre-defined schema (because the relationship between the entities in this app are pretty clear) and also storage of multi-format media, including voice messages and photos 
--> supabase strictly supports this, since it is PostgreSQL; mongodb and firebase also support this but not as strictly as supabase since they are NoSQL.

- This is a couple-based app, so we need a database that allows display of specific content to specific authorized users 
--> this is the selling point of choosing supabase, which allows defining row-level security right in the schema, mongodb also supports this but through manual API configurations, and not as secure (low-impact factor at the scale of this project), firebase also has this but verbose logic. 

- Features like voice message upload and photo upload need to be implemented in a way that allows immediate syncing between 2 ends of a couple room. 
--> WebSocket can handle this, but finding a database platform with built-in support will be better, and Supabase does this

- The database implementation must be convenient, but must also demand a certain level of technical proficiency so that it can beneift the members' learning process.
--> Supabase provides learning experience with schema design, postgreSQL, however not much of API design since there is automatic API generation (can still learn if we ignore and overwrite that feature). Meanwhile MongoDB and Firebase covers this part more extensively. 

## Decision

After debate between chị Vân, anh Đạt and input from anh Khoa, the team has come to the decision of using Supabase for 0-KM. Taking the input from chị Vân, we opted not to rely on Supabase's dashboard but instead used the CLI for learning schema design (using the dashboard, we would just need to make tables) 

## Consequences

During the past week, we finished the set-up and started the implementation for supabsase with CLI. Initially, the process was tedious and confusing, especially during the connection of local schema with supabase and the migration. However, once we're past that stage, we started seeing the advantages. Firstly, Châu and I got the opportunity to design a basic schema at the login stage. Secondly, the process of making the first post request was streamlined thanks to Supabase's automatic API generate. So far, those are the visible effects of this decison on database. 
