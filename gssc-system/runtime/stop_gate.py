#!/usr/bin/env python3
"""Claude Code Stop hook: no session ends with gssc-system changes unverified.

Runs only when gssc-system/ has uncommitted changes. Blocks the stop (exit 2,
reason fed back to Claude) when verify_all.py --check fails, so stale built
outputs, contract violations, collisions and audit regressions are fixed in
the session that caused them. Never traps a session: it steps aside when the
hook is already re-running (stop_hook_active), when Playwright is absent on
this machine, or when the only failure is the brand fonts not loading.
"""
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent


def note(msg):
    print(json.dumps({"systemMessage": "GSSC gate: " + msg}))
    return 0


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}
    if payload.get("stop_hook_active"):
        return 0
    changed = subprocess.run(["git", "status", "--porcelain", "--", "gssc-system"], cwd=REPO,
                             capture_output=True, text=True).stdout.strip()
    if not changed:
        return 0
    try:
        import playwright  # noqa: F401
    except ImportError:
        return note("gssc-system changed but Playwright is not installed here; run runtime/verify_all.py --check before committing.")
    r = subprocess.run([sys.executable, "verify_all.py", "--check"], cwd=HERE, capture_output=True, text=True)
    if r.returncode == 0:
        return note("gssc-system changes verified (verify_all --check PASS).")
    failing = [l for l in r.stdout.splitlines() if l.startswith("    ")]
    if failing and all("FONTS" in l for l in failing):
        return note("verification skipped: brand fonts could not load in this environment.")
    sys.stderr.write("gssc-system has changes that do not pass runtime/verify_all.py --check. "
                     "Fix them (rebuild with verify_all.py, then re-check) before finishing:\n" + r.stdout[-3000:])
    return 2


if __name__ == "__main__":
    sys.exit(main())
