# Attendance & Pay

Tracks workers' attendance and pay. Two services share one Postgres (Neon) database:

- `apps/employer` (admin): employees (add, edit, enable/disable, delete), attendance for many people at once
  (full day / half day / leave / clear), payments (salary, bonus, advance), monthly summary, and users & access
  (link a sign-in account to an employee, make someone an admin, ban).
- `apps/employee` (web): a signed-in worker sees only the employee their account is linked to: days, earnings,
  money received and balance per month.

Pay rules (`packages/data/pay.ts`, tested in `pay.test.ts`):

- Daily wage: a full day earns the wage, a half day half of it, leave nothing. Monthly salary works the same with a
  day rate of salary / 30.
- What a day earns is stored when it is marked, so changing someone's rate doesn't rewrite past pay.
- Balance (all time) = earned - salary - advances. Payments are never capped: paying ahead leaves a negative balance
  that later work pays off. Bonus is extra and doesn't touch the balance.
- Disabled employees drop out of attendance, payments, the summary and the employee app. Their history stays.
- "Today" uses `APP_TIMEZONE` (default `Asia/Kolkata`).

Access: people sign up in the employee app. An admin links the account to an employee on Users & access, or makes it an
admin, after which it can sign in to the employer app with the same email and password. The first admin comes from
`ADMIN_EMAILS` (Google sign-in) or the `psql` command below.

## Template

Bun + Turborepo monorepo. Each folder in `apps/` is one Cloud Run service.

```
apps/<name>        services (created from starters/, not by hand)
packages/auth      better-auth: getAuth(), sign-in UI, requireSession/requireAdmin
packages/data      Drizzle + Postgres (pg), schema, migrations
packages/ui        shared components and theme (Tailwind v4)
starters/web|admin what new services are copied from
```

## Services

Services come from `platform/apps.yaml`. Terraform writes them to `.platform/services`, and the platform's terraform workflow creates any missing `apps/<name>` from `starters/`. To try one locally without the platform: `bun run new-service <name> <web|admin>`.

## Local development

```bash
bun install
bun run db:up                         # Postgres in Docker
cp apps/<name>/.env.example apps/<name>/.env.local   # set BETTER_AUTH_SECRET
bun run db:migrate
bun run dev
```

Admins: emails in `ADMIN_EMAILS` get the admin role, but only when they sign in with Google (a verified email). Password sign-up with an admin email is refused. Without Google locally, promote a user with:
`psql postgres://app:app@localhost:5432/app -c "update \"user\" set role='admin' where email='you@example.com'"`

## Database changes

Edit or add files in `packages/data/schema/`, export them from `schema/index.ts`, then `bun run db:generate` and commit the new file in `packages/data/drizzle/`. Migrations run automatically when a service starts (under a Postgres lock, so several services starting together are safe).

## Deploys

Push to `main`: CI lints, typechecks, tests, builds one image per service, pushes them and bumps the dev files in the `deployments` repo. Prod goes through the `promote` workflow there.

A service with special needs (e.g. a custom server) can add its own `apps/<name>/Dockerfile`; CI uses it instead of the root one.
