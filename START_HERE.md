# Your Living Blueprint portfolio

This folder contains the application, not just a design or a project plan.

1. Read **README.md** for installation and exact commands.
2. Read **docs/LEARNING_GUIDE.md** to understand what the parts do.
3. Read **docs/AGENT_WORKFLOW.md** for prompts to give a future AI coding agent.
4. Future coding agents must read **AGENTS.md** and **docs/PROJECT_STATUS.md** first.

The real portfolio begins with **zero published achievements**. The sample workspace is explicitly illustrative. It is not your work history.

Run these commands from this folder, after installing Node.js 24 LTS, Git, and Docker with Compose:

```bash
npm ci
npm run setup
docker compose up -d db
npm run db:migrate
npm run dev
```

Open **http://localhost:5173**. The private studio is **http://localhost:5173/#manage**. Copy `OWNER_TOKEN` from the private `.env` file into the studio sign-in field. Never send that token to another person or put it in Git.

To try the visual interface before setting up a database:

```bash
npm ci
npm run dev:web
```

Open http://localhost:5173 and choose **Explore an example**. The site will honestly report that the content service is unavailable. This mode cannot save or publish.

This archive includes source and Git history in `git-history.bundle`. After extracting it, restore the local branches with:

```bash
npm run restore:git
```

The application has automated verification, but a native PostgreSQL deployment, Docker startup, and real-browser visual/E2E tests could not be executed in the build environment. Read **docs/VERIFICATION.md** before deploying. No public deployment has been made.
