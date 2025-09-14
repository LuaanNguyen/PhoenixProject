# neural_judge.py
import requests
import json
import hashlib
import numpy as np

# Cerebras API Integration
CEREBRAS_ENDPOINT = "https://api.cerebras.net/inference/v1/endpoint/score"

def cerebras_inference(batch_inputs):
    """
    Send scoring batch to Cerebras API and get predictions.
    Expects batch_inputs as a list of dicts with incident + resource features.
    Returns a list of score dicts for each incident/resource pair.
    """
    payload = {"inputs": batch_inputs}
    response = requests.post(CEREBRAS_ENDPOINT, json=payload)
    response.raise_for_status()
    output = response.json()
    return output["scores"]


# Constitution Weights 
CONSTITUTION_WEIGHTS = {
    "L": 0.4,    # loss-of-life
    "CI": 0.2,   # critical infrastructure
    "S": 0.18,   # spread risk
    "LG": 0.1,   # legal obligations
    "OF": 0.07,  # operational feasibility
    "EQ": 0.05,  # equity
    "R": 0.10    # resource cost penalty
}

# SHAP-style deterministic attribution
def deterministic_shap(scores, weights):
    """
    Compute additive contribution of each component to total score P_i.
    """
    contributions = {k: scores[k] * weights[k] for k in weights}
    P_total = sum(contributions.values())
    return contributions, P_total


# Counterfactual / Contrastive Engine
def counterfactual_flip(incident, top_other, features_to_vary, constitution_weights):
    """
    Compute minimal feature changes to flip ranking between two incidents.
    incident: dict of current top incident
    top_other: dict of second incident
    features_to_vary: list of features allowed to change
    """
    deltas = {}
    P1 = sum(incident[k] * constitution_weights[k] for k in constitution_weights)
    P2 = sum(top_other[k] * constitution_weights[k] for k in constitution_weights)

    for f in features_to_vary:
        diff = (P1 - P2) / constitution_weights.get(f, 1e-6)
        deltas[f] = diff

    return deltas  # minimal changes per feature to flip ranking


# Audit log helpers
def sign_audit_log(audit_json):
    """
    Append SHA256 hash to audit log for immutability.
    """
    audit_str = json.dumps(audit_json, sort_keys=True)
    sha256 = hashlib.sha256(audit_str.encode()).hexdigest()
    return sha256


# Main Neural Judge
def neural_judge(incidents, resources, constitution_weights=CONSTITUTION_WEIGHTS):
    """
    incidents: list of dicts with incident features
    resources: list of dicts with resource features
    Returns: allocations, explanations, audit
    """

    # 1. Prepare batch for Cerebras
    batch_inputs = []
    for inc in incidents:
        for res in resources:
            inp = {**inc, **res}
            batch_inputs.append(inp)


    # 2. Run Cerebras scoring
    scores_list = cerebras_inference(batch_inputs)

    # 3. Aggregate scores per incident
    incident_scores = {}
    for i, inc in enumerate(incidents):
        incident_scores[inc["incident_id"]] = {}
        # Assume scores_list matches batch_inputs ordering
        for k in CONSTITUTION_WEIGHTS:
            # Simple aggregation: max over resources
            vals = [scores_list[j][k] for j in range(i, len(scores_list), len(incidents))]
            incident_scores[inc["incident_id"]][k] = max(vals)

    # 4. Compute P_i and SHAP contributions
    ranking = []
    for inc_id, comp in incident_scores.items():
        contrib, P_total = deterministic_shap(comp, constitution_weights)
        ranking.append({
            "incident_id": inc_id,
            "components": comp,
            "contributions": contrib,
            "P": P_total
        })
    # Rank descending
    ranking = sorted(ranking, key=lambda x: -x["P"])

    allocations = []
    for r in resources:
        for inc in ranking:
            if inc["components"]["OF"] == 1:  # safe to assign
                allocations.append({
                    "resource_id": r["resource_id"],
                    "incident_id": inc["incident_id"],
                    "rationale": f"Assigned by top P={inc['P']:.3f}, OF safe",
                })
                break  # assign one resource at a time

    # 6. Counterfactuals / Contrastive
    for i in range(len(ranking)-1):
        top_inc = ranking[i]
        next_inc = ranking[i+1]
        deltas = counterfactual_flip(top_inc["components"], next_inc["components"],
                                     features_to_vary=["L","CI","S"],  # example
                                     constitution_weights=constitution_weights)
        top_inc["contrastive_flip"] = deltas

    # 7. Audit log
    audit_log = {
        "ranking": ranking,
        "allocations": allocations,
        "constitution_weights": constitution_weights
    }
    audit_hash = sign_audit_log(audit_log)

    return {
        "ranking": ranking,
        "allocations": allocations,
        "audit_hash": audit_hash
    }


# Example usage

if __name__ == "__main__":
    # Mock incident/resource data
    incidents = [
        {"incident_id":"I-1","L":0.6,"CI":0.15,"S":0.2,"LG":0,"OF":1,"EQ":0.02,"R":0.1},
        {"incident_id":"I-2","L":0.3,"CI":0.05,"S":0.1,"LG":0,"OF":1,"EQ":0.01,"R":0.05}
    ]
    resources = [
        {"resource_id":"Engine-E12","capacity":5},
        {"resource_id":"Helicopter-H3","capacity":2}
    ]
    result = neural_judge(incidents, resources)
    print(json.dumps(result, indent=2))
