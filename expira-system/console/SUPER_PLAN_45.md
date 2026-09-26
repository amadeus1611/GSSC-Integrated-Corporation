# v45 super plan: the sidebar, finished and promoted

Asked for by Amadeus on 2026-09-26: take every recommendation from the sidebar review, think each one through, and plan the whole of it before anything is built. The v45 sidebar draft (`bench/sidebar-next.html`, `bench/drafts/`) already sets the look and the motion. This plan finishes its features, proves it at scale, on touch screens and with screen readers, and then moves it into the console. Nothing here is built until Amadeus says go.

Every item follows DESIGN_ENGINE §4 (EXPIRA × macOS): one curve with focus in and focus out, motion blur, text that never scales, gold meaning "this needs you", fewer words, and no tooltips.

## What was checked

| # | Where | What is there now |
|---|---|---|
| 1 | Bench draft | Nested folders, pins in four groups (pinned folders, pinned items, folders, items), Rearrange, select many with sort and delete, undo in place, a path bar that appears only when the tree steps into a folder automatically at narrow widths, and search by name. The tree is kept in memory, so it resets on reload. |
| 2 | Live console, `units/library/library.js` | Folders are flat: `FOLDERS=[{id,name,open}]`, saved under the KV key `folders`. A chat has `pinned`, `archived` and `folder` (a folder id). Pinned, Folders and Recents are separate sections. The menu offers Archive, and delete undoes through a toast. |
| 3 | Storage, `core/prelude.js` | KV writes through to `localStorage` and mirrors each key, and each chat, to the viewer's private `data/users/<id>/`. Deletions are remembered in `gone`, so another device's copy does not bring them back. Imports are normalised by `clean()`. |
| 4 | Documents | The draft shows documents as rows in the tree. In the console, documents live inside chats (exhibits) and in the Library; they have no ids of their own in the chat list. |

## 1. Isolate, and a path bar that is always there

The automatic step-in at narrow widths goes. The same click must always do the same thing.

- **The bar** keeps its current design and sits under Search, where it stays put while the list scrolls. It holds ‹ ›, then the trail: "All / Quotations / Drafts".
  - When the view is isolated, the trail is the isolated folder's path.
  - Otherwise it is the path of the open chat, as a file explorer shows where the selected file lives. With no chat open, or a loose one, it reads "All".
  - Every step of the trail isolates that folder. "All" is always the first step. Every step also accepts drops.
  - ‹ › go back and forward through the folders you have isolated. A button dims, not its surface, when there is nowhere to go.
  - While searching, the trail reads "All" and ‹ › dim, because search always looks everywhere.
- **Isolate** goes on the first page of the `…` menu: Rename, Pin, Isolate, Rearrange, Folder ›, Delete.
  - On a chat, Isolate focuses the folder it lives in. It is absent for a loose chat.
  - Two-finger click opens the same menu. "Show on its own" is removed.
- **Deep folders** keep indenting, with no limit and nothing automatic. Levels 1 to 5 indent 12px each. After that, each level indents 4px. The tree lines still show every level, and long names fade out at the edge.
- **Keys:** ⌘↓ isolates the focused folder. ⌘↑, Escape, or ← at the top of the view goes up one level.
- **Edge cases:**
  - If the isolated folder is deleted, the view climbs to its nearest surviving parent, with the usual slide.
  - If the open chat moves, the trail follows it.
- **Removed:** `maxDepth`, the drill in `toggle()`, and the rule that hid the bar at the top level unless you could go forward.

## 2. Closed folders show what needs you

- A closed folder carries the strongest state of anything inside it, at any depth. A running chat inside gives a gold dot that breathes; an unread one gives a gold ring. It sits in the folder's pin-mark slot and gives way to the `…` on hover.
- An open folder shows nothing, because its rows already show it.
- The mark pulls focus in when it appears and racks out when it clears, on the same curve as everything else. When a run finishes inside a closed folder, the folder's mark plays the ring's one soft pulse.
- It is computed in `sync()` from the model, never stored.

## 3. Recently Deleted, and Archive

A four-second undo is not enough for business records.

- **Delete** works as now: the row defocuses in place with an undo arrow. When the four seconds pass, the item moves to Recently Deleted instead of vanishing. A folder goes as one entry, with everything inside it.
- **The trash can** beside the undo arrow still means "delete now". It is the one permanent action in the row. It asks no question, because it is explicit and only appears for four seconds.
- **Recently Deleted** is a page of the account card under Data ›, in the same card of pages:
  - a list of deleted items, newest first, with the days left in muted text;
  - Restore and Delete now per row, plus Empty at the foot;
  - Restore puts an item back where it was. If that folder is gone, it goes to the top level.
- **Retention:** 30 days, then items are purged when the console loads. Only a purge, a Delete now or an Empty adds the id to KV `gone`. Until then, the other devices keep the item in Recently Deleted too.
- **Archive** (existing data) becomes a quiet page beside Recently Deleted: Data › Archive. Archive moves from the row menu's first page to the Folder › page. An archived chat keeps its folder and pin, and restores to them.
- **Model:** each item gets `deletedAt` and `from` (its folder id); `archived` stays as it is.

## 4. Move many

