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


def auto_build_links(db_path: Path, project_id: str | None, strategies: List[str], delete_existing: bool = False) -> None:
    conn = connect(db_path)
    
    if delete_existing:
        print(f"Deleting existing relationships for project {project_id if project_id else 'ALL'}...")
        if project_id:
            # Delete relationships where at least one paper belongs to the project
            # Actually, to be safe and consistent with "links in this project", 
            # we should probably only delete links where BOTH are in the project or at least one?
            # Let's delete if Source OR Target is in the project, as that is what shows up in the graph.
            # But wait, relationships table doesn't have project_id. We need to join.
            # SQLite doesn't support JOIN in DELETE easily, so we use subqueries.
            
            # Identify paper IDs in this project
            # DELETE FROM relationships WHERE source_id IN (SELECT id FROM papers WHERE project_id = ?) 
            # OR target_id IN (SELECT id FROM papers WHERE project_id = ?)
            
            # However, checking auto_build_links logic, it only creates links between papers IN the project list.
            # So we should probably only delete links between papers IN the project.
            
            conn.execute("""
                DELETE FROM relationships 
                WHERE source_id IN (SELECT id FROM papers WHERE project_id = ?)
                   AND target_id IN (SELECT id FROM papers WHERE project_id = ?)
            """, (project_id, project_id))
        else:
            # No project ID means we operate on ALL papers (based on current script logic),
            # so we wipe the table? Or just don't support delete without project?
            # The script allows project_id=None to process all.
            conn.execute("DELETE FROM relationships")
        
        print(f"Deleted relationships. Rows affected: {conn.total_changes}")

    # Get all papers for the project
    query = """
        SELECT id, keywords, tags, authors, year
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
            
            matches = []

            # Check Tags
            if "tags" in strategies:
                tags_a = normalize_tags(paper_a["tags"])
                tags_b = normalize_tags(paper_b["tags"])
                if has_overlap(tags_a, tags_b):
                    matches.append("tag")
            
            # Check Keywords
            if "keywords" in strategies:
                keywords_a = normalize_tags(paper_a["keywords"])
                keywords_b = normalize_tags(paper_b["keywords"])
                if has_overlap(keywords_a, keywords_b):
                    matches.append("keyword")
            
            # Check Authors
            if "authors" in strategies:
                authors_a = split_authors(paper_a["authors"])
                authors_b = split_authors(paper_b["authors"])
                if has_overlap(authors_a, authors_b):
                    matches.append("author")

            # Check Year
            if "year" in strategies:
                # Only link if both have years and they are the same
                if paper_a["year"] and paper_b["year"] and paper_a["year"] == paper_b["year"]:
                    matches.append("year")

            if matches:
                link_type = "related-" + "-".join(matches)
                # Try to create bidirectional links
                for source, target in [(id_a, id_b), (id_b, id_a)]:
                    cur = conn.cursor()
                    cur.execute(
                        """
                        INSERT OR IGNORE INTO relationships (source_id, target_id, relation_type)
                        VALUES (?, ?, ?)
                        """,
                        (source, target, link_type),
                    )
                    if cur.rowcount > 0:
                        links_created += 1
                    else:
                        links_skipped += 1
    
    conn.commit()
    conn.close()
    
    print(f"Auto-discovery complete with strategies {strategies}: {links_created} links created, {links_skipped} already existed")


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
    parser.add_argument(
        "--strategies",
        nargs="+",
        default=["tags", "keywords", "authors"],
        choices=["tags", "keywords", "authors", "year"],
        help="Strategies to use for linking",
    )
    parser.add_argument(
        "--delete-existing",
        action="store_true",
        help="Delete existing links for the project before creating new ones",
    )
    args = parser.parse_args()
    
    auto_build_links(Path(args.db), args.project_id, args.strategies, args.delete_existing)


if __name__ == "__main__":
    main()
