import argparse
import pickle
import pickletools
import json
import os
import io

parser = argparse.ArgumentParser()
parser.add_argument("path")
parser.add_argument("--mode", choices=["safe", "full"], default="safe")
args = parser.parse_args()

path = args.path

def safe_view():
    print(f"File: {os.path.basename(path)}")
    print(f"Size: {os.path.getsize(path)} bytes\n")
    print("\n--- pickletools.dis ---\n")
    out = io.StringIO()
    with open(path, "rb") as f:
        pickletools.dis(f.read(), out=out)
    print(out.getvalue())
    print("\n-----------------------\n")

def summarize(obj, depth=0, max_depth=5, max_items=100):
    if depth > max_depth:
        return "<max depth reached>"

    if obj is None or isinstance(obj, (int, float, bool, str)):
        return obj

    if isinstance(obj, (list, tuple)):
        return [summarize(x, depth+1) for x in obj[:max_items]]

    if isinstance(obj, dict):
        return {
            str(k): summarize(v, depth+1)
            for k, v in list(obj.items())[:max_items]
        }

    # numpy
    try:
        import numpy as np
        if isinstance(obj, np.ndarray):
            return {
                "__type__": "ndarray",
                "shape": obj.shape,
                "dtype": str(obj.dtype),
                "preview": obj.flatten()[:20].tolist()
            }
    except Exception:
        pass

    # pandas
    try:
        import pandas as pd
        if isinstance(obj, pd.DataFrame):
            return {
                "__type__": "DataFrame",
                "shape": obj.shape,
                "columns": obj.columns.tolist(),
                "head": obj.head(10).to_dict()
            }
    except Exception:
        pass

    return {
        "__type__": type(obj).__name__,
        "__repr__": repr(obj)[:200]
    }

def full_view():
    with open(path, "rb") as f:
        obj = pickle.load(f)

    result = summarize(obj)
    print(json.dumps(result, indent=2))

if args.mode == "safe":
    safe_view()
else:
    full_view()