- The selection bar gains **Move**, between Sort and Delete. It opens the Move to card (the same page as the row menu's) above the bar, where the Sort card opens.
- Picked pins are skipped, because a pin holds its place. The card says so in one muted line: "2 pinned stay".
- The picked rows glide into the folder on one clock, and a closed folder takes the gold "got" pulse. Selection mode ends after the move.
- Undo is not needed, because nothing is lost; moving them back is one more Move.

## 5. Touch and small screens

- **Detection:** `(pointer: coarse)`, not screen width. A touch laptop gets the touch rules too.
- **Rows:** at least 36px tall on touch, with the same type size. The `…` is always visible, at 60% of its hover colour. There is no hover plate.
- **Long press** (450ms, cancelled by 8px of movement) opens the row menu at the finger, with the row lifting as it does for Rearrange.
- **Dragging is off on touch.** Rearrange and Move to cover the same needs without fighting the scroll.
- **Below 720px wide the dock becomes a drawer** over the chat:
  - It opens from the dock button, or with a swipe from the left edge, on the dock's own curve.
  - A near-black scrim fades in behind it at 40%.
  - Swiping left, tapping the scrim or opening a chat closes it, softly.
  - The resize grip is hidden, and the drawer is 86% of the screen, at most 320px.
- **Checks:** 390×844 and 820×1180, in both themes, with shots of the drawer mid-motion.

## 6. Search inside chats

- Results match names first, then the text of the turns, both the question and the answer.
- A name match shows as a normal row. A match in the text adds a second line: a short snippet with the match on a gold wash, fading out at both ends.
- Ranking: name matches, then text matches, newest first within each, with at most 50. Typing is debounced by 120ms.
- Opening a result opens the chat, scrolls to the matching turn and brushes it with the gold "got" pulse once.
- **Index:** a lower-case copy of each chat's text, built lazily on the first search and rebuilt for a chat only when its turns change. Nothing is stored.

## 7. Scale

- **The target:** 2,000 chats and 200 folders, six levels deep. `sync()` under 8ms, and no long tasks in `qa/perf.js`.
- **Only what is on screen moves.** The FLIP glide, focus in and focus out run only for rows within one screen of the viewport. Rows further away take their new place at once, where no one can see it.
- **Off-screen rows skip layout:** `content-visibility: auto` with a 24px intrinsic size.
- **`order()` is computed once per sync per level,** not once per row.
- Full virtualisation (rendering only the visible rows) comes only if these measures miss the target. It would change how rows are reused, so it is a last resort.
- **A stress specimen:** `bench/sidebar-next.html#stress` generates the large tree.

## 8. Screen readers and keyboard

- The tree uses `role=tree` and `treeitem`, with `aria-level`, `aria-setsize`, `aria-posinset`, `aria-selected` and `aria-expanded` (which is already there).
- **One polite live region** says what happened, in the house voice: "Moved to Contracts", "Deleted. Undo is available", "Pinned", "Isolated Quotations", and while rearranging, "3 of 7".
- The path bar is a `navigation` landmark named "Path", and the current step has `aria-current`.
- Every action is reachable from the keyboard. Reduced motion keeps its instant paths.
- `qa/a11y.js` (axe) must pass with the tree, the menus, the selection bar and the cards open.

## 9. Saving, and moving it into the console

- **One model, extended rather than replaced:**
  - `folders` gains `parent` (a folder id; empty means the top level), `pin`, `pinAt`, `ord` and `manual`.
  - Chats keep `folder` as their parent link, and gain `ord` and `pinAt`. The existing `pinned` becomes the pin, so nothing is renamed on disk.
  - Hand order per level (`manual`) lives on the parent folder, or in the KV key `rootOrder` for the top level.
- **Migration on load:**
  - today's flat folders become top-level folders;
  - pinned chats keep their pins, with `pinAt` set from their current order;
  - archived chats stay archived.
  - It runs once, it is idempotent, and it is checked in `qa/store.js`.
- **Import and export** carry the new fields. `clean()` treats `ord`, `pinAt` and `deletedAt` as numbers. An import whose folder chain loops, or points at a missing parent, lands at the top level.
- **Documents** stay out of the tree for now. They appear once the docs unit gives each document its own id. The draft's document rows are a mock.
- **Promotion:**
  - The draft replaces `units/library/` and its sidebar rules in place. The tokens go into `tokens.css`, and the dock button joins `units/shell/`.
  - `build.py` must pass its duplicate-selector check. `src/` and `index.html` are committed together.
  - Then the console is republished to the same artifact link, keeping its capabilities.

## Not doing

Colours or tags on folders, custom folder icons, emoji, and a separate command palette for the sidebar. Each adds noise without adding much.

## Build order and checks

Each step is one commit, first in the bench and then in `src/`. Each is tested in both themes, with no page errors, no text scaling during motion, and one clock per change.

1. **§1 and §2:** Isolate, the always-on bar, deep indentation, and folders that show their state.
2. **§4 and §3:** Move many; Recently Deleted and Archive in the bench (using the draft's in-memory model).
3. **§6:** Search inside chats, with mock turns in the specimen.
4. **§5:** Touch and the drawer, with shots at phone and tablet sizes.
5. **§7 and §8:** The stress specimen and its measurements; roles, the live region, axe.
6. **§9:** The model and migration (`qa/store.js` first), then the unit swap. Then `smoke`, `hovers`, `perf`, `a11y`, the reviewer pass, the DESIGN_ENGINE change log, and republishing the console.

## Decisions (open, for Amadeus)

- **Archive:** keep it as a page under Data ›, with the action on the Folder › page (recommended), or fold it into Recently Deleted?
- **Retention:** 30 days in Recently Deleted (recommended)?
- **Drawer:** below 720px wide (recommended)?
- **Documents in the tree:** later, once they have their own ids (recommended), or build that into this plan?

## Progress

- [x] Rearrange, and the pin rules (2026-09-26, in the bench).
- [ ] §1 Isolate and the path bar
- [ ] §2 Folders show what needs you
- [ ] §3 Recently Deleted and Archive
- [ ] §4 Move many
- [ ] §5 Touch and small screens
- [ ] §6 Search inside chats
- [ ] §7 Scale
- [ ] §8 Screen readers and keyboard
- [ ] §9 Saving and promotion
