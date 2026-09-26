# EXPIRA design engine

This is the living design system behind everything EXPIRA makes: the Console, the documents it builds, and every new derivative. Read it before designing or building anything, and update it whenever an iteration teaches us something. The latest learnings take precedence over older habits.

## 1. Canon: the design engine's IP

These sources define the house style. Anything new derives from them rather than being invented from scratch.
- **GSSC kernel templates** (`console/lib/gssc-kernel.json`, kernel 2.18.x):
  - the quotation master, `GSSC-QUOTATION-MASTER-v1`;
  - the company profile;
  - the CMSA;
  - the secretary's certificate;
  - the board resolution;
  - the notarial acknowledgment.
- **The master template and its derivatives:**
  - the derivative CSS;
  - the Roman-numeral sectioning;
  - hairline rules with a 34px gold lead-in;
  - navy-ruled tables;
  - pull quotes;
  - the serif display type in italic accents.
- **The EXPIRA mark:** faceted navy stone with a gold vein and one clean fracture. The brand tokens are in `brand_assets/`.

A new derivative, whether a screen, a document or a chart, follows the master template's logic: its hierarchy, rules, spacing rhythm and type pairing. That way it reads as considered and of one family.

## 2. Aesthetic principles

- **Aesthetics come first.** Premium and calm, in the manner of Claude: complex underneath, subtle on the surface. The detail shows only when you look closely.
- **Small type:**
  - body text 13px;
  - chrome 10.5–11px;
  - micro labels 9.5px, never smaller.
- **Lines and shapes:**
  - hairline 1px lines;
  - sharp shapes with micro radii of 3–8px;
  - long, stretched proportions.
- **Density without clutter:**
  - tabular numbers;
  - tracked small caps for labels;
  - colour never carries meaning on its own; pair it with a glyph or a word.
- **Themes:** every colour comes from a token, and dark and light are designed separately rather than one being an inverted copy of the other.
- **Colour stack (Gate A, v41):** derived from the EXPIRA brand stack: navy `#0B1A3F`, slate `#2C3549`, gold `#AE8A47`/`#C9A35C`, ink `#09101E`. Harmony follows good colour theory: a navy-and-gold complementary core, with teal, rust and plum as the accents.
  - **Text.** All text tokens pass AA on every surface in both themes. Gold used as text has its own token, `--gold-ink`; `--gold` is for rules, lead-ins and focus rings only.
  - **Charts.** Fixed order: research navy blue, finance deep gold, builder teal, legal rust, arbiter plum. The palette is validated with the dataviz validator in both modes.
  - **Token raster.** Navy in light and gold in dark, darker or brighter meaning more; validated as an ordinal ramp.
- **Full palette (2026-09-26, Amadeus).** Ten colours; the values and their roles are in `brand_assets/palette.json`. Those marked "estimated" were read from a screenshot; replace them with the Canva hex codes.
  - Golds: light gold `#C9A35C`, deep gold `#AE8A47`, pale gold `#E9CF91`, sand `#E6D3A6`.
  - Navies: midnight navy `#0B1A3F`, royal navy `#0C2461`.
  - Neutrals: off-white `#F7F5F0`, light grey `#D9D9D9`, steel grey `#7D838E`, slate grey `#4D535E`.
  - **Dark theme (v45 draft):**
    - Surfaces are close to black, built from the brand ink rather than neutral grey: the sidebar is `#04060B` and the page is `#06090F`, stepping up to `#0C111B` for menus.
    - The default text is the off-white.
    - Captions use steel grey, which passes AA on every dark surface.
    - It is drafted in `console/bench/drafts/dark-next.css` and is promoted by replacing the `@dark` block in `src/tokens.css`.
- **No regressions:** each iteration must look at least as well thought out as the last one.

## 3. Motion principles

Motion is the heart of the UX: fidelity in the engine comes first.
- **Liquid, not rigid:**
  - Surfaces open as a non-rigid blob that pours out of the exact point clicked. The corner radii wobble and settle into the card's own radius on a spring, and the surface drains back to the same point when it closes.
  - Content fades in once the shell has formed.
- **Never clip a shadow.** A clip-path reveal on a surface with a shadow must end outside it (negative inset), so the shadow is never cut; the shadow moves with the shape.
- **Springs, not curves.** Use the damped oscillator converted to CSS `linear()`: critically damped, with no overshoot anywhere. No bounce. Carry velocity over on interruption, so opening and closing can reverse mid-way without a jump.
- **Physics, not overlap.** Surfaces that would collide spring aside, each to a free position, and return home afterwards. The main column glides instead of jumping.
- **Order is truth:**
  - a child never appears before its parent;
  - an edge draws only once both ends exist;
  - glows and beads start only after their edge.
  - Maps show the real order of execution, live and on replay.
- **Nodes bud and never jump:** swell, neck, pinch, then release, as one continuous motion with no pauses. Births are queued in execution order, and the Field map reads left to right in that order.
- **Loading is a mercury bead** on a hairline: it stretches with its speed and pools at the ends. It is not a stock progress bar.
- **Stillness when settled:** a finished run animates nothing, and anything off-screen pauses.
- **Reduced motion:** state changes only.
- **The bloom (v44, replaces the v41 pour).** A surface opens where it lives: it comes out of a soft blur, fades up and settles from a hair under full size (0.965 small, 0.985 large) on `--t-enter` and `--ease-out`. It closes in place on the soft close, fading, easing a hair smaller and softening back into the blur. It never travels to or from the click point. The blur is gone by 70% of the way open, so the landing is sharp. Reversal mid-flight carries on from where it is. Source: `console/src/core/pour.js` (the `POUR.attach` API is unchanged).
- **The pour (Gate A, v41; retired in v44): the surface-tension droplet.**
  - A small bead leaves the exact point clicked and spreads into the card, with width leading and height following.
  - One critically damped spring drives every layer (shell, shadow plate, bead, content) on one clock. Open settles in about 220 ms and close in about 360 ms.
  - Only transform and opacity move. The shadow is its own plate, so nothing is ever clipped.
  - A click mid-flight reverses it, carrying position and speed.
  - The content surfaces after the shell has formed, un-blurring as it arrives.
  - There is no gold meniscus rim.
  - Reference implementation: `console/qa/lab/pours.js`, candidate A.
