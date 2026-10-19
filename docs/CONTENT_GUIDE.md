# Content guide

## What belongs here

Work the owner genuinely completed: a small interaction, a useful function with a demonstration, a component, an experiment, a cluster, or a complete application. Describe the current result precisely. “Validates an email field” is a claim; “mastered frontend engineering” is not a claim the platform can establish.

The AI-built portfolio infrastructure has separate attribution. The example workspace is neutral demonstration content. Neither is an invented owner accomplishment.

## Choose the right object

| Kind     | Use it when                                       | Example of a possible genuine submission                       |
| -------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Fragment | A creation has an independent identity            | A personally implemented calculator, parser, or form           |
| Cluster  | Related independent pieces form a useful grouping | An explicitly assembled set of form controls                   |
| Project  | A larger application combines pieces              | An application containing your validated inputs and calculator |

These examples are classifications, not claims that the owner has built them.

Choose blueprint, experiment, working, or evolving based on actual implementation. There is no required order and no completion percentage. A working piece can continue evolving.

## English & Communication goals and accomplishments

Use the optional `area: "english_communication"` field for English, communication, and IELTS-related entries. An independent goal or accomplishment is normally a `fragment`; create a `cluster` titled **English & Communication** when you have a real structure that should contain independent entries. Add a `contains` relationship only when that structure genuinely includes the target. A presentation about a software project may connect to both the English structure and that project when each relationship is real; shared topic or technology alone is not enough.

The studio’s milestone form keeps entry small:

- A `goal` records what you intend to achieve, with optional description, target, and target date. It remains `stage: "blueprint"`.
- An `accomplishment` records what you actually achieved, with optional description, result, and completion date. It uses a realized `working` or `evolving` stage.

Updating the goal to an accomplishment is a normal revision of the same piece. Keep its stable ID, position, incoming/outgoing relationships, and history. If the actual result misses the target, do not convert the goal; keep the target as a blueprint and record the result only when it is an honest accomplishment entry.

Supporting material is optional for these milestones. An empty evidence list means the owner is attesting to the milestone; the public interface says it is not independently verified. Do not add a score, date, course, certificate, event, or result unless the owner supplied it. Existing creations still require at least one evidence claim.

## Information and privacy

| Field                                  | Visibility after publication   |
| -------------------------------------- | ------------------------------ |
| Title, summary, body, technologies     | Public                         |
| Repository/live links                  | Public; omit if private        |
| Development notes                      | Public                         |
| Media URLs and accessible descriptions | Public                         |
| Relationships and layout               | Public                         |
| Evidence marked private                | Studio/API administration only |
| Evidence marked public                 | Claim and URL public           |
| Evidence review note                   | Always private                 |

At least one evidence claim is required. A URL is helpful but optional; private notes can explain what the owner directly reviewed. Server validation checks structure and workflow, not truth. The owner must review the original work and permission to share it. Never paste secrets even into private notes.

URLs must use HTTPS and cannot contain credentials, query parameters, or fragments. This intentionally rejects signed/tokenized links. Link to a stable public landing page, or omit the link. The server never fetches a supplied repository URL.

## Add a first piece in the studio

Start the application and open `http://localhost:5173/#manage`. Sign in with the owner token from your private `.env`. Choose **New creation**, enter the facts, attach evidence, and save a draft. Then validate, open the private spatial preview, return, confirm that you reviewed the claims and permissions, approve, and publish.

Nothing becomes public when you save or preview. An agent token can perform preparation but cannot approve or publish. If another revision is published while you review, the API refuses the stale digest; validate, preview, and approve again.

## Adding through an external coding agent

The agent must first read AGENTS.md. Give it a repository location plus your permission to inspect it. It should review files without running untrusted code, distinguish your actual implementation from dependencies or generated scaffolding, and prepare accurate content.

Use `examples/first-creation.draft.json` as a contract example. Its placeholder statements are not portfolio content. The agent may submit the edited JSON through `/admin/drafts` or `npm run agent -- draft <file>`. It must show you the proposed content and private preview before publication.

The `/admin/ingestions` endpoint can turn supplied title/summary/repository/evidence notes into a proposal and suggest a position. It explicitly does not inspect the repository, infer achievements, or publish anything.

## Connections and composition

`contains`: a cluster/project is made of the target. `reuses`: this piece reuses the target. `depends_on`: this piece relies on the target. `inspired_by`: this piece draws influence from the target. `evolves_from`: this is a distinct creation descended from the target.

Direction matters: **project → fragment** means the project contains the fragment. Publish independent pieces before adding relationships to them. Select existing IDs; do not duplicate a fragment when adding it to a second project. The component remains searchable, inspectable, and independently linked.

The server rejects duplicate typed connections, self-connections, unpublished targets, and cycles in the structural graph. Inspiration can be cyclic. A fragment cannot contain other pieces; choose cluster or project when composition is intended.

## Updating work

Select a published piece in the studio. It loads the complete current content, including private evidence. Save your changes as a new revision. Existing IDs and unchanged connections persist. Preserve all fields/relationships not intentionally changed.

An API update includes the existing `pieceId` and its current `baseRevisionId`. If the base changed, reload and reconcile. Never start a replacement draft from the public read model because private evidence has been removed from that response.

For a mistaken publication, choose a previously published revision in history and select **Prepare rollback draft**. Review and approve it normally. The old version is copied into a new revision; history remains intact. There is no direct delete/unpublish UI in this initial version.

## Positions and exploded views

The advanced studio section exposes X/Y workspace coordinates. Updating position goes through the same approval workflow. `recommendPosition` is used by prepared proposals to suggest unoccupied space; it does not automatically reorganize existing pieces.

Public expansion is temporary visual exploration. It does not rewrite coordinates or relationships. Reassembly restores the original positions. All components remain independently available through Index.

## Media and previews

Provide a public HTTPS image, video file, or preview URL and a meaningful accessible description. The app stores metadata, not uploaded files. No image/video hosting or transcoding service is included.

Iframe previews load only after the visitor chooses to load them and the exact origin appears in server-side `PREVIEW_ORIGINS`. The iframe allows scripts but not same-origin privileges, popups, top navigation, or device access. Some applications will not run under these restrictions; provide a normal external link instead. Do not weaken the isolation for an untrusted repository.

## Profile and contact

Use **Edit introduction** in the studio. Name, headline, introduction, email, and GitHub link are revisioned and require approval. Contact details begin blank. Do not insert a guessed email, social handle, or professional title.
