# CAT Agent Skills distribution mirror

This subproject distributes the published catalog from Microsoft CAT Agent Skills for training use at `/cat-skills`.

## Included data

- Generated searchable metadata in `data/catalog.ts`.
- Public catalog API in `public/cat-skills-data/catalog.json`.
- Readable upstream Markdown in `public/cat-skills-data/markdown/`.
- ZIP and JSON packages in `public/cat-skills-data/bundles/`.
- Standalone `SKILL.md` files in `public/cat-skills-data/files/`.
- Fixed source commit, sync date, license, and third-party notice.

## Refresh from upstream

```bash
npm run sync:cat-skills
```

For a checked-out upstream repository:

```bash
node scripts/sync-cat-agent-skills.mjs --source /absolute/path/to/cat-agent-skills
```

After syncing, run `npm run build` and review the generated diff before committing.

## Source and license

Upstream: <https://github.com/microsoft/cat-agent-skills>

The upstream repository is licensed under the MIT License. The synchronized files retain contributor attribution, a fixed-commit source link, and a local copy of the upstream license. This is an unofficial distribution mirror and does not imply Microsoft endorsement.
