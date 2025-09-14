import numpy as np

class CounterfactualSimulator:
    def __init__(self, constitution, spread_model):
        self.constitution = constitution
        self.spread_model = spread_model

    def simulate_topk(self, topk_allocs, grid, resources, topo_map):
        results = {}
        for idx, plan in enumerate(topk_allocs):
            exp_life_saved = sum(a["P"] for a in plan)
            results[f"Plan-{idx+1}"] = {"expected_life_saved": exp_life_saved}
        return results
