import torch
from .models import LifeScorer, SpreadScorer, FeasibilityScorer, AllocationNet
from .shap_attribution import compute_shap_attribution
from .counterfactual_sim import CounterfactualSimulator
from .audit_log import AuditLedger

class NeuralAIJudge:
    def __init__(self, constitution, input_dims, grid_size):
        self.constitution = constitution
        self.life_scorer = LifeScorer(input_dims["incident"])
        self.spread_scorer = SpreadScorer(input_dims["grid_channels"], grid_size)
        self.feas_scorer = FeasibilityScorer(input_dims["incident"])
        self.alloc_net = AllocationNet(input_dims["incident"], input_dims["resource"])
        self.counterfactual = CounterfactualSimulator(constitution, self.spread_scorer)
        self.audit_ledger = AuditLedger()

    def score_incidents(self, incident_feats, grid_feats, topo_map):
        L = self.life_scorer(incident_feats)
        S = self.spread_scorer(grid_feats)
        OF = self.feas_scorer(incident_feats)
        return L, S, OF

    def allocate_resources(self, incident_feats, resource_feats, grid_feats, topo_map, topk=3):
        L, S, OF = self.score_incidents(incident_feats, grid_feats, topo_map)
        P_matrix = self.alloc_net(incident_feats, resource_feats)  # [n_inc, n_res]
        # Apply hard constraints
        P_matrix = P_matrix * OF.unsqueeze(-1)
        allocations = []
        for i in range(P_matrix.shape[0]):
            for j in range(P_matrix.shape[1]):
                allocations.append({
                    "incident_id": i,
                    "resource_id": j,
                    "P": float(P_matrix[i,j]),
                    "incident": {"L":float(L[i]),"S":float(S[i]),"OF":float(OF[i])}
                })
        # SHAP-style attribution
        shap = compute_shap_attribution(allocations, self.constitution)
        # Monte Carlo counterfactuals
        cf_results = self.counterfactual.simulate_topk([allocations[:topk]], None, None, None)
        # Audit
        audit_hash = self.audit_ledger.log({"allocations": allocations, "shap": shap, "cf": cf_results})
        return allocations, shap, cf_results, audit_hash
