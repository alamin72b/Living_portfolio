# How this application works — a plain-English guide

You can recognize programming ideas but may not yet write syntax comfortably. You do not need to understand every file before using this portfolio. Separate two activities: the AI helps maintain the platform, while the creations you personally build are your achievements.

## React: what the visitor sees

React builds the interface inside the browser. A component is a reusable piece of interface: a button, a detail panel, or a creation on the canvas. In this project, `PieceNode.tsx` describes how one creation looks and `IndexPanel.tsx` describes the searchable content list.

State means information that can change while the page is open. For example, the selected creation changes when you click another object. React updates the relevant interface. It does not itself make that selection permanent in the database.

TypeScript adds checks to JavaScript. If a function expects a creation ID, passing the wrong kind of value can be caught before you run the application. Types help the developer; runtime validation is still needed for data arriving from a browser.

Vite runs the frontend development server and creates the production files. React Flow handles the map-like canvas. Motion and SVG provide the visual transitions and drafting drawings.

## NestJS: the rules behind the interface

NestJS is the backend framework. It runs on a server using Node.js. It receives requests from the browser, checks data and permission, and asks the database to read or save information.

A controller is an entry point: “when someone requests this URL, run this method.” A service contains the rules: “a draft must be approved before publication.” A module groups related responsibilities. This keeps one part from doing every job.

For example, `AdminController` receives a publish request. `PortfolioService` checks the approval and performs a transaction. React cannot bypass these rules by hiding or showing a button.

## PostgreSQL: durable memory

PostgreSQL keeps records after the app closes or the server restarts. A table is an organized collection of records. A row is one record. An ID is a stable label for finding it again.

The `pieces` table stores creation identities. `revisions` stores versions of their descriptions. `connections` stores relationships. `layouts` stores canvas positions. Keeping relationships separate means moving a creation does not disconnect it from its project.

Drizzle is a TypeScript tool that helps the backend write database queries. It is not a second database. A migration is a versioned instruction that creates or changes tables. `npm run db:migrate` applies new migrations and checks previously applied files have not been changed.

## What is an API?

An API is an agreed way for programs to communicate. In this app, it is a collection of HTTP URLs. A request says what you want; a response gives data or an error.

`GET /api/v1/workspace` means “give me the published workspace.” `POST /api/v1/admin/drafts` means “create a private draft from the data I am sending.” GET reads; POST performs the defined action. JSON is the structured text carried between the browser and API.

An access token is a secret proving that a request has a role. The agent token can prepare drafts. The owner token can approve and publish. Never put a real token in code, a screenshot, a repository, or a shared prompt.

## What happens when someone opens the portfolio?

The browser loads the frontend files. React requests published data from NestJS. NestJS reads a consistent database snapshot and removes private evidence. The browser receives the public data and draws the objects and lines. Panning and opening a detail panel are local interactions; they do not change your portfolio content.

If the API is unavailable, the browser says so. You can explore the labeled sample interface, but that is not the saved portfolio and cannot publish changes.

## What happens when you add a project?

You enter accurate facts into the studio. Saving produces a private draft. Validation checks data formats and relationships. Preview lets you see the result in the workspace. You verify its truth and approve. Publishing changes the database's current revision pointer and related graph records together. The next public read contains the approved creation.

The creation's ID stays the same when you improve its description or move it. Its revision ID changes. This is similar to keeping the same notebook while adding a new dated version of a page.

A transaction means several database changes either all happen together or none happen. It prevents a half-published project whose description changed but its relationships did not.

## Why the approval digest exists

The digest is a fingerprint of the exact draft and workspace version you reviewed. If another publication changes the workspace, the old fingerprint no longer authorizes publication. You review again. This prevents an agent or stale browser tab from publishing something different from what you approved.

It does not prove the content is true. Your review of the actual work is what establishes that.

## What are Git branches?

Git records source-code changes. A commit is a named checkpoint. A branch is a separate line of work. A merge brings checked work into another branch.

`main` is the release baseline. `dev` collects tested development. An agent creates `feature/search-improvement` for one new feature, changes the code there, runs tests, commits it, and merges it into `dev`. Later, a reviewed release moves to `main`.

These branches track the platform's source code. Your published portfolio content lives in PostgreSQL, not in Git commits. A database backup protects that content. A Git branch is not a database backup.

## Local development

Local means running on your own computer. `localhost:5173` is the frontend on your computer; it is not a public website. Port numbers distinguish programs: frontend 5173, backend 3001, database 5432.

`npm ci` installs tools/libraries. `npm run dev` starts development processes and watches files for changes. The terminal stays busy because the app is running. Ctrl+C stops those processes.

The `.env` file is private configuration. It holds database connections and tokens. `.env.example` is a safe template with placeholders. `node_modules` holds installed dependencies and can be recreated with `npm ci`.

## Production and deployment

Building converts development code into files intended to run outside the development tools. Deployment places those files and services on a server visitors can reach. A domain is the human-readable address. HTTPS encrypts browser traffic.

This project includes Docker configuration. Docker runs each service in a container with its required environment. Caddy serves the frontend, forwards API requests, and can set up HTTPS. PostgreSQL still needs persistent storage and backups; deleting a container should not mean deleting your data.

The build environment could compile and test the application, but could not run a native PostgreSQL daemon, Docker deployment, or supported browser inspection. Those are separate verification tasks. A successful build is not proof that a deployed website is live.

## A useful way to work with an agent

Give a small, concrete request and a real example. Ask it to read the project instructions, change only the relevant module, run tests, explain the result, and preserve existing work. For content, ask for a draft and preview. You retain the final publishing decision.

For your own coding practice, write small creations independently and ask for explanations or hints. The platform can remain professionally maintained while the achievements inside honestly reflect your work.
