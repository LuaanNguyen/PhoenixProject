import torch
import torch.nn as nn
import torch.nn.functional as F

# Life loss predictor
class LifeScorer(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 1)
    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return torch.sigmoid(self.fc3(x))  # 0-1

# Spread predictor (grid + topo)
class SpreadScorer(nn.Module):
    def __init__(self, input_channels, grid_size):
        super().__init__()
        self.conv1 = nn.Conv2d(input_channels, 16, 3, padding=1)
        self.conv2 = nn.Conv2d(16, 8, 3, padding=1)
        self.fc1 = nn.Linear(8*grid_size*grid_size, 32)
        self.fc2 = nn.Linear(32, 1)
    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = x.flatten(start_dim=1)
        x = F.relu(self.fc1(x))
        return torch.sigmoid(self.fc2(x))

# Feasibility predictor
class FeasibilityScorer(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, 32)
        self.fc2 = nn.Linear(32, 16)
        self.fc3 = nn.Linear(16, 1)
    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return torch.sigmoid(self.fc3(x))

# Allocation network (GNN / attention placeholder)
class AllocationNet(nn.Module):
    def __init__(self, incident_dim, resource_dim, hidden_dim=64):
        super().__init__()
        self.inc_fc = nn.Linear(incident_dim, hidden_dim)
        self.res_fc = nn.Linear(resource_dim, hidden_dim)
        self.combine_fc = nn.Linear(hidden_dim*2, 32)
        self.out_fc = nn.Linear(32, 1)
    def forward(self, incident_feats, resource_feats):
        # incident_feats: [num_incidents, incident_dim]
        # resource_feats: [num_resources, resource_dim]
        incident_emb = F.relu(self.inc_fc(incident_feats))
        resource_emb = F.relu(self.res_fc(resource_feats))
        # Compute all pairwise combinations
        n_inc, n_res = incident_emb.shape[0], resource_emb.shape[0]
        inc_exp = incident_emb.unsqueeze(1).repeat(1,n_res,1)
        res_exp = resource_emb.unsqueeze(0).repeat(n_inc,1,1)
        combined = torch.cat([inc_exp, res_exp], dim=-1)
        x = F.relu(self.combine_fc(combined))
        return torch.sigmoid(self.out_fc(x)).squeeze(-1)  # [n_inc, n_res]