- **Soft close (Gate A):** exits behave like a luxury car door. They travel, then are pulled gently shut, decelerating into rest; they never accelerate out.
  - Tokens: `--ease-soft-close` `cubic-bezier(.4,0,.1,1)` over `--t-exit` 280 ms (380 before v44). Entry stays fast (`--t-enter` 160 ms, 200 before v44, `--ease-out`). Amadeus's rule: fast push, slower soft close. Most design systems close faster than they open (Material, NN/g, Atlassian); EXPIRA deliberately keeps the close a little slower, but both stay well under the 400 ms where motion reads as waiting.
- **Blur transition (Gate A, Duke; widened in v44 by Amadeus):** a blur accompanies entry (`--blur-enter` 8px) and exit (`--blur-exit` 6px). It is the one sanctioned exception to "transform and opacity only", and it has limits:
  - small surfaces blur as a whole; large surfaces (settings, the full-screen map, the document viewer) blur only their content, at `--blur-enter-lg` 6px and `--blur-exit-lg` 5px, because a blur costs in proportion to area × radius (Chrome, "Animating a blur"). A large surface that drops frames on a real device falls back to fade and scale;
  - enter and exit only, on the moving layer;
  - `filter:none` at rest, and never in loops;
  - never on streamed words.
- **The vocabulary (Gate A):**
  - durations: `--t-instant` 90, `--t-enter` 160, `--t-exit` 280, `--t-move` 300, `--t-draw` 420 ms × length (v44);
  - curves: `--ease-out`, `--ease-soft-close` and `--ease-inout`;
  - one critically damped `--spring`;
  - `--stagger` 40 ms.

  Nothing overshoots anywhere. The source is `console/qa/lab/tokens.proposed.css`, which becomes `src/tokens.css`.

## 4. EXPIRA × macOS: the house style for the Console and its derivatives (v45, Amadeus, 2026-09-26)

**What it is.** The EXPIRA Console and everything derived from it take the calm of macOS, as in Finder, the menus and the dock: quiet surfaces, one motion language, and structure the person shapes. They wear it in EXPIRA's own dress: near black, off-white, brand gold, the display serif, and hairlines. This is the global concept for the Console and its derivatives; §1–§3 still hold, and this section refines them.

**Scope.**
- **It applies to** the EXPIRA Console and every EXPIRA screen or derivative (menus, panels, the sidebar, settings, viewers).
- **It does not apply to** the GSSC kernel templates or their derivatives: the quotation master, the company profile, the CMSA, the secretary's certificate, the board resolution and the notarial acknowledgment. Their layout and colour logic (§1) are settled, and they keep them. When the Console shows a GSSC document, the document keeps its own look inside the EXPIRA frame.
- **The reference implementation** is the v45 sidebar in the bench: `console/bench/sidebar-next.html`, with `console/bench/drafts/`. It is promoted into `src/` unit by unit.

### 4.1 Logic: a place people shape, not a form they fill in
- **Structure.**
  - Show the fewest fixed things, then let the person's own structure carry the rest.
  - Layout, as in macOS: a toolbar row (New chat and New folder as icons, with the sidebar button at its right), then a real search field that never scrolls, then one tree: folders the person makes (they nest, and they hold chats and documents), then loose chats, newest first. Last come the account and the mark.
  - Don't add fixed categories, date headings or counts where order already says it.
- **State is a property, not a place. Gold means "this needs you".**
  - A chat at rest is a small grey ring.
  - A running chat is a gold dot that breathes.
  - A finished chat you have not opened yet is a gold ring: the dot settles into it with one soft pulse, and it fades to grey once you open it.
  - A new document you have not opened is a gold page.
  - Pinned is not a colour. It is a small pin at the row's end (which gives way to the `…` on hover), and the item floats to the top of its own level: a pin inside a folder goes to the top of that folder, and a pinned folder goes to the top of the level that holds it.
  - Every level has four groups, always in this order: pinned folders, pinned items, folders, items. Pinned folders always lead the pins.
  - A pin holds its place. It moves only among the pins, and it cannot be dragged or moved into a folder; the Folder page says "Pinned · unpin to move". A pinned folder already brings everything inside it forward, while a pinned file stands on its own, so filing a pin into a folder would blur the two.
  - Unpinned items are filed freely: drag, Move to, or drop on a folder or a step in the path bar.
