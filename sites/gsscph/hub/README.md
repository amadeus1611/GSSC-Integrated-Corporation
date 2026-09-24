# The GSSC Library (the internal hub)

**Live:** https://claude.ai/artifact/15iRb37fbNzXCzhusZbjDG. This is the one link employees bookmark.

It lists every page GSSC has built, on four shelves (Public, Presenting, Instruments, Operations). Each entry has
its formal name, one line on what it is for, its status, when it was last updated, an Open button and a Copy
link button.

## Updating it (for Claude, in any session)

1. Edit `entries.json`: add, change or remove a work. Each work needs:
   - its shelf and glyph (one of `site`, `stage`, `profile`, `quotation`, `agreement`, `resolution`,
     `certificate`, `notarial`, `console`);
   - its name and formal name;
   - its purpose (one line) and status;
   - its updated date (YYYY-MM-DD) and its claude.ai link.

   Also set `edition` to today's date.
2. `python3 sites/gsscph/hub/build.py`. It hard-stops on a missing field, an unknown shelf or a link that is not
   on claude.ai. The seal and wordmark come from the newest kernel package, hash-checked.
3. Republish `hub/dist/library.html` to the SAME artifact (pass `url`
   https://claude.ai/artifact/15iRb37fbNzXCzhusZbjDG), so the link never changes.

Whenever a work is republished with a new version, update its `updated` date here too.

## Access

Each page opens only for people it has been shared with, from that page's Share menu, and that includes the
Library itself. The Library deliberately keeps no database, so it can be shared by link like the other pages.
