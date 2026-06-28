#!/usr/bin/env python3
"""
Independent, CPU-only validation of the Sakana Fugu / TRINITY "learned model
orchestration" claim. Only requires numpy.

  PART B  Mechanism validation (DEFAULT, fully self-contained). We reproduce
          the central claim — that a tiny linear router, trained gradient-free
          with sep-CMA-ES, can orchestrate a pool of specialist models to beat
          the best single one — on a synthetic heterogeneous worker pool.
          sep-CMA-ES is re-implemented from scratch here. Only needs numpy;
          NO third-party code is downloaded or executed.

  PART A  Control-flow validation (OPT-IN). Drives the *real* Coordinator loop
          from openfugu's mini.py (Apache-2.0, github.com/trotsky1997/openfugu)
          with a scripted router + mock worker pool — no weights, no API keys.
          To keep this repo from silently downloading and executing third-party
          code, Part A only runs if YOU point it at a local copy of mini.py:

              # you fetch it yourself, then:
              python research/fugu/validate.py --mini /path/to/openfugu/mini.py
              # or:  FUGU_MINI=/path/to/mini.py python research/fugu/validate.py

Run:  pip install numpy && python research/fugu/validate.py
"""
from __future__ import annotations
import argparse, importlib.util, json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))


def load_mini(path):
    """Import a *local* openfugu mini.py the user explicitly provided. We never
    download it — the user supplies the path, keeping third-party code opt-in."""
    if not path or not os.path.exists(path):
        return None
    spec = importlib.util.spec_from_file_location("mini", path)
    mini = importlib.util.module_from_spec(spec)
    sys.modules["mini"] = mini  # so @dataclass can resolve the module
    spec.loader.exec_module(mini)
    return mini


RESULTS = {}

# ---------------------------------------------------------------------------
# PART A — control-flow validation against the real Coordinator code
# ---------------------------------------------------------------------------
def part_a(mini):
    class ScriptedRouter:
        """Stand-in for FuguRouter: a fixed sequence of (agent_id, role_id)."""
        def __init__(self, script):
            self.script, self.i = list(script), 0
        def route(self, messages, sample=False, agent_mask=None):
            agent_id, role_id = self.script[min(self.i, len(self.script) - 1)]
            self.i += 1
            return {"agent_id": agent_id, "role_id": role_id,
                    "role_name": mini.ROLE_NAMES[role_id],
                    "agent_logits": np.zeros(mini.N_AGENTS),
                    "role_logits": np.zeros(mini.N_ROLES)}

    checks = []

    # A1: Worker -> Verifier(reject) -> Worker -> Verifier(accept) -> ACCEPT end
    coord = mini.Coordinator(ScriptedRouter([(0, 0), (1, 2), (2, 0), (3, 2)]),
                             mini.MockWorker(), sample=False)
    res = coord.run("Solve x.")
    checks.append(("verifier ACCEPT terminates the loop", res.terminated_by == "verifier_accept"))
    checks.append(("terminates before max_turns (early stop on ACCEPT)", len(res.turns) < mini.MAX_TURNS))

    # A2: a cold Verifier at turn 0 is re-routed to Worker
    coord = mini.Coordinator(ScriptedRouter([(0, 2), (1, 2), (2, 2)]),
                             mini.MockWorker(), sample=False, suppress_cold_verifier=True)
    res = coord.run("Solve y.")
    checks.append(("cold verifier at turn 0 is re-routed to Worker", res.turns[0].role_name == "Worker"))

    # A3: suppression off -> raw step_trinity ends as verifier_no_response
    coord = mini.Coordinator(ScriptedRouter([(0, 2)]), mini.MockWorker(),
                             sample=False, suppress_cold_verifier=False)
    res = coord.run("Solve z.")
    checks.append(("raw step_trinity: cold verifier -> verifier_no_response",
                   res.terminated_by == "verifier_no_response"))

    # A4: a Thinker turn is recorded and a Worker turn follows
    coord = mini.Coordinator(ScriptedRouter([(0, 1), (1, 0), (2, 2), (3, 0), (4, 2)]),
                             mini.MockWorker(), sample=False)
    res = coord.run("Decompose then solve.")
    roles = [t.role_name for t in res.turns]
    checks.append(("thinker recorded and a Worker turn follows", "Thinker" in roles and "Worker" in roles))

    # A5: only Solver turns grow the router observation via <reference_thought_N>
    seen = {}
    class ObsSpyWorker(mini.MockWorker):
        def __call__(self, role_name, messages, agent_id):
            if role_name == "Worker":
                return "<think>chain of reasoning</think> answer = 42"
            return super().__call__(role_name, messages, agent_id)
    class SpyRouter(ScriptedRouter):
        def route(self, messages, sample=False, agent_mask=None):
            seen[self.i] = messages[1]["content"]
            return super().route(messages, sample, agent_mask)
    coord = mini.Coordinator(SpyRouter([(0, 0), (1, 0), (2, 2), (3, 2)]),
                             ObsSpyWorker(), sample=False)
    coord.run("Q?")
    grew = any("<reference_thought_0>" in v for k, v in seen.items() if k >= 1)
    checks.append(("solver <think> folded into router observation", grew))

    passed = sum(ok for _, ok in checks)
    RESULTS["control_flow"] = {"checks": [{"name": n, "pass": bool(ok)} for n, ok in checks],
                               "passed": int(passed), "total": len(checks)}
    print("\n[PART A] control-flow validation against the real Coordinator")
    for n, ok in checks:
        print(f"  {'PASS' if ok else 'FAIL'}  {n}")
    print(f"  => {passed}/{len(checks)} checks passed")


