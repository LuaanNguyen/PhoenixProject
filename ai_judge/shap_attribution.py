def compute_shap_attribution(allocations, constitution):
    shap_dict = {}
    w = constitution["weights"]
    for alloc in allocations:
        inc = alloc.get("incident", {})
        contrib = {
            "L": w["L"]*inc.get("L",0),
            "CI": w["CI"]*inc.get("CI",0),
            "S": w["S"]*inc.get("S",0),
            "LG": w["LG"]*inc.get("LG",0),
            "OF": w["OF"]*inc.get("OF",1),
            "EQ": w["EQ"]*inc.get("EQ",0),
            "R": -w["R"]*inc.get("R",0)
        }
        shap_dict[alloc["resource_id"]] = contrib
    return shap_dict
