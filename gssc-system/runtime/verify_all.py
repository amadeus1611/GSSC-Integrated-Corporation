#!/usr/bin/env python3
"""One command that verifies the whole GSSC document system.

  1. Package preflight (hashes, parts, changelog discipline).
  2. For every document in derivatives/build.json: build it with
     build_derivative.py, run render_check.py (real fonts: overflow,
     collision, breach), and run the kernel audit suite.

An audit failure passes only if build.json lists it with a reason. An
exception that has started passing is reported so it can be removed.

    python3 verify_all.py            rebuild every document in place, then verify
    python3 verify_all.py --check    build to a temp dir and also FAIL if a committed
                                     .html differs from a fresh build (stale output)
Exit 0 = PASS, 1 = FAILED.
"""
import argparse
import json
import pathlib
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
PKG = ROOT / "package" / "GSSC_Master_Package_v2_17_0.json"
AUDITS = ["boxcheck", "chsaudit", "numbercheck", "tocgen", "governanceaudit", "colouraudit", "typeaudit",
          "figcheck", "gridbalance", "futureproof", "a11yaudit", "geometryaudit", "parityaudit", "contrastaudit"]


def run(*args):
    r = subprocess.run([sys.executable, *map(str, args)], cwd=HERE, capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()

    ok = True
    code, out = run("gssc_runtime.py", "preflight", PKG)
    print("preflight: %s" % ("PASS" if code == 0 else "FAILED"))
    if code:
        print(out)
        return 1

    manifest = json.loads((ROOT / "derivatives" / "build.json").read_text(encoding="utf-8"))
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="gssc_verify_"))
    for doc in manifest["documents"]:
        src = ROOT / "derivatives" / doc["src"]
        committed = ROOT / "derivatives" / doc["out"]
        out_path = tmp / committed.name if a.check else committed
        args = ["build_derivative.py", src, "-o", out_path]
        if doc.get("second_signatory"):
            args += ["--second-signatory", doc["second_signatory"]]
        code, out = run(*args)
        problems, notes = [], []
        if code:
            problems.append("BUILD " + out.strip())
        else:
            if a.check and (not committed.exists() or committed.read_bytes() != out_path.read_bytes()):
                problems.append("committed %s is stale -- run verify_all.py without --check and commit" % committed.name)
            code, out = run("render_check.py", out_path)
            if code:
                problems.append("RENDER " + " | ".join(l.strip() for l in out.splitlines() if "FAIL" in l or "OVERFLOW" in l
                                                       or "COLLISION" in l or "BREACH" in l or "FONTS" in l)[:400])
            expected = doc.get("expected_audit_failures", {})
            for audit in AUDITS:
                code, out = run("gssc_runtime.py", audit, PKG, "--file", out_path)
                passed = "RESULT: PASS" in out
                if not passed and audit not in expected:
                    problems.append("AUDIT %s failed" % audit)
                elif passed and audit in expected:
                    notes.append("%s now passes -- remove its exception from build.json" % audit)
        ok &= not problems
        print("%-40s %s" % (committed.name, "PASS" if not problems else "FAILED"))
        for p in problems:
            print("    " + p)
        for n in notes:
            print("    note: " + n)
    print("RESULT: %s" % ("PASS" if ok else "FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
