# Sidebar draft: next iteration (agreed with Amadeus, 2026-09-26)

Build in `bench/drafts/sidebar-next.*`, test in the bench, add to DESIGN_ENGINE §4 and its change log, then publish and push.

1. **Directory bar, always on**, in its current design, under Search.
   - Inside an isolated folder it shows that folder's path; otherwise it shows the path of the open chat.
   - Any step isolates that folder, and "All" is always the first step.
   - ‹ › go back and forward through the folders you've isolated.
   - Remove the rule that hid the bar at the top level unless you could go forward.
2. **Isolate** on the first page of the `…` menu: Rename, Pin, Isolate, Rearrange, Folder ›, Delete.
   - It replaces "Show on its own". Two-finger click opens the same menu.
   - On a chat, Isolate focuses the folder it lives in.
3. **No automatic step-in at any width.** Remove `maxDepth` and the drill in `toggle()`.
   - Deep folders keep indenting, but past about five levels each extra level indents less (12px down to 4px).
   - The tree lines show the structure, and long names fade out at the edge.
4. **Clicks stay single:** one click opens a chat, or opens and closes a folder. There's no double-click.
5. **Keys:** ⌘↓ isolates the focused folder, and ⌘↑ or Escape goes up a level.
