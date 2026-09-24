# EXPIRA Console

`index.html` is the console, published as a Claude artifact.

`lib/gssc-kernel.json` is published beside it and read at run time. It carries the GSSC kernel (all 20 modules),
the execution protocol, the tokenized quotation master, the brand assets with their hashes, and the six derivative
sources. It is generated from `gssc-system/package/GSSC_Master_Package_v2_18_0.json` and `gssc-system/derivatives/`
on the kernel branch; regenerate it when the kernel version changes.

`kernel_builder.js` is the JavaScript port of `gssc-system/runtime/build_derivative.py` that the console embeds.
Built from the six committed sources, it reproduces the Python builder's output byte for byte.
