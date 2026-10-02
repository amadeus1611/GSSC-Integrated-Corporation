#!/usr/bin/env python3
"""LAYA gate: the orchestrator's first stop for routing, delegation, evidence and firewall decisions.

LAYA (Convai Innovations, Apache 2.0) is an encoder that answers typed questions (choice, score, yes/no) about a text
in one forward pass. It never writes text, so it cannot invent an option or a fact; it returns probabilities. This gate
turns those into act or escalate: a clear answer is acted on, a grey one goes to the orchestrator's own judgement.

  laya_gate.py route "<brief>"                      lead desk, desks to staff, web or not
  laya_gate.py support claims.json                  second opinion on each claim against its quote or source text
  laya_gate.py firewall <file>                      tripwire for client-facing text (never clears on its own)
  laya_gate.py weigh question.json                  second opinion on a decision between named options

Output is JSON on stdout. Setup: orchestrator/laya/setup.sh. See orchestrator/GROUNDING.md for how results are used.
"""
import json, os, sys, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
PACKS = json.load(open(os.path.join(HERE, "packs.json")))
BARS = PACKS["bars"]
_router = None


def router():
    global _router
    if _router is None:
        from laya import Router  # imported late so --help works without the model
        _router = Router(default="english")  # picks the multilingual checkpoint for non-Latin text on its own
    return _router


def ask(state, questions):
    return router().predict(state, questions)["answers"]


def yes_no(p, yes, no):
    """noul probability -> yes / no / escalate"""
    return "yes" if p >= yes else "no" if p <= no else "escalate"


def route(brief):
    R = PACKS["route"]
    qs = {"lead": R, "web": {"type": "noul", "instructions": PACKS["web"]}}
    qs.update({"role_" + k: {"type": "noul", "instructions": v} for k, v in PACKS["roles"].items()})
    a = ask(brief, qs)
    probs = a["lead"]["probabilities"]
    ranked = sorted(probs.items(), key=lambda kv: -kv[1])
    top, second = ranked[0], ranked[1]
    act = top[1] >= BARS["route_act"] and top[1] - second[1] >= BARS["route_margin"]
    roles = {k: {"p": round(a["role_" + k]["noul"], 3), "call": yes_no(a["role_" + k]["noul"], BARS["role_yes"], BARS["role_no"])}
             for k in PACKS["roles"]}
    web = a["web"]["noul"]
    return {
        "lead": {"choice": top[0], "p": round(top[1], 3), "runner_up": second[0], "margin": round(top[1] - second[1], 3),
                 "action": "act" if act else "escalate", "probabilities": {k: round(v, 3) for k, v in probs.items()}},
        "staff": [k for k, v in roles.items() if v["call"] == "yes"],
        "unsure": [k for k, v in roles.items() if v["call"] == "escalate"],
        "roles": roles,
        "web": {"p": round(web, 3), "call": yes_no(web, BARS["role_yes"], BARS["role_no"])},
    }


def support(claims):
    """claims: [{"id", "claim", "quote" or "source"}] -> LAYA's reading of whether the text states the claim"""
    out = []
    for c in claims:
        text = c.get("quote") or c.get("source") or ""
        if not text.strip():
            out.append({"id": c.get("id"), "call": "no", "p": 0.0, "why": "no quote or source text"})
            continue
        p = ask(text, {"s": {"type": "noul", "instructions": PACKS["support"].format(claim=c["claim"])}})["s"]["noul"]
        out.append({"id": c.get("id"), "p": round(p, 3), "call": yes_no(p, BARS["support_yes"], BARS["support_no"])})
    return out


def firewall(text):
    """a tripwire only: it can hold material, never clear it (its recall on this task is too low to trust alone)"""
    paras = [p for p in text.split("\n\n") if p.strip()] or [text]
    hits = []
    for para in paras:
        p = ask(para[:2000], {"f": {"type": "noul", "instructions": PACKS["firewall"]}})["f"]["noul"]
        if p >= BARS["firewall_hold"]:
            hits.append({"p": round(p, 3), "text": para[:200]})
    return {"call": "hold" if hits else "no-trip", "hits": hits,
            "note": "no-trip is not a clearance; firewall-medium and the pattern scan still decide"}


def weigh(spec):
    """spec: {"question", "options": {key: description}, "evidence": text}"""
    a = ask(spec.get("evidence", ""), {"w": {"type": "choice", "instructions": spec["question"], "criteria": spec["options"]}})["w"]
    probs = a["probabilities"]
    ranked = sorted(probs.items(), key=lambda kv: -kv[1])
    act = ranked[0][1] >= BARS["route_act"] and ranked[0][1] - ranked[1][1] >= BARS["route_margin"]
    return {"choice": ranked[0][0], "p": round(ranked[0][1], 3), "margin": round(ranked[0][1] - ranked[1][1], 3),
            "action": "act" if act else "escalate", "probabilities": {k: round(v, 3) for k, v in probs.items()}}


def main(argv):
    if len(argv) < 3 or argv[1] not in ("route", "support", "firewall", "weigh"):
        print(__doc__)
        return 2
    cmd, arg = argv[1], argv[2]
    read = lambda a: open(a).read() if os.path.exists(a) else a
    if cmd == "route":
        res = route(read(arg))
    elif cmd == "support":
        res = support(json.loads(read(arg)))
    elif cmd == "firewall":
        res = firewall(read(arg))
    else:
        res = weigh(json.loads(read(arg)))
    print(json.dumps(res, indent=1, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
