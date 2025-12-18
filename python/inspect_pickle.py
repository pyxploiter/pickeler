import argparse
import pickle
import pickletools
import json
import os
import io
from typing import Any

# =========================
# Limits
# =========================
MAX_DEPTH = 5
MAX_ITEMS = 100
ARRAY_PREVIEW = 20
DF_PREVIEW_ROWS = 10


# =========================
# SAFE VIEW
# =========================
def safe_view(path):
    out = io.StringIO()
    with open(path, "rb") as f:
        pickletools.dis(f.read(), out=out)

    return out.getvalue()


# =========================
# RAW SERIALIZER
# =========================
def serialize(obj: Any, depth=0):
    if depth >= MAX_DEPTH:
        return "<truncated>"

    if obj is None or isinstance(obj, (int, float, bool, str)):
        return obj

    if isinstance(obj, (list, tuple)):
        return [
            serialize(x, depth + 1)
            for x in obj[:MAX_ITEMS]
        ]

    if isinstance(obj, dict):
        return {
            str(k): serialize(v, depth + 1)
            for k, v in list(obj.items())[:MAX_ITEMS]
        }

    # numpy (optional)
    try:
        import numpy as np
        if isinstance(obj, np.ndarray):
            return obj.flatten()[:ARRAY_PREVIEW].tolist()
    except Exception:
        pass

    # pandas (optional)
    try:
        import pandas as pd
        if isinstance(obj, pd.DataFrame):
            return obj.head(DF_PREVIEW_ROWS).to_dict()
    except Exception:
        pass

    # fallback: string representation
    return repr(obj)


# =========================
# FULL VIEW
# =========================
def full_view(path):
    with open(path, "rb") as f:
        obj = pickle.load(f)

    return serialize(obj)


# =========================
# Entry
# =========================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    parser.add_argument("--mode", choices=["safe", "full"], default="safe")
    args = parser.parse_args()

    if args.mode == "safe":
        result = safe_view(args.path)
        print(result)
    else:
        result = full_view(args.path)
        print(json.dumps(result, indent=2))
