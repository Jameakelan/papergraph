#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path
from typing import List, Set

PAPER_DB = Path(__file__).resolve().parent.parent / "paper_db.py"


def connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def normalize_tags(raw: str | None) -> List[str]:
    if not raw:
        return []
    parts = [p.strip() for p in raw.split(",")]
    return [p for p in parts if p]


def split_authors(authors: str | None) -> List[str]:
    if not authors:
        return []
    cleaned = authors.replace(" and ", ",")
    return [part.strip() for part in cleaned.split(",") if part.strip()]


def has_overlap(a: List[str], b: List[str]) -> bool:
    set_a = {x.lower() for x in a}
    set_b = {x.lower() for x in b}
    return bool(set_a & set_b)


def auto_build_links(db_path: Path, project_id: str | None) -> None:
    conn = connect(db_path)
    
    # Get all papers for the project
    query = """
        SELECT id, keywords, tags, authors
        FROM papers
        WHERE (:project_id IS NULL OR project_id = :project_id)
        ORDER BY id
    """
    papers = conn.execute(query, {"project_id": project_id}).fetchall()
    
    links_created = 0
    links_skipped = 0
    
    # Check each pair of papers
    for i, paper_a in enumerate(papers):
        for paper_b in papers[i + 1:]:
            id_a = paper_a["id"]
            id_b = paper_b["id"]
            
            keywords_a = normalize_tags(paper_a["keywords"])
            keywords_b = normalize_tags(paper_b["keywords"])
            tags_a = normalize_tags(paper_a["tags"])
            tags_b = normalize_tags(paper_b["tags"])
            authors_a = split_authors(paper_a["authors"])
            authors_b = split_authors(paper_b["authors"])
            
            # Check if there's any overlap
            if (has_overlap(keywords_a, keywords_b) or 
                has_overlap(tags_a, tags_b) or 
                has_overlap(authors_a, authors_b)):
                
                # Try to create bidirectional links
                for source, target in [(id_a, id_b), (id_b, id_a)]:
                    cur = conn.cursor()
                    cur.execute(
                        """
                        INSERT OR IGNORE INTO relationships (source_id, target_id, relation_type)
                        VALUES (?, ?, ?)
                        """,
                        (source, target, "related"),
                    )
                    if cur.rowcount > 0:
                        links_created += 1
                    else:
                        links_skipped += 1
    
    conn.commit()
    conn.close()
    
    print(f"Auto-discovery complete: {links_created} links created, {links_skipped} already existed")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Automatically discover and create relationship links between papers",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--project-id",
        help="Limit to papers in a specific project",
    )
    parser.add_argument(
        "--db",
        default=str(Path(__file__).parent.parent / "library" / "db" / "papers.db"),
        help="Path to SQLite database",
    )
    args = parser.parse_args()
    
    auto_build_links(Path(args.db), args.project_id)


if __name__ == "__main__":
    main()
