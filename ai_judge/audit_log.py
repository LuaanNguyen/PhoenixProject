import hashlib
import json

class AuditLedger:
    def __init__(self):
        self.ledger = []

    def log(self, record):
        record_bytes = json.dumps(record, sort_keys=True).encode()
        h = hashlib.sha256(record_bytes).hexdigest()
        self.ledger.append({"hash":h, "record":record})
        return h
