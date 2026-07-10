# Database Migration Workflow (Drizzle ORM)

All database configurations in this project have transitioned from Prisma to **Drizzle ORM**. Legacy Prisma schema and migration commands are fully deprecated and removed.

## Workflow

### 1. Modifying the Schema
To update or add database models, edit the TypeScript schema file directly:
* [schema.ts](file:///Users/ishaanupponi/Documents/Campus_Quest_5.0%20Platform/apps/backend/src/db/schema.ts)

### 2. Pushing Changes (Development / Fast Iteration)
In local development environments, you can apply schema changes instantly using:
```bash
npm run db:push
```
This maps schema definitions directly to the active database.

### 3. Generating Migrations (Production / Staging)
To generate permanent SQL migration files to run in production:
```bash
npm run db:generate
```
This creates SQL migration scripts inside `apps/backend/drizzle/`.

### 4. Running Migrations
To execute pending SQL migrations against the database:
```bash
npm run db:migrate
```

### 5. Schema Studio (UI Viewer)
To explore table data in a web browser interface:
```bash
npm run db:studio
```

### 6. Wiping the Database
If you need to drop all tables and reset the schema:
```bash
npm run db:reset
```
Followed by `npm run db:push` to recreate the clean tables.
