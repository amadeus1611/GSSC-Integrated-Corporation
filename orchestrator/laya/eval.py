#!/usr/bin/env python3
"""Scores the LAYA gate on eval_set.json: accuracy overall, and accuracy on the cases it chose to act on."""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import laya_gate as G

E = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "eval_set.json")))
t = time.time()
rows = {"route": [], "support": [], "firewall": []}
for c in E["route"]:
    r = G.route(c["brief"])["lead"]
    rows["route"].append((r["choice"] == c["lead"], r["action"] == "act", r["p"]))
for c in E["support"]:
    r = G.support([{"claim": c["claim"], "source": c["source"]}])[0]
    right = (r["call"] == "yes") == c["stated"] if r["call"] != "escalate" else None
    rows["support"].append((right, r["call"] != "escalate", r["p"]))
for c in E["firewall"]:
    r = G.firewall(c["text"])
    rows["firewall"].append(((r["call"] == "hold") == c["restricted"], True, r["hits"][0]["p"] if r["hits"] else 0))
secs = time.time() - t


def line(name, rs):
    n = len(rs)
    acted = [r for r in rs if r[1]]
    ok_all = sum(1 for r in rs if r[0])
    ok_act = sum(1 for r in acted if r[0])
    return f"{name}: {ok_all}/{n} right overall; acted on {len(acted)}/{n}, right on {ok_act}/{len(acted)} of those"


print(line("route (lead desk)", rows["route"]))
print(line("support (claim vs source)", rows["support"]))
fw = E["firewall"]
caught = sum(1 for c, r in zip(fw, rows["firewall"]) if c["restricted"] and r[0])
false_hold = sum(1 for c, r in zip(fw, rows["firewall"]) if not c["restricted"] and not r[0])
print(f"firewall tripwire: caught {caught}/{sum(c['restricted'] for c in fw)} restricted, held {false_hold}/{sum(not c['restricted'] for c in fw)} clean")
print(f"{secs:.1f} s for {sum(len(v) for v in rows.values())} cases on this machine")