# ---------------------------------------------------------------------------
# PART B — mechanism validation
# ---------------------------------------------------------------------------
def sep_cma_es(fitness, dim, n_gen=60, popsize=40, seed=0, sigma0=0.5):
    """Minimal separable (diagonal) CMA-ES — the optimizer family TRINITY uses.
    Maximizes `fitness`. Returns (best_x, best_f, history_of_mean_policy_reward)."""
    rng = np.random.default_rng(seed)
    mean = np.zeros(dim)
    sigma = np.full(dim, sigma0)
    mu = popsize // 2
    w = np.log(mu + 0.5) - np.log(np.arange(1, mu + 1)); w /= w.sum()
    mueff = 1.0 / np.sum(w ** 2)
    cc = 4.0 / (dim + 4.0)
    cs = (mueff + 2) / (dim + mueff + 5)
    c1 = 2.0 / ((dim + 1.3) ** 2 + mueff)
    cmu = min(1 - c1, 2 * (mueff - 2 + 1 / mueff) / ((dim + 2) ** 2 + mueff))
    pc = np.zeros(dim); ps = np.zeros(dim); C = np.ones(dim)
    history, best_x, best_f = [], None, -np.inf
    for g in range(n_gen):
        z = rng.standard_normal((popsize, dim))
        x = mean + sigma * np.sqrt(C) * z
        f = np.array([fitness(xi) for xi in x])
        idx = np.argsort(-f)
        xtop, ztop = x[idx[:mu]], z[idx[:mu]]
        mean_new = w @ xtop
        ps = (1 - cs) * ps + np.sqrt(cs * (2 - cs) * mueff) * (w @ ztop)
        pc = (1 - cc) * pc + np.sqrt(cc * (2 - cc) * mueff) * (mean_new - mean) / sigma
        C = (1 - c1 - cmu) * C + c1 * (pc ** 2) + cmu * (w @ (np.sqrt(C) * ztop) ** 2)
        C = np.maximum(C, 1e-12)
        sigma = np.clip(sigma * np.exp((cs / 2) * (np.linalg.norm(ps) ** 2 / dim - 1)), 1e-6, 1e3)
        mean = mean_new
        if f[idx[0]] > best_f:
            best_f, best_x = f[idx[0]], x[idx[0]].copy()
        history.append(float(fitness(mean)))
    return best_x, best_f, history


