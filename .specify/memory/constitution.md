<!--
Sync Impact Report
- Version: 1.1.0 proposed -> 1.2.0 ratified by the project owner on 2026-11-01
- Stack updated: Next.js 13 -> Next.js 15
-->

# ShowMine Reader Constitution

This constitution governs the public ShowMine reader.

## Core Principles

### I. Initiate Feature Changes in the Admin Repository
All feature changes for the ShowMine product MUST be initiated, specified, and
prioritized in the ShowMine admin repository:
[showmine-admin on Bitbucket](https://bitbucket.org/showmine/showmine-admin).
The admin repository is the source of truth for feature intent and cross-repository
coordination. Reader implementation work MUST link to its originating feature
specification; this requirement does not mean reader code changes must be implemented
in the admin repository. Independent maintenance, security fixes, and incident
remediation may be initiated in this repository.

### II. Assess Every Change Across All Three Repositories
Every feature and change, including bug fixes, maintenance, security updates,
dependencies, configuration, and documentation, MUST assess `showmine-admin`,
`showmine-reader`, and `showmine-api`. The originating change record MUST state the
impact on each repository and give a reason when one is unaffected. Implementation MUST
NOT begin until this scope is recorded. Cross-repository work MUST identify required
coordination, validation, and deployment sequencing; a repository-local change may
remain local when the other repositories are explicitly assessed as unaffected.

### III. Serve Public Company and Article Content Reliably
Reader features MUST preserve the public reader's purpose: presenting company and
article content to readers without requiring access to the administration interface.
Only content that the API identifies as publicly available may be presented as
published. Missing, unpublished, or unavailable content MUST result in a clear
not-found or unavailable experience rather than misleading or stale published
content.

### IV. Preserve API Consumer Contracts
The reader MUST consume the shared ShowMine API through existing service boundaries.
Changes to API request or response shapes, company scoping, publication visibility, or
error behavior MUST be coordinated with the API and admin consumers. API contract
changes MUST remain backward compatible during rollout or use an explicitly coordinated
migration; reader behavior MUST be covered by tests or documented manual verification.

### V. Prioritize Reader Accessibility and Performance
Public pages MUST remain responsive and usable with keyboard and assistive
technologies. Article content, headings, links, images, and metadata MUST remain
readable and meaningful on mobile and desktop. Server-side data fetching MUST avoid
unnecessary requests and preserve the reader's ability to render useful not-found or
error states when a dependency is unavailable.

### VI. Verify Observable Behavior
Behavioral changes MUST include regression tests where the repository's test setup
supports them. Otherwise, the feature specification MUST identify repeatable manual
verification for the affected routes, including published, unpublished, missing, and
API-failure cases as applicable. Before merging, run `npm run lint` and `npm run build`;
report any command that cannot run and why.

## Technical Constraints

- The reader uses Next.js 15, React 18, and TypeScript. Changes MUST preserve the
  installed stack unless an approved migration explicitly changes it.
- The reader is a public client of the ShowMine API; it MUST NOT take ownership of
  shared business rules, persistence, or server-side authorization.
- Next.js `NEXT_PUBLIC_*` values are exposed to the browser bundle and MUST NOT contain
  secrets. Private API credentials MUST remain server-side.
- The reader is a separate application from the admin frontend. Do not assume it shares
  the admin app's Vercel project, deployment configuration, or runtime settings.

## Development Workflow

- Every feature specification MUST reference its originating admin-repository feature
  and identify affected reader routes, public visibility, API behavior, and relevant
  metadata or sharing behavior.
- Every feature/change record MUST include an explicit impact entry for each of
  `showmine-admin`, `showmine-reader`, and `showmine-api`, including an explanation for
  any repository marked unaffected. This assessment is required for all change types,
  not only shared API changes, and MUST be recorded before implementation.
- Product feature changes MUST be initiated, specified, and prioritized in the
  `showmine-admin` repository. A maintenance or urgent fix may originate in another
  repository, but its three-repository impact assessment MUST be recorded before
  implementation and linked to the admin feature/change record as soon as practical.
- Coordinate and validate changes in every repository identified as affected; do not
  make unrelated changes to repositories explicitly assessed as unaffected.
- Implementations MUST follow existing Next.js page, component, service, and type
  boundaries. Feature work MUST avoid unrelated broad refactors.
- Before merge, verify lint and production build. For route or rendering changes,
  verify direct navigation and refresh on affected pages in the configured deployment
  preview where available.

## Governance

This constitution governs reader feature specifications, plans, implementation, and
review. Amendments require project-owner approval, an updated amendment date, and a
semantic version increment: MAJOR for incompatible principle changes, MINOR for new
or materially expanded principles, and PATCH for non-semantic clarification. Reviews
MUST identify deviations and their justification. If this constitution conflicts with
a higher-priority security or platform requirement, that requirement takes precedence
and the conflict MUST be documented.

**Version**: 1.2.0 | **Ratified**: 2026-11-01 | **Last Amended**: 2026-11-01
