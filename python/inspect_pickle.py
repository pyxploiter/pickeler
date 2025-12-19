import argparse
import pickle
import pickletools
import json
import os
import io
from typing import Any

# =========================
# SAFE VIEW (NO EXECUTION)
# =========================
def safe_view(path):
    size = os.path.getsize(path)
    filename = os.path.basename(path)

    # Best-effort protocol detection
    protocol = "unknown"
    try:
        with open(path, "rb") as f:
            first = f.read(2)
            if first and first[0] == 0x80:
                protocol = first[1]
    except Exception:
        pass

    # Best-effort structure guess (NO unpickle)
    structure_hints = set()
    try:
        with open(path, "rb") as f:
            data = f.read()
            for opcode, _, _ in pickletools.genops(data):
                if opcode.name in {"EMPTY_DICT", "DICT"}:
                    structure_hints.add("dict")
                elif opcode.name in {"EMPTY_LIST", "LIST", "APPENDS"}:
                    structure_hints.add("list")
                elif opcode.name == "EMPTY_TUPLE":
                    structure_hints.add("tuple")
    except Exception:
        pass

    return {
        "file": filename,
        "size_bytes": size,
        "pickle_protocol": protocol,
        "structure_hints": sorted(structure_hints),
        "note": "Safe mode: no deserialization performed"
    }


# =========================
# RAW SERIALIZER (FULL MODE)
# =========================
def serialize(
    obj: Any,
    depth: int,
    max_depth: int,
    max_items: int,
    array_preview: int,
    df_preview_rows: int,
):
    if depth >= max_depth:
        return "<truncated>"

    if obj is None or isinstance(obj, (int, float, bool, str)):
        return obj

    if isinstance(obj, (list, tuple)):
        return [
            serialize(
                x,
                depth + 1,
                max_depth,
                max_items,
                array_preview,
                df_preview_rows,
            )
            for x in obj[:max_items]
        ]

    if isinstance(obj, dict):
        return {
            str(k): serialize(
                v,
                depth + 1,
                max_depth,
                max_items,
                array_preview,
                df_preview_rows,
            )
            for k, v in list(obj.items())[:max_items]
        }

    # numpy (optional)
    try:
        import numpy as np
        if isinstance(obj, np.ndarray):
            return obj.flatten()[:array_preview].tolist()
    except Exception:
        pass

    # pandas (optional)
    try:
        import pandas as pd
        if isinstance(obj, pd.DataFrame):
            return obj.head(df_preview_rows).to_dict()
    except Exception:
        pass

    return repr(obj)


# =========================
# FULL VIEW
# =========================
def full_view(
    path,
    max_depth,
    max_items,
    array_preview,
    df_preview_rows,
):
    with open(path, "rb") as f:
        obj = pickle.load(f)

    return serialize(
        obj,
        depth=0,
        max_depth=max_depth,
        max_items=max_items,
        array_preview=array_preview,
        df_preview_rows=df_preview_rows,
    )


# =========================
# Entry
# =========================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument("path")
    parser.add_argument("--mode", choices=["safe", "full"], default="safe")

    # limits (configurable from VS Code)
    parser.add_argument("--max-depth", type=int, default=5)
    parser.add_argument("--max-items", type=int, default=100)
    parser.add_argument("--array-preview", type=int, default=20)
    parser.add_argument("--df-preview-rows", type=int, default=10)

    args = parser.parse_args()

    if args.mode == "safe":
        result = safe_view(args.path)
        print(json.dumps(result, indent=2))
    else:
        result = full_view(
            args.path,
            args.max_depth,
            args.max_items,
            args.array_preview,
            args.df_preview_rows,
        )
        print(json.dumps(result, indent=2))