def part_b(seed=0, quiet=False):
    rng = np.random.default_rng(seed)
    N_WORKERS, N_TASK, D = 7, 5, 64
    N_TRAIN, N_TEST = 600, 600

    # specialist pool: each worker is strong on 2 of 5 categories, weak elsewhere
    comp = rng.uniform(0.05, 0.30, size=(N_WORKERS, N_TASK))
    for i in range(N_WORKERS):
        comp[i, rng.choice(N_TASK, size=2, replace=False)] = rng.uniform(0.75, 0.95, size=2)

    cat_means = rng.standard_normal((N_TASK, D))
    def make_set(n):
        cats = rng.integers(0, N_TASK, size=n)
        H = cat_means[cats] + 0.6 * rng.standard_normal((n, D))
        return H.astype(np.float64), cats
    Htr, ctr = make_set(N_TRAIN)
    Hte, cte = make_set(N_TEST)
    reward = lambda ids, cats: comp[ids, cats].mean()

    single = np.array([comp[i, cte].mean() for i in range(N_WORKERS)])
    best_single, best_id = float(single.max()), int(single.argmax())
    random_route = float(comp[rng.integers(0, N_WORKERS, size=len(cte)), cte].mean())
    oracle = float(comp[:, cte].max(0).mean())

    fitness = lambda flat: reward((Htr @ flat.reshape(N_WORKERS, D).T).argmax(1), ctr)
    best_x, _, history = sep_cma_es(fitness, N_WORKERS * D, n_gen=60, popsize=40, seed=seed)
    routed = float(reward((Hte @ best_x.reshape(N_WORKERS, D).T).argmax(1), cte))

    lift = 100.0 * (routed - best_single) / best_single
    frac_oracle = 100.0 * routed / oracle
    final = history[-1]
    gens95 = next((g for g, h in enumerate(history) if h >= 0.95 * final), len(history))

    RESULTS["mechanism"] = {
        "n_workers": N_WORKERS, "n_task_categories": N_TASK, "hidden_dim": D,
        "n_train": N_TRAIN, "n_test": N_TEST, "seed": seed,
        "random_routing": round(random_route, 4),
        "best_single_worker": round(best_single, 4), "best_single_worker_id": best_id,
        "learned_router": round(routed, 4), "oracle_upper_bound": round(oracle, 4),
        "lift_over_best_single_pct": round(lift, 1), "pct_of_oracle": round(frac_oracle, 1),
        "generations_to_95pct": gens95,
        "convergence_curve": [round(h, 4) for h in history],
    }
    if not quiet:
        print("\n[PART B] mechanism validation: ES-trained router vs single worker")
        print(f"  pool: {N_WORKERS} specialist workers, {N_TASK} categories, D={D}")
        print(f"  random routing      : {random_route:.3f}")
        print(f"  best single worker  : {best_single:.3f}  (worker #{best_id})")
        print(f"  learned router (ES) : {routed:.3f}")
        print(f"  oracle upper bound  : {oracle:.3f}")
        print(f"  => lift over best single worker: +{lift:.1f}%")
        print(f"  => {frac_oracle:.1f}% of oracle; 95% in {gens95} generations")


def multi_seed(n=8):
    import statistics as st
    lifts, oracles, convs = [], [], []
    for s in range(n):
        part_b(seed=s, quiet=True)
        r = RESULTS["mechanism"]
        lifts.append(r["lift_over_best_single_pct"]); oracles.append(r["pct_of_oracle"])
        convs.append(r["generations_to_95pct"])
    RESULTS["mechanism_multiseed"] = {
        "seeds": n,
        "lift_mean": round(st.mean(lifts), 1), "lift_min": min(lifts), "lift_max": max(lifts),
        "pct_oracle_mean": round(st.mean(oracles), 1),
        "gens_to_95_mean": round(st.mean(convs), 1), "gens_to_95_max": max(convs),
    }
    m = RESULTS["mechanism_multiseed"]
    print(f"\n[multi-seed x{n}] lift +{m['lift_mean']}% (range +{m['lift_min']}…+{m['lift_max']}%), "
          f"{m['pct_oracle_mean']}% of oracle, ~{m['gens_to_95_mean']} gens to converge")


def main():
    ap = argparse.ArgumentParser(description="Validate the Fugu / TRINITY orchestration claim.")
    ap.add_argument("--mini", help="path to a local openfugu mini.py to enable Part A "
                                    "(or set env FUGU_MINI). Part B always runs.")
    args = ap.parse_args()

    mini_path = args.mini or os.environ.get("FUGU_MINI")
    mini = load_mini(mini_path)
    if mini is not None:
        part_a(mini)
    else:
        print("\n[PART A] skipped — provide --mini /path/to/openfugu/mini.py to run "
              "the control-flow check against the real Coordinator.")

    part_b(seed=0)
    multi_seed(8)
    out = os.path.join(HERE, "results.json")
    json.dump(RESULTS, open(out, "w"), indent=2)
    print(f"\nwrote {out}")


if __name__ == "__main__":
    main()
