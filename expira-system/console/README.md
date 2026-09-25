# EXPIRA Console

`index.html` is the console, published as a Claude artifact.

`lib/gssc-kernel.json` is published beside it and read at run time. It carries the GSSC kernel (all 20 modules),
the execution protocol, the tokenized quotation master, the brand assets with their hashes, and the six derivative
sources. It is generated from `gssc-system/package/GSSC_Master_Package_v2_18_0.json` and `gssc-system/derivatives/`
on the kernel branch; regenerate it when the kernel version changes.

`kernel_builder.js` is the JavaScript port of `gssc-system/runtime/build_derivative.py` that the console embeds.
Built from the six committed sources, it reproduces the Python builder's output byte for byte.

## Source and build (v41 rebuild)

`index.html` is now **build output**. Edit `src/`, then run `python3 build.py` (or `python3 build.py --check` to
confirm `index.html` matches `src/`).
- `src/shell.html` is the page skeleton; each `<!--@include path-->` line pulls in one file, so the shell is the build order.
- `src/tokens.css` and `src/base.css` are shared; `src/units/<unit>/` holds each unit's CSS and JS; `src/core/` is the
  runtime glue (prelude, store, router, kernel, web, planner, run, boot).
- `src/layers/v13…v39.css` are the legacy version layers, kept verbatim until Phase 2.2 folds them into the units.
- The build fails on a missing or doubled include, an orphan file, a duplicate id, or a CSS selector defined in two units.
- `qa/diff.js A.html B.html` compares two builds (DOM and pixels for the example chat, the Dispatch and a mock run, both themes).