- **An empty folder still holds one row of space.** It shows a quiet italic "Empty" where a child's name would begin. Its dimness is its colour, never its opacity, so its focus in and focus out land exactly where it rests and never jump. While something is dragged over its folder, "Empty" racks out and "Drop here" pulls focus in gold in the same place.
- **The path bar is always there, and it says where you are.** It sits under Search and never scrolls: back and forward (the same two small frosted buttons as the cards), then the trail.
  - The trail is the path of the open item, as a file explorer's path bar shows the selected file: "All / Quotations / Drafts / *Q-2026-015*", with the item itself in the display italic. When a folder is isolated, its step reads in ink. With nothing open it reads "All".
  - "All" always comes first. Any step isolates that folder and accepts drops.
  - Back and forward walk the roots you have isolated, as a browser does; ⌘[ and ⌘] do the same.
  - While you search, the trail reads "All / 4 results" and the arrows dim, because search looks everywhere.
  - A trail longer than the bar scrolls sideways and feathers only on the side that is cut off. Steps that stay glide to their new place, new ones pull focus, and ones that go rack out, on one clock.
- **Isolate is a choice, never automatic.** The same click always does the same thing: one click on a folder opens or closes it, and one click on a chat opens it.
  - `…` › Isolate (on the first page, after Pin) makes a folder the root of the view: the list slides one way while the new one slides in from the other, and rows seen in both travel to their new place. On a chat, Isolate folder focuses the folder it lives in. Two-finger click opens the same menu.
  - ⌘↓ isolates the focused folder; ⌘↑, Escape, or ← at the top of the view climbs out one level.
  - New chats and folders made while isolated go into the isolated folder.
  - If the isolated folder is deleted or moved away, the view climbs to its nearest surviving parent.
- **Depth has no limit, and stays readable.** Folders nest to any depth. The first five levels indent 12px each; each level after that indents 4px. The tree lines still mark every level, and long names feather at the edge.
- **Closed folders carry what needs you inside them.** A closed folder shows the strongest state of anything within it, at any depth: a breathing gold dot while something runs, a gold ring while something is unread. It sits at the glyph's shoulder and surfaces out of a blur. When a run finishes inside a closed folder, the folder's mark gives the ring's one soft pulse. An open folder shows nothing, because its rows already do.
- **Two quiet places at the foot of the tree: Archive, and Recently Deleted.** They sit under a hairline, below everything you made, and appear only when they hold something. They open in place like folders, or can be isolated.
  - Inside, items sit under small date captions (Today, Yesterday, the weekday, then "16 Sep"), newest first.
  - Recently Deleted keeps things for 30 days. Each row counts down its days at its end, in red once three or fewer are left. It leads with a quiet "Kept for 30 days" and an Empty action.
  - Delete is still in place first: the row defocuses with its undo arrow for four seconds, then glides into Recently Deleted (the place pulses if it is closed). The trash can beside the undo arrow still deletes at once and for good.
  - A deleted item's menu offers Put back (to the folder it came from, or the top level if that folder has gone) and Delete now. An archived item's offers Unarchive and Delete. Archive is on the Folder page.
  - What cannot be undone asks once, in place: the choice turns red and reads "Empty 4 items?", and turns back if it is left alone for three seconds.
  - Dragging onto Recently Deleted deletes; onto Archive archives. Search does not look inside the two places.
- **Actions are a card of pages.**
  - The row's `…` menu opens a card whose first page is short: Rename, Pin, Isolate, Rearrange, Folder, Delete.
  - Deeper choices are further pages of the same card, not new pop-ups: Folder leads to Move to, New folder and Pin, and Move to leads to the folders.
  - Back and forward are two separate small frosted buttons, each its own surface with the cards' corners and depth. A disabled one dims its glyph, not its surface.
  - On the row menu they sit between the card and the row, at the right, under the `…`. On the account card they sit above the card, at its right.
  - Right-clicking empty space offers New chat and New folder.
- **Fewer words, more detail. People are smarter than we think.**
  - There are no tooltips and no shortcut hints on rows.
  - Long names feather into the surface; they never end in "…". The feather applies only to text that actually overflows (checked live as widths change); text that fits is never touched.
  - Right-aligned values, such as an Account field, wrap rather than fade.
  - Undo happens in place: a deleted row defocuses and its action becomes an undo arrow for a few seconds, with a trash can beside it to delete it at once. There is no toast.
  - Only an action menu may use words for its choices.
