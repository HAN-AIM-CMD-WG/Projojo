from __future__ import annotations

import argparse
from pathlib import Path

from db.initDatabase import Db, create_database_if_needed


def resolve_existing_path(raw_path: str) -> Path:
    candidate = Path(raw_path)
    if not candidate.is_absolute():
        candidate = Path.cwd() / candidate
    resolved = candidate.resolve()
    if not resolved.exists():
        raise FileNotFoundError(f"Bestand niet gevonden: {resolved}")
    return resolved


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Reset the local TypeDB database using a dedicated deterministic seed file."
    )
    parser.add_argument(
        "--schema",
        default="db/schema.tql",
        help="Schema file to install before the seed (default: db/schema.tql)",
    )
    parser.add_argument(
        "--seed",
        default="db/test_seed.tql",
        help="Seed file to install after the schema (default: db/test_seed.tql)",
    )
    args = parser.parse_args()

    schema_path = resolve_existing_path(args.schema)
    seed_path = resolve_existing_path(args.seed)

    print(f"Resetting TypeDB database '{Db.name}'")
    print(f"Using schema: {schema_path}")
    print(f"Using seed:   {seed_path}")

    Db.schema_path = str(schema_path)
    Db.seed_path = str(seed_path)
    Db.reset = True

    try:
        create_database_if_needed()
        print("Deterministic E2E dataset installed successfully")
    finally:
        Db.close()


if __name__ == "__main__":
    main()