- **A drag always ends.** The resize grip ends its drag on any of these: pointer up, a cancelled pointer, lost capture, the window losing focus, or a move with no button held. A release outside the frame therefore never leaves the pointer stuck to the grip.
- **Rubber bands tighten.** Stretched past its limit, a surface resists more the further it is pulled, up to a fixed amount (the sidebar: 64px past its maximum). Released, it settles back very softly.
- **Select many.** The toolbar's Select puts a round check where each row's glyph sits, so nothing moves.
  - Click picks and Shift-click picks a run; Space, ⌘A and Delete work too.
  - A frosted selection bar pulls up above the account row with the count, Select all, Sort, Move, Delete and Done.
  - Sort opens its own small card: newest, oldest, by name either way, by kind. Folders stay first, and the rows glide into the new order.
  - A mass delete puts every picked row into its own in-place undo.
  - Move opens a Move to card in the same place as Sort (asking for the other one turns the card's page). The picked rows glide into the folder together, on one clock. Picked pins stay, and the card says so in one line: "1 pinned stays".
  - The two places, and what is in them, are never picked; they keep their glyphs.
- **Search reads inside chats and documents.** The tree filters in place and keeps its shape. A name that matches shows its words on a soft gold wash. An item that matches in its text grows a second line: a short snippet that starts a few words before the match, feathered where it is cut, pulling focus as it arrives. Opening a result opens the chat at the matching turn and brushes it once in gold. Typing settles for 120ms before the tree follows.
- **The account card is a system panel, not an app menu.**
  - Identity comes first: the monogram, the name, the organisation and where the data lives ("Synced").
  - Then a Control Center strip that acts in place: Appearance (Auto, Light, Dark; the page cross-fades), Calm motion, and Compact rows (the rows reflow in one move).
  - Then one icon column: Settings, Library, Data ›, Help ›. The last two are pages of the same card.
  - Last is a quiet system line, as About This Mac has: "EXPIRA Console 45 · Kernel 2.18".
  - The card keeps its own type scale (the sidebar's density never reaches it) and lays itself out from its own width with container queries, so it stays whole and centred at any dock width.
  - Positions inside it are proportional, never measured: the appearance pill steps in its own width, so it is centred on its choice at every size.
  - Narrow, the switch keeps its icons and the tiles stack one per row with full names.
  - Resizing the dock keeps an open card open, and its change of shape is animated. Each piece that moved glides from where it was on the curve with a motion blur, labels that return pull focus, and the card eases to its new height.
  - The identity row opens an Account page (name, organisation, storage).
  - The tiles act out their state: Calm's waves settle flat, and Compact's lines draw together. Their wells dip slightly under a press (the well, never the text).
- **Direct manipulation.**
  - Drag onto a folder; a closed folder springs open if you linger, as in Finder.
  - Pull the sidebar's edge to resize it. The width is remembered.
  - Pull the edge far enough left and the sidebar docks shut.
  - Arrows walk the tree: right opens, left closes or climbs, F2 renames, and Delete deletes and undoes.
- **Rearrange without dragging.**
  - `…` › Rearrange lifts the row onto its own surface. The ‹ › buttons, turned upright as ˄ ˅, stand where the `…` was.
  - Each press moves it one place within its group, and the rows glide on the one curve. A button dims at the end of its group, so a row never crosses from pins to unpinned or from folders to items.
  - ↑ and ↓ do the same while arranging, and ⌥↑ and ⌥↓ work on any focused row without the menu. A click elsewhere, Escape or Enter sets it down.
  - A level arranged by hand keeps that order. New arrivals go to the top of their group, and choosing a Sort hands the order back to the sort.
  - A reorder never drops keyboard focus: the row that had it keeps it.
- **Touch is a first-class pointer.** On a touch screen (`pointer: coarse`, whatever the width) rows are 36px tall at the same type size, the `…` is always there at low contrast, and there is no hover plate. A long press (450ms, broken by 8px of movement) lifts the row onto its own surface and opens its menu at the finger; the tap that follows is swallowed. Dragging is off on touch: Rearrange and Move to cover it.
- **On a phone the dock is a drawer.** Below 760px wide (the shell's own breakpoint) the sidebar slides over the chat, at most 86% of the screen, over a soft scrim. It opens from the sidebar button or a pull from the left edge, follows the finger, and lets go on the dock's own curves from exactly where the finger left it, towards whichever way it was heading. A swipe left, a tap on the scrim, opening a chat, or Escape puts it away. It starts put away.
- **A big tree stays light.** Rows more than a screen from view keep only their box (`content-visibility: hidden`) and are filled in as they come near; containment clips, so it is never applied to a row that can be seen. Each change reads every position once and writes once, animates only what is on or near the screen, and shares one sampled curve between the rows that move. While the list scrolls, positions come from a cache and only the rows crossing the edge change; the hover plate steps aside until the pointer itself moves.
- **Screen readers hear the same calm.** Rows are tree items with their level, position and set size, selection and expansion. One polite voice says what just happened, in the house's words: "Pinned", "Showing Quotations", "Deleted. Undo is available", "Moved 3 to Contracts", "4 results". The path bar is a navigation landmark with the current step marked. The account card is a panel of controls (a dialog), not a menu.

### 4.2 Motion: one curve, focus in and focus out
- **One curve for everything**, entering and leaving alike: fast, then a long soft settle (`--sb-ease` `cubic-bezier(.19,1,.22,1)`). It supersedes the per-direction curves of §3 for EXPIRA surfaces.
- **Large moves get a travel curve.** A curve that is right for a menu is wrong for a whole panel: it covers most of the distance in the first 100 ms and then crawls the last pixels, which reads as "instant, then a stop". The dock closing and a resize settling therefore use `--sb-dock-close` `cubic-bezier(.3,.85,.15,1)` over 720 ms and 760 ms. It still leaves quickly, but it spreads the travel so the eye can follow it, then settles very softly.
- **A large surface dissolves as it slows.** Closing, the dock stays solid through the fast part and fades and blurs over its settle, so its last pixels melt away rather than stop and vanish.
- **Everything that moves has a slight motion blur**, in proportion to its speed and sharp at rest:
  - the dock, up to 1.6px;
  - the sidebar button, up to 2.4px;
  - moving rows, up to 1.1px;
  - the hover plate, up to 1.4px;
  - a resize settling, up to 1.2px.
  
  Moves are sampled from their curve so the blur can follow the speed.
- **Timing:**

  | Token | Duration | Used for |
  |---|---|---|
  | `--sb-in` | 420 ms | appear |
  | `--sb-out` | 320 ms | leave |
  | `--sb-move` | 460 ms | layout moves and the hover plate |
  | `--sb-dock` | 560 ms | the dock |
- **Focus, not just fade.**
  - Anything appearing pulls focus: opacity first, focus last.
  - Anything leaving racks out: focus first, fade after.
  - Only opacity and blur change, so text never changes size.
- **Text never scales or slides.**
  - Rows do not shrink when pressed.
  - Search is the row itself becoming a field in place, with its icon and word fixed.
  - Rows that move do so by whole pixels on the compositor.
  - Only shapes without text may stretch: the hover plate and hairlines.
- **The hover plate.** One soft plate per list surfaces out of a blur, glides between rows on the curve, and stretches along its path with its speed (the mercury bead's rule, §3). It racks out when the pointer leaves.
- **Disclosure is one move.**
  - The rows below move on the curve.
  - Each new row pulls focus the moment it is uncovered, and each leaving row racks out just before it is covered.
  - A closing block keeps its exact box while it fades.
- **One clock per change.** When a card changes (a page switch, a change of shape as the dock resizes, a tile's state), every piece starts on the same frame and runs for the same time (`--sb-move`) on the same curve. That includes the card's height, the old and new pages, each tile's box, the icons and labels, and the rows that move. Nothing arrives early or late.
  - A tile's box is its own layer, so it can morph from its old size to its new one while its icon and label glide inside it, and no text is ever scaled.
  - A change of shape waits a beat (90 ms) for the dock's width to settle across the line, so dragging back and forth over it never flickers.
  - The hover plate holds still for the length of a change, so the pointer landing on new rows cannot start a second clock.
  - The theme cross-fade runs on the same `--sb-move`.
- **Focus resolves before the move ends.** Blur is gone by 60% of the way, so the last stretch of every move is already sharp and nothing snaps into focus at the end. A lingering sub-pixel blur that clears only when the animation stops reads as a jolt.
- **Depth moves with the card.** Every floating card and pill casts a soft, layered shadow (`--sb-depth`): an inner top highlight, a hairline, a near shadow and a long soft one. It grows in as the card arrives and eases away as it leaves, drawn from the same progress value.
- **A theme change is one picture.** The page cross-fades between themes as a whole, and every CSS transition is held while it runs, so no element keeps fading on its own after the page has landed.
- **Optical centring is measured, not judged.** Glyphs are block-level and centred in their boxes, and labels sit on a 1.0 line box. The bench checks the centres to within 0.01px.
- **Corners: just a little rounding** (Amadeus, v45, superseding the rounder macOS values).
  - Floating cards and the selection bar: 6px (`--sb-r-lg`).
  - Modules (tiles, the appearance switch, the search field, the account row, the back and forward buttons): 4px (`--sb-r`).
  - Rows and small controls: 3px (`--sb-r-sm`).
  - Circles stay circles: the monogram, status dots, the tiles' wells.
- **Small surfaces "pull".** Menus and cards use opacity, a small drop and focus on one progress value, with no scale, each on its own layer. Reversal carries on from where it is.
- **The dock.**
  - The dock slides out on the curve while its content racks out and drifts a little behind it (depth).
  - The sidebar button travels with it: from the dock's top right, across the dock, into the head of the chat, on the dock's own curve and time, so it lands as the dock leaves at any width. While moving fast it blurs and stretches a little along its path, and it is sharp again as it settles. Opening sends it back.
  - Its hover previews where it will send the dock: open, the pane narrows and the chevron leans left; docked, the pane widens and the chevron leans right.

### 4.3 Colour: the improved EXPIRA stack
The full palette is in `brand_assets/palette.json`, and §2 lists the ten colours. The stack below assigns their roles for EXPIRA surfaces.

**Dark: near black, built from the brand ink rather than neutral grey.**
- **Surfaces**, stepping up as they come forward:

  | Surface | Hex |
  |---|---|
  | sidebar | `#04060B` |
  | page | `#06090F` |
  | sheet | `#090D15` |
  | well | `#0A0E17` |
  | panel | `#0C111B` |
- **Text:**

  | Token | Hex | Colour | Use | Contrast |
  |---|---|---|---|---|
  | `--text`, `--ink` | `#F7F5F0` | off-white | default text | 17–19:1 |
  | `--soft` | `#A9ADB5` | between light grey and steel | secondary | 8–9:1 |
  | `--mute` | `#7D838E` | steel grey | captions | 4.7–5.3:1, AA on every surface, a hovered row included |
- **Hairlines:** off-white at 5.5%, 10% and 19%.
- **Gold:**

  | Hex | Colour | Roles |
  |---|---|---|
  | `#C9A35C` | light gold | rules, focus rings, gold text, the live dot, the pin ring |
  | `#E9CF91` | pale gold | highlights |
- **Selection:** a warm grey, gold 9% over the second hairline. It is the only colour a resting row carries.
- **Menus are frosted glass:** the panel at 80% over a 22px backdrop blur with 1.5 saturation, a hairline border and a deep, soft shadow.

**Light:** the Gate A paper palette of §2 stands. Surfaces are warm paper and ink is brand navy `#0B1A3F`. Decorative gold is `#A8862F` and gold text is `#846936`. The same roles apply: one warm selection, gold only where it means something.

**Type:** chrome size throughout the sidebar and menus.
- Rows are 11px on 24px, and meta is 10px.
- Labels are 9.5px (the floor, §2), in Inter at 400.
- The display serif appears only as an accent.

**The account row** is a macOS popup button in EXPIRA dress.
- The monogram is set in the display italic on a quiet disc, and its ring warms to gold when the row is hovered or open.
- The name and org sit on two lines.
- The indicator is macOS's pair of up and down chevrons. Hovered, they part a little; open, they turn inward and meet, so the same mark reads as "close".

### 4.4 Tokens
The sidebar's tokens are:
- motion: `--sb-ease`, `--sb-in`, `--sb-out`, `--sb-move`, `--sb-dock`, `--sb-dock-close`, `--sb-dock-out`, `--sb-settle`;
- scale: `--sb-fs`, `--sb-fs-2`, `--sb-row`, `--sb-ic`, `--sb-indent`;
- width: `--sb-w`.

They live in `bench/drafts/sidebar-next.css`, and the dark stack lives in `bench/drafts/dark-next.css`. On promotion they move into `src/tokens.css` under the same names: the `--sb-*` motion tokens become the EXPIRA-wide motion tokens, and the dark stack replaces the `@dark` block.

## 5. Build habits

- **Master-template layout:** a wide thread with a 72-character prose measure, and a dock with the composer controls underneath it.
- **Performance budgets:**
  - animate transform and opacity only;
  - one requestAnimationFrame loop per map, asleep when idle;
  - DOM updates by diff;
  - no layout reads inside animation loops.
- **Build workflow (v41):** edit `console/src/`, never `index.html`; `build.py` assembles the page and refuses duplicate ids or a selector defined in two units. Prove refactors with `qa/styles.js` (computed styles) and `qa/diff.js` (pixels) against a baseline, and ship only on a 0-error smoke test.
- **Tokens (v41):** every value comes from `src/tokens.css`. Spacing is a 4px scale with half steps (`--sp-half`, `--sp-1h` … `--sp-4h`) below 20px for dense chrome; a 1px nudge is optical and stays literal. Layers are named (`--z-side`, `--z-menu`, `--z-tip` …) in one stacking order. Dark tokens are written once in `@dark{}`.

## 6. Change log
- **v45 sidebar, finished in the bench** (2026-09-26, Amadeus: "do all the recommendations … very well designed, fully featured, animations, premium … subtle"): see `console/SUPER_PLAN_45.md`.
  - The path bar is always on under Search, and Isolate is a menu choice; the automatic step-in by width is gone. Depth indents 12px for five levels, then 4px.
  - Closed folders roll up running and unread.
  - Archive and Recently Deleted are two quiet places at the foot of the tree (not pages of the account card): date captions, a 30-day countdown, Put back, Delete now, and Empty that asks once in place.
  - Move many from the selection bar. Search inside chats with snippets.
  - Touch rows and long press; the phone drawer with an edge pull and swipe.
  - Scale: 2,000 chats in 212 folders. Measured in this container (about 3× slower than a laptop): opening all 200 folders at once went from 2.5s to 0.2s and a search from 4.4s to 0.2s; everyday moves take 60 to 90ms; scrolling holds about 23ms a frame at trackpad speeds (16.7ms on a normal tree). The fixes: one read pass and one write pass (a class toggled between reads had forced a layout per row), tokens read once per task, no `:has()` on rows, and far rows drawn as boxes.
  - Accessibility: axe is clean in every state (tree, places, menus, select, search, account card).
- **v45 rearrange and pin rules** (2026-09-26, Amadeus: "pins can only be adjusted inside pins locations … folders should always take priority at the top of the pins"):
  - `…` › Rearrange with upright ˄ ˅ buttons in the ‹ › design, plus ↑/↓ and ⌥↑/⌥↓. It works within four groups: pinned folders, pinned items, folders, items. A hand order is kept per level until a Sort is chosen. One clock per press.
  - A pin cannot be dragged or moved into a folder until it is unpinned.
  - Fix: moving a row in the document dropped its keyboard focus, so a second arrow press did nothing. `sync` now gives focus back.
- **v45 pins, Empty and deep nesting** (2026-09-26, Amadeus: "What happens when we have folders inside folders inside folders? … Will it then spawn the <> button?"):
  - Pins sort first within their own level, folders included, in the order they were pinned.
  - "Empty" is now an italic serif line in the muted colour, aligned with the child names. Its old `opacity:.6` fought the focus-in, which ends at 1, and made it jump. Measured: it only falls while its folder closes and only rises while it opens.
  - Deep nesting steps in once a name would drop under about 90px. The path bar brings its own ‹ › and a scrolling, feathered trail; one clock for a step in or out (measured: every tree animation shares one start time).
- **v45 status and fixes** (2026-09-26, Amadeus):
  - Gold now means "needs you": running is a gold dot, finished and unread is a gold ring (with one pulse as a run ends), and opening a chat reads it.
  - Pinned moves to its own small pin mark, and Pin is on the first page of the `…` menu.
  - Fixes:
    - The tiles' well class `.w` collided with the console's streamed-word rule `.w{animation:inkw}`, so toggling Calm restarted Compact's icon. It is renamed `.sb-well`.
    - The theme hold now reaches the tiles' own layers (`::before`), measured at exactly two colour states.
    - The resize can no longer stick after a release the page did not hear.
- **v45 one clock** (2026-09-26, Amadeus: "not synced across all the assets"):
  - A change in a card is one transaction on one clock. Measured: 16 animations share one start and one duration in a change of shape, and 4 in a page switch.
  - Tile boxes morph on their own layer.
  - The narrow switch waits 90 ms: 0 flips while jittering across the line.
  - The hover plate holds during a change.
- **v45 corners and resize** (2026-09-26, Amadeus):
  - Corners are tightened to 6, 4 and 3px everywhere.
  - Back and forward are two separate frosted buttons, placed above the account card.
  - Resizing the dock no longer closes the pull-up: the click that ends a drag stops at the grip.
  - An open card's reflow is animated as the dock compresses or widens.
- **v45 system panel, second refinement** (2026-09-26, Amadeus):
  - The theme swap holds all transitions, so the tiles change with the page.
  - The feather applies only to overflowing text: the Account values and "Calm motion" were losing letters.
  - Account values wrap.
  - Secondary text in the card moves to `--soft` for legibility.
  - An on-tile takes a whole warm tint.
  - Glyph centring was measured at 0.00 to 0.01px.
- **v45 system panel, refined** (2026-09-26, Amadeus: "not centred; Compact clips"):
  - The card has a fixed type scale and container-query layout.
  - The appearance pill is proportional, and was measured centred within 0.02px at 208, 256 and 400px, in both densities and both themes.
  - Tiles stack when narrow, and their glyphs animate their state.
  - The identity row opens an Account page, and Library shows its count.
  - The appearance switch takes left and right arrows.
- **v45 system panel** (2026-09-26, Amadeus):
  - The account card is rebuilt as a system panel: identity with sync status, a Control Center strip (Appearance, Calm motion, Compact), Settings, Library, Data ›, Help ›, and a system line.
  - A shared pager drives both the account card and the row menu. The back and forward pill sits between each card and what opened it.
  - Select many is added, with a selection bar and a Sort card.
  - Soft depth shadows animate with every card.
  - Focus now resolves by 60% of each move, which fixes the late snap into sharpness.
  - Pulling the sidebar shut no longer replays the slide: the remembered width is restored with no transition while docked.
- **v45 dock and layout** (2026-09-26, Amadeus):
  - The dock's close no longer rushes and then stalls. It now has its own travel curve, and it dissolves as it slows.
  - Opening keeps its feel and gains motion blur.
  - Everything that moves blurs slightly with its speed.
  - The resize rubber band tightens to 64px past its maximum and settles back softly.
  - A deleted row offers a trash can beside undo, to delete it at once.
  - The layout follows macOS: a toolbar row, a real search field, the tree, and the account as a popup button (a serif monogram and the up-and-down chevrons).
- **v45 concept** (2026-09-26, Amadeus): §4 EXPIRA × macOS is added as the global house style for the Console and its derivatives.
  - It covers the file-system logic, one curve with focus in and focus out, and the improved near-black stack.
  - The GSSC kernel templates keep their own look.
  - The sidebar draft becomes a file system: folders the person makes, loose chats newest first, no fixed sections, dates, tooltips or ellipses.
  - The row menu becomes a card of pages with back and forward arrows. Rows are resizable, and pulling the edge docks the sidebar.
  - The dock button travels across the dock into the chat with a motion blur, and its hover changes with where it is.
- **v45 draft, in the bench only** (2026-09-26, Amadeus's sidebar notes; `console/bench/sidebar-next.html`; nothing is promoted yet):
  - the sidebar follows Claude's structure: New chat and Search, then the master template's numbered sections, I Files (folders), II Pinned and III Recents;
  - rows are 28px, one hairline apart;
  - no shortcut hints and no Dispatch;
  - settings open from the account pull-up at the foot;
  - motion:
    - one highlight glides between rows on the spring;
    - hovers arrive on `--t-instant` and leave on the soft close;
    - a folder or section opens as one move: the rows below FLIP while each child surfaces from a light blur as it is uncovered, and the guide line draws with them; closing reverses it;
  - the dark theme is near black with off-white text, on the full palette above.
  - **the pull** (Amadeus: "the text sizes change before it closes"): the sidebar's small surfaces (the account pull-up, the row menus, the undo note) no longer use the bloom's scale.
    - Opacity, a 6px drop and the blur ride one progress value on one curve, so the text never shrinks while it is still readable.
    - Each surface keeps its own layer, so its text is not re-rasterised as it starts to move.
    - The shared bloom in `core/pour.js` still scales, text and all; review the other surfaces when this is promoted.
  - **text never scales or slides** (Amadeus: "they look jumpy, like their original size is not linked"):
    - the pressed-row shrink is gone;
    - search no longer swaps in a box that grows: the row itself becomes the field, with the icon and the word fixed in place while the well fades in around them and the word dims to a placeholder;
    - text that closes only fades and blurs;
    - rows that move do so by whole-pixel distances on the compositor.
  - **blur timing reversed for the sidebar** (Amadeus, v45: "fast close, slow entry"):
    - entries resolve out of the blur over `--sb-in` 300 ms, and closes blur away over `--sb-out` 150 ms;
    - this reverses the console-wide v44 rule (a fast push and a slower soft close) for the sidebar only; decide at promotion whether it becomes the rule everywhere.
  - **refinement pass** (Amadeus: "refine the hovers, blur and closes; move the logo to the bottom left; reduce the text; subtler categories"):
    - **Type** is at chrome size: rows are 11px on 24px, meta 10px, labels at the 9.5px floor. The sizes are sidebar tokens (`--sb-fs`, `--sb-row`, `--sb-ic`).
    - **The EXPIRA mark** signs the bottom left under the account row, at half strength until hovered. The top row keeps only the sidebar button, at the left.
    - **Section headers are quieter.** The numeral and label are muted with no gold at rest. On hover the numeral warms to gold, a hairline draws out on the spring, and the caret and actions come out of a blur.
    - **The hover plate** surfaces out of a blur, glides on the spring and stretches along its path in proportion to its speed (the mercury bead's rule), then defocuses away when the pointer leaves.
    - **One focus curve for everything that appears or leaves.** Entering, opacity leads and focus comes last (a lens pulling focus, `--sb-in`). Leaving, focus goes first and the fade follows (racking out, `--sb-out`). The pull-up's surfaces use the same map.
    - The plus in New chat turns a quarter on the spring when hovered.
  - fully featured:
    - a row menu (from `…` or a right-click): pin, rename, move to a folder, archive, delete with undo;
    - rename in place (F2);
    - new folder, named as it lands;
    - a Recents filter: all, documents, running;
    - drag a chat or a file onto a folder;
    - arrow-key navigation (right opens, left closes or climbs);
    - the list feathers at an edge while more lies beyond it;
    - long names show in full on hover.
- **v44** (2026-09-26, Amadeus's super plan, `console/SUPER_PLAN.md`):
  - faster and softer: entry 160 ms, the soft close 280 ms, layout moves 300 ms;
  - the pour is retired: cards, menus, settings, the full-screen map and the document open by blooming out of a blur in place and close back into it, never returning to the click point; large surfaces blur their content only;
  - the full-screen map has one side pane with linked tabs: Details (the Details rail docks inside while full screen is open), Weighing (the ledger) and Log. A click on a node, claim or source opens Details there; a desk's details link to its lines in the log, and a log line naming a desk opens that desk. The map opens already drawn instead of replaying;
  - in full screen the columns spread wider, and what is out of focus dims to 42% instead of 20%, so labels stay readable;
  - settings: clicking the open tab no longer rebuilds it; the start page's preset briefs are gone; every run card opens on the log;
  - the Details rail swaps content with a short blur cross-fade instead of a sliding spring.
- **v43** (2026-09-26, after Amadeus's notes on the sidebar, card stutter and repeated Enter):
  - layout moves are one continuous move (after Amadeus's v55 notes: the transform-only version re-wrapped the text before or after the move, which read as a jump). The sidebar's margin and the chat's margin run on the time and curve of the panel that causes them (the sidebar on --ease-inout; the Details rail and the Dispatch on the spring as they arrive and the soft close as they leave), so the chat column, its text and the composer travel with the panel frame by frame. On a wide window the rail and the Dispatch come in from past the edge, so the panel's edge and the chat's edge move together. The fold button and the title FLIP against where the layout starts, on the same curve, so their path is one line. This is a deliberate exception to "transform and opacity only": the chat's own width is what moves;
  - the sidebar header keeps the fold button's height after the button leaves it, so the items below never jump up;
  - the Dispatch always opens: with nothing filed yet it shows a quiet page saying what will appear there, with a Write a brief button; its maps wake after the panel lands;
  - Enter: the brief shows and the run goes busy on the same frame; the kernel loads after. A held or repeated Enter cannot start a second run, and an empty Enter during a run does nothing (Stop or Esc stops it).
- **v42** (2026-09-26, after Amadeus's Gate B notes):
  - disclosures open and close on one timeline: the card's frame is drawn as a top cap, a band scaled on Y and a bottom cap that travels, so the frame follows the edge; what sits below moves with the same curve; each line of the body rises in as the edge passes it and, on the way back, fades just before the edge reaches it; a container's own drawing (a rail) shows only once it is wholly inside. No line is ever drawn outside the card. Transform and opacity only;
  - one fixed place for details: the Details rail, docked on the right, where the chat makes room for it. A hover or focus previews (citations, ledger rows, sources, map nodes with live numbers, the token raster readout, chat previews); a click pins, with the back stack for going deeper; the pinned item's own hover never re-previews it; with nothing pinned the last preview stays so its links can be followed. It steps aside for the Dispatch and sits beside the full-screen map. Short control labels stay beside their control. On a narrow window hovers keep their small cards and only a click opens the rail.
- **v41 shipped** (2026-09-26, Phase 4 review and republish):
  - every disclosure (run card, log, exhibits, folders) opens by showing the body as it rises and closes by fading it on `--t-exit` with the soft close; in both directions what sits below glides to its new place with FLIP, transform only;
  - the mercury slide, the lightbox, the greeting, the thumbnails and the composer's focus lift move only transform and opacity; the composer's lift is its own shadow plate fading in;
  - the ready light breathes three times and rests, and nothing loops while the page is settled (`qa/perf.js`);
  - small gold text uses `--gold-ink`, which clears AA; quiet text on hovered or chosen rows uses `--soft`; message actions are no longer dimmed.
- **v41 Phase 3** (2026-09-26, the build):
  - the maps are one canvas plate each, drawn from one timed graph, with the numbers, focus and tooltips in the DOM; one rAF loop per map that sleeps when idle;
  - the token raster replaces the spectrogram: five fixed token classes per quarter second, thinking drawn as dotted cells, painted only when a frame arrives;
  - blur is kept to small surfaces (menus, cards, toasts, tips); streamed words, headings, exhibits and the ledger rise with transform and opacity;
  - nothing overshoots: the document sheet and caret settle on the critically damped spring; the live-label sheen, swell and caret are transform or opacity only;
  - the palette highlight follows the pointer and the keys without redrawing, and every control audited (`qa/hovers.js`) has hover, press and focus states;
  - storage goes through one adapter, with export and import of the whole library, and no built-in name.
- **v41 Gate A** (2026-09-25; decisions only, the build follows):
  - the pour is the surface-tension droplet, with no meniscus rim;
  - exits are a luxury soft close with a light blur transition;
  - the motion vocabulary is five durations, three curves and one critically damped spring;
  - the colour tokens are tied to the brand stack, with AA text in both themes and a validated chart palette;
  - the spectrogram becomes a token raster;
  - chats get per-viewer storage (see REBUILD_PLAN);
  - "Decision agent" is relabelled Arbiter, and the orchestrator shows its real effort;
  - the start page's hidden WebGL loop is removed and the grain is rendered once.
- **v40:**
  - the console's orchestrator plans, staffs and decides at high effort; desks run high by default and medium only for low-level work;
  - the decision desk is folded into the orchestrator.
- **v39** (built on v37; v38 was reverted):
  - menus and sheets pour open with a rippling liquid crest, tinted while moving, content revealed in the wake;
  - clip-path reveals end past the shadow;
  - a transform-only indicator in the settings nav;
  - web research through Exa.
