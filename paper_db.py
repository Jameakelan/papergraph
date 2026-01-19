#!/usr/bin/env python3
"""Simple SQLite-backed paper tracker with graph export."""
from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
import sys
from pathlib import Path
from typing import Dict, List, Sequence, Set

DEFAULT_DB = Path(__file__).parent / "library" / "db" / "papers.db"
DEFAULT_GRAPH_DIR = Path(__file__).parent / "library" / "graph"


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def ensure_columns(conn: sqlite3.Connection, table: str, columns: Dict[str, str]) -> None:
    existing = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
    for name, ddl in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            bib_text_path TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            paper_id TEXT,
            project_id TEXT,
            title TEXT NOT NULL,
            abstract TEXT,
            keywords TEXT,
            year INTEGER,
            venue TEXT,
            authors TEXT,
            doi TEXT UNIQUE,
            url TEXT,
            tags TEXT,
            relevance TEXT,
            dataset_used TEXT,
            methods TEXT,
            metrics TEXT,
            gap TEXT,
            limitations TEXT,
            future_work TEXT,
            summary TEXT,
            notes TEXT,
            extra TEXT,
            bibtex TEXT,
            added_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER NOT NULL,
            target_id INTEGER NOT NULL,
            relation_type TEXT NOT NULL,
            note TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(source_id) REFERENCES papers(id) ON DELETE CASCADE,
            FOREIGN KEY(target_id) REFERENCES papers(id) ON DELETE CASCADE,
            UNIQUE(source_id, target_id, relation_type)
        );

        CREATE INDEX IF NOT EXISTS idx_papers_title ON papers(title);
        CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id);
        CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id);
        """
    )

    ensure_columns(
        conn,
        "papers",
        {
            "paper_id": "TEXT",
            "project_id": "TEXT",
            "abstract": "TEXT",
            "keywords": "TEXT",
            "relevance": "TEXT",
            "dataset_used": "TEXT",
            "methods": "TEXT",
            "metrics": "TEXT",
            "gap": "TEXT",
            "limitations": "TEXT",
            "future_work": "TEXT",
            "summary": "TEXT",
            "notes": "TEXT",
            "extra": "TEXT",
            "bibtex": "TEXT",
            "file_path": "TEXT",
            "fulltext": "TEXT",
        },
    )
    ensure_columns(
        conn,
        "projects",
        {
            "bib_text_path": "TEXT",
        },
    )
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_papers_paper_id ON papers(paper_id) WHERE paper_id IS NOT NULL;"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_papers_project_id ON papers(project_id) WHERE project_id IS NOT NULL;"
    )
    conn.commit()


def normalize_tags(raw_tags: Sequence[str] | None) -> List[str]:
    tags: List[str] = []
    if not raw_tags:
        return tags
    for tag in raw_tags:
        parts = [p.strip() for p in tag.split(",")]
        tags.extend([p for p in parts if p])
    # Preserve order but remove duplicates
    seen = set()
    unique = []
    for tag in tags:
        if tag.lower() not in seen:
            seen.add(tag.lower())
            unique.append(tag)
    return unique


def split_authors(authors: str | None) -> List[str]:
    if not authors:
        return []
    cleaned = authors.replace(" and ", ",")
    return [part.strip() for part in cleaned.split(",") if part.strip()]


def has_overlap(a: List[str], b: List[str]) -> bool:
    set_a = {x.lower() for x in a}
    set_b = {x.lower() for x in b}
    return bool(set_a & set_b)


def extract_pdf(pdf_path: Path) -> tuple[str, Dict[str, str]]:
    try:
        import pypdf
    except ImportError as exc:  # pragma: no cover - depends on env
        raise SystemExit(
            "pypdf is required for PDF import. Install with 'pip install pypdf'."
        ) from exc

    reader = pypdf.PdfReader(str(pdf_path))
    text_parts = []
    for page in reader.pages:
        text_parts.append(page.extract_text() or "")
    text = "\n".join(text_parts).strip()

    meta: Dict[str, str] = {}
    if reader.metadata:
        md = reader.metadata
        for key in ("title", "author", "subject", "keywords", "creator", "producer", "creation_date", "mod_date"):
            val = getattr(md, key, None)
            if val:
                meta[key] = str(val)
        # pypdf stores raw keys too
        for k, v in md.items():
            if v:
                meta[str(k).lower()] = str(v)
    return text, meta


def guess_year_from_meta(meta: Dict[str, str]) -> int | None:
    for key in ("creation_date", "mod_date", "date"):
        if key in meta and meta[key]:
            digits = "".join(ch for ch in str(meta[key]) if ch.isdigit())
            if len(digits) >= 4:
                try:
                    return int(digits[:4])
                except ValueError:
                    continue
    return None


def maybe_copy_pdf(src: Path, dest_dir: Path, do_copy: bool) -> Path:
    if not do_copy:
        return src
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / src.name
    counter = 1
    while dest.exists():
        dest = dest_dir / f"{src.stem}_{counter}{src.suffix}"
        counter += 1
    shutil.copy2(src, dest)
    return dest


def resolve_paper_id(conn: sqlite3.Connection, key: str) -> int:
    cur = conn.cursor()
    if key.isdigit():
        row = cur.execute("SELECT id FROM papers WHERE id = ?", (int(key),)).fetchone()
        if row:
            return int(row[0])
    for column in ("paper_id", "doi"):
        row = cur.execute(f"SELECT id FROM papers WHERE {column} = ?", (key,)).fetchone()
        if row:
            return int(row[0])
    raise SystemExit(f"Paper not found for key '{key}'. Use id, paper_id, or DOI.")


def cmd_init(args: argparse.Namespace) -> None:
    db_path = Path(args.db)
    conn = connect(db_path)
    init_db(conn)
    print(f"Initialized database at {db_path}")


def insert_paper(
    conn: sqlite3.Connection,
    args: argparse.Namespace,
    tags: List[str],
    keywords: List[str],
    file_path: str | None = None,
    fulltext: str | None = None,
) -> int:
    cur = conn.cursor()
    if args.doi:
        existing = cur.execute("SELECT id FROM papers WHERE doi = ?", (args.doi,)).fetchone()
        if existing:
            print(f"Paper with DOI {args.doi} already exists as id {existing['id']}")
            return int(existing["id"])
    if args.paper_id:
        existing = cur.execute("SELECT id FROM papers WHERE paper_id = ?", (args.paper_id,)).fetchone()
        if existing:
            print(f"Paper with paper_id {args.paper_id} already exists as id {existing['id']}")
            return int(existing["id"])

    cur.execute(
        """
        INSERT INTO papers (
            paper_id, project_id, title, abstract, keywords, year, venue, authors, doi, url, tags,
            relevance, dataset_used, methods, metrics, gap, limitations, future_work, summary, notes, extra,
            bibtex, file_path, fulltext
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            args.paper_id,
            args.project_id,
            args.title,
            args.abstract,
            ", ".join(keywords) if keywords else None,
            args.year,
            args.venue,
            args.authors,
            args.doi,
            args.url,
            ", ".join(tags) if tags else None,
            args.relevance,
            args.dataset_used,
            args.methods,
            args.metrics,
            args.gap,
            args.limitations,
            args.future_work,
            args.summary,
            args.notes,
            args.extra,
            args.bibtex,
            file_path,
            fulltext,
        ),
    )
    conn.commit()
    paper_id = cur.lastrowid
    print(f"Added paper #{paper_id}: {args.title}")
    return int(paper_id)


def cmd_add(args: argparse.Namespace) -> None:
    db_path = Path(args.db)
    conn = connect(db_path)
    init_db(conn)
    tags = normalize_tags(args.tag)
    keywords = normalize_tags(args.keywords)

    insert_paper(conn, args, tags, keywords, file_path=args.file_path, fulltext=args.fulltext)


def cmd_import_pdf(args: argparse.Namespace) -> None:
    pdf_path = Path(args.path)
    if not pdf_path.is_file():
        raise SystemExit(f"PDF not found: {pdf_path}")

    db_path = Path(args.db)
    conn = connect(db_path)
    init_db(conn)

    text, meta = extract_pdf(pdf_path)
    title = args.title or meta.get("title") or pdf_path.stem
    authors = args.authors or meta.get("author")
    year = args.year or guess_year_from_meta(meta)

    keywords = normalize_tags(args.keywords)
    if not keywords and meta.get("keywords"):
        keywords = normalize_tags([meta["keywords"]])
    tags = normalize_tags(args.tag)

    abstract = args.abstract
    if not abstract and text:
        abstract = text.split("\n\n", 1)[0].strip()[:2000]
    summary = args.summary
    if not summary and text:
        summary = text.strip()[:500]

    file_path = maybe_copy_pdf(pdf_path, Path(args.copy_dir), args.copy)
    fulltext = None if args.skip_fulltext else (args.fulltext or text)

    args.title = title
    args.authors = authors
    args.year = year
    args.abstract = abstract
    args.summary = summary
    args.file_path = str(file_path)
    args.fulltext = fulltext

    insert_paper(conn, args, tags, keywords, file_path=str(file_path), fulltext=fulltext)


def cmd_list(args: argparse.Namespace) -> None:
    db_path = Path(args.db)
    conn = connect(db_path)
    init_db(conn)

    clauses = []
    params: List[object] = []
    if args.search:
        clauses.append("(title LIKE ? OR authors LIKE ?)")
        like = f"%{args.search}%"
        params.extend([like, like])
    if args.tag:
        clauses.append("tags LIKE ?")
        params.append(f"%{args.tag}%")
    if args.keyword:
        clauses.append("keywords LIKE ?")
        params.append(f"%{args.keyword}%")

    sql = "SELECT id, paper_id, project_id, title, year, venue, doi, keywords, tags, relevance, dataset_used, methods, file_path, bibtex FROM papers"
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY added_at DESC"
    if args.limit:
        sql += " LIMIT ?"
        params.append(args.limit)


    cur = conn.execute(sql, params)
    rows = cur.fetchall()
    if not rows:
        print("No papers found.")
        return

    for row in rows:
        tag_str = row["tags"] or ""
        keyword_str = row["keywords"] or ""
        detail = []
        if row["year"]:
            detail.append(str(row["year"]))
        if row["venue"]:
            detail.append(row["venue"])
        detail_str = ", ".join(detail)
        print(f"[{row['id']}] {row['title']}" + (f" ({detail_str})" if detail_str else ""))
        if row["paper_id"]:
            print(f"     paper_id: {row['paper_id']}")
        if row["project_id"]:
            print(f"     project_id: {row['project_id']}")
        if row["doi"]:
            print(f"     DOI: {row['doi']}")
        if keyword_str:
            print(f"     Keywords: {keyword_str}")
        if tag_str:
            print(f"     Tags: {tag_str}")
        if row["relevance"]:
            print(f"     Relevance: {row['relevance']}")
        if row["dataset_used"]:
            print(f"     Dataset: {row['dataset_used']}")
        if row["methods"]:
            print(f"     Methods: {row['methods']}")
        if row["file_path"]:
            print(f"     File: {row['file_path']}")
        if row["bibtex"]:
            print("     BibTeX: (stored)")


def cmd_link(args: argparse.Namespace) -> None:
    db_path = Path(args.db)
    conn = connect(db_path)
    init_db(conn)

    source_id = resolve_paper_id(conn, args.source)
    target_id = resolve_paper_id(conn, args.target)

    cur = conn.cursor()
    cur.execute(
        """
        INSERT OR IGNORE INTO relationships (source_id, target_id, relation_type, note)
        VALUES (?, ?, ?, ?)
        """,
        (source_id, target_id, args.type, args.note),
    )
    conn.commit()

    if cur.rowcount == 0:
        print("Relationship already exists; nothing changed.")
    else:
        print(
            f"Linked {source_id} -> {target_id} as '{args.type}'"
            + (f" (note: {args.note})" if args.note else "")
        )


def rows_to_graph(
    conn: sqlite3.Connection, project_id: str | None = None
) -> Dict[str, List[Dict[str, object]]]:
    papers = conn.execute(
        """
        SELECT id, paper_id, project_id, title, abstract, keywords, year, venue, authors, doi, url, tags, relevance,
               dataset_used, methods, metrics, limitations, future_work, summary, extra, bibtex, file_path
        FROM papers
        WHERE (:project_id IS NULL OR project_id = :project_id)
        ORDER BY id
        """,
        {"project_id": project_id},
    ).fetchall()
    links = conn.execute(
        "SELECT source_id, target_id, relation_type, note FROM relationships"
    ).fetchall()

    node_ids: Set[int] = {int(p["id"]) for p in papers}

    nodes = []
    for p in papers:
        tags = normalize_tags([p["tags"]] if p["tags"] else None)
        keywords = normalize_tags([p["keywords"]] if p["keywords"] else None)
        nodes.append(
            {
                "id": p["id"],
                "paper_id": p["paper_id"],
                "project_id": p["project_id"],
                "title": p["title"],
                "abstract": p["abstract"],
                "keywords": keywords,
                "year": p["year"],
                "venue": p["venue"],
                "authors": p["authors"],
                "doi": p["doi"],
                "url": p["url"],
                "tags": tags,
                "relevance": p["relevance"],
                "dataset_used": p["dataset_used"],
                "methods": p["methods"],
                "metrics": p["metrics"],
                "limitations": p["limitations"],
                "future_work": p["future_work"],
                "summary": p["summary"],
                "extra": p["extra"],
                "bibtex": p["bibtex"],
                "file_path": p["file_path"],
            }
        )

    edges = []
    for l in links:
        if project_id and (l["source_id"] not in node_ids or l["target_id"] not in node_ids):
            continue
        edges.append(
            {
                "source": l["source_id"],
                "target": l["target_id"],
                "type": l["relation_type"],
                "note": l["note"],
            }
        )

    return {"nodes": nodes, "links": edges}



def resolve_edge_type(edge: Dict[str, object], nodes_by_id: Dict[int, Dict[str, object]]) -> str:
    base = str(edge.get("type", "related"))
    if base != "related":
        return base

    src = nodes_by_id.get(int(edge["source"]))
    tgt = nodes_by_id.get(int(edge["target"]))
    if not src or not tgt:
        return base

    src_tags = src.get("tags") or []
    tgt_tags = tgt.get("tags") or []
    src_kw = src.get("keywords") or []
    tgt_kw = tgt.get("keywords") or []
    src_auth = split_authors(src.get("authors"))
    tgt_auth = split_authors(tgt.get("authors"))

    overlap_tag = has_overlap(src_tags, tgt_tags)
    overlap_kw = has_overlap(src_kw, tgt_kw)
    overlap_auth = has_overlap(src_auth, tgt_auth)

    if overlap_tag and not overlap_kw and not overlap_auth:
        return "related-tag"
    if not overlap_tag and overlap_kw and not overlap_auth:
        return "related-keyword"
    if not overlap_tag and not overlap_kw and overlap_auth:
        return "related-author"
    if overlap_tag and overlap_kw and not overlap_auth:
        return "related-tag-keyword"
    if not overlap_tag and overlap_kw and overlap_auth:
        return "related-keyword-author"
    if overlap_tag and overlap_kw and overlap_auth:
        return "related-tag-keyword-author"
    if overlap_tag and not overlap_kw and overlap_auth:
        return "related-tag-author"

    return base


def annotate_edges(data: Dict[str, List[Dict[str, object]]]) -> None:
    nodes_by_id = {int(n["id"]): n for n in data.get("nodes", [])}
    for edge in data.get("links", []):
        edge["resolved_type"] = resolve_edge_type(edge, nodes_by_id)


def write_json_graph(data: Dict[str, List[Dict[str, object]]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def escape_label(value: str) -> str:
    return value.replace("\\", "\\\\").replace("\"", "\\\"")


def to_dot(data: Dict[str, List[Dict[str, object]]]) -> str:
    lines = ["digraph Papers {", "  rankdir=LR;", "  node [shape=box, style=rounded];"]
    for node in data.get("nodes", []):
        details = []
        if node.get("paper_id"):
            details.append(f"pid:{node['paper_id']}")
        if node.get("project_id"):
            details.append(f"proj:{node['project_id']}")
        if node.get("year"):
            details.append(str(node["year"]))
        if node.get("venue"):
            details.append(str(node["venue"]))
        detail_str = ", ".join(details)

        label_lines = [escape_label(str(node.get("title", "")))]
        if detail_str:
            label_lines.append(escape_label(detail_str))
        if node.get("authors"):
            label_lines.append(escape_label(f"authors: {node['authors']}"))
        if node.get("keywords"):
            kws = ", ".join(node["keywords"])
            label_lines.append(escape_label(f"keywords: {kws}"))

        label = "\\n".join(label_lines)
        lines.append(f'  "{node["id"]}" [label="{label}"];')

    for edge in data.get("links", []):
        label = escape_label(str(edge.get("resolved_type", edge.get("type", "related"))))
        lines.append(f'  "{edge["source"]}" -> "{edge["target"]}" [label="{label}"];')

    lines.append("}")
    return "\n".join(lines)


def write_dot_graph(data: Dict[str, List[Dict[str, object]]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(to_dot(data), encoding="utf-8")


def cmd_export(args: argparse.Namespace) -> None:
    db_path = Path(args.db)
    conn = connect(db_path)
    init_db(conn)
    data = rows_to_graph(conn, project_id=args.project_id)
    annotate_edges(data)

    json_path = Path(args.json_out)
    dot_path = Path(args.dot_out) if args.dot_out else None

    if args.project_id and json_path.name == "graph.json":
        json_path = json_path.with_name(f"{args.project_id}.json")
    if args.project_id and dot_path and dot_path.name == "graph.dot":
        dot_path = dot_path.with_name(f"{args.project_id}.dot")

    write_json_graph(data, json_path)
    print(f"Wrote graph JSON to {json_path}")
    if dot_path:
        write_dot_graph(data, dot_path)
        print(f"Wrote Graphviz DOT to {dot_path}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Track research papers in SQLite and export graphs.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--db",
        default=str(DEFAULT_DB),
        help="Path to SQLite database (created if missing)",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_p = subparsers.add_parser("init", help="Create tables if they do not exist")
    init_p.set_defaults(func=cmd_init)

    add_p = subparsers.add_parser("add", help="Add a paper")
    add_p.add_argument("--paper-id", dest="paper_id", help="Custom paper identifier")
    add_p.add_argument("--project-id", dest="project_id", help="Project UUID to link")
    add_p.add_argument("--title", required=True, help="Paper title")
    add_p.add_argument("--abstract", help="Paper abstract or notes")
    add_p.add_argument("--authors", help="Author list")
    add_p.add_argument("--year", type=int, help="Publication year")
    add_p.add_argument("--venue", help="Venue or journal")
    add_p.add_argument("--doi", help="DOI identifier")
    add_p.add_argument("--url", help="URL to the paper")
    add_p.add_argument("--dataset-used", dest="dataset_used", help="Datasets used")
    add_p.add_argument("--methods", help="Methods or models used")
    add_p.add_argument("--metrics", help="Evaluation metrics")
    add_p.add_argument("--gap", help="Identified research or method gap")
    add_p.add_argument("--limitations", help="Known limitations")
    add_p.add_argument("--future-work", dest="future_work", help="Future work directions")
    add_p.add_argument(
        "--relevance",
        choices=["low", "medium", "high"],
        help="Subjective relevance rating",
    )
    add_p.add_argument("--file-path", dest="file_path", help="Path to stored PDF")
    add_p.add_argument("--fulltext", help="Full extracted text content")
    add_p.add_argument("--summary", help="Short notes or summary")
    add_p.add_argument("--notes", help="Personal notes or comments")
    add_p.add_argument("--extra", help="JSON or text for additional fields")
    add_p.add_argument("--bibtex", help="BibTeX entry text")
    add_p.add_argument(
        "--keywords",
        action="append",
        help="Keyword (can be repeated or comma-separated)",
    )
    add_p.add_argument(
        "--tag",
        action="append",
        help="Tag (can be repeated or comma-separated)",
    )
    add_p.set_defaults(func=cmd_add)

    import_p = subparsers.add_parser("import-pdf", help="Extract metadata and add from a PDF")
    import_p.add_argument("--path", required=True, help="Path to PDF file")
    import_p.add_argument("--paper-id", dest="paper_id", help="Custom paper identifier")
    import_p.add_argument("--project-id", dest="project_id", help="Project UUID to link")
    import_p.add_argument("--title", help="Paper title override")
    import_p.add_argument("--abstract", help="Paper abstract or notes")
    import_p.add_argument("--authors", help="Author list")
    import_p.add_argument("--year", type=int, help="Publication year")
    import_p.add_argument("--venue", help="Venue or journal")
    import_p.add_argument("--doi", help="DOI identifier")
    import_p.add_argument("--url", help="URL to the paper")
    import_p.add_argument("--dataset-used", dest="dataset_used", help="Datasets used")
    import_p.add_argument("--methods", help="Methods or models used")
    import_p.add_argument("--metrics", help="Evaluation metrics")
    import_p.add_argument("--gap", help="Identified research or method gap")
    import_p.add_argument("--limitations", help="Known limitations")
    import_p.add_argument("--future-work", dest="future_work", help="Future work directions")
    import_p.add_argument(
        "--relevance",
        choices=["low", "medium", "high"],
        help="Subjective relevance rating",
    )
    import_p.add_argument("--summary", help="Short notes or summary")
    import_p.add_argument("--notes", help="Personal notes or comments")
    import_p.add_argument("--extra", help="JSON or text for additional fields")
    import_p.add_argument("--bibtex", help="BibTeX entry text")
    import_p.add_argument("--fulltext", help="Override extracted full text")
    import_p.add_argument("--skip-fulltext", action="store_true", help="Do not store extracted full text")
    import_p.add_argument(
        "--keywords",
        action="append",
        help="Keyword (can be repeated or comma-separated)",
    )
    import_p.add_argument(
        "--tag",
        action="append",
        help="Tag (can be repeated or comma-separated)",
    )
    import_p.add_argument("--copy", action="store_true", help="Copy PDF into library/pdfs")
    import_p.add_argument(
        "--copy-dir",
        default=str(DEFAULT_DB.parent / "pdfs"),
        help="Destination directory when using --copy",
    )
    import_p.set_defaults(func=cmd_import_pdf)

    list_p = subparsers.add_parser("list", help="List stored papers")
    list_p.add_argument("--search", help="Substring search over title/authors")
    list_p.add_argument("--tag", help="Filter by tag substring")
    list_p.add_argument("--keyword", help="Filter by keyword substring")
    list_p.add_argument("--limit", type=int, help="Limit number of rows")
    list_p.set_defaults(func=cmd_list)

    link_p = subparsers.add_parser("link", help="Link two papers (id or DOI)")
    link_p.add_argument("--source", required=True, help="Source paper id or DOI")
    link_p.add_argument("--target", required=True, help="Target paper id or DOI")
    link_p.add_argument(
        "--type",
        default="related",
        help="Relationship type (e.g., cites, extends, compares, uses-dataset)",
    )
    link_p.add_argument("--note", help="Optional note about the link")
    link_p.set_defaults(func=cmd_link)

    export_p = subparsers.add_parser("export", help="Export graph data")
    export_p.add_argument(
        "--project-id",
        help="Filter graph to a specific project and name outputs accordingly",
    )
    export_p.add_argument(
        "--json-out",
        default=str(DEFAULT_GRAPH_DIR / "graph.json"),
        help="Path to write nodes/links JSON (defaults to <project_id>.json when --project-id is set)",
    )
    export_p.add_argument(
        "--dot-out",
        default=str(DEFAULT_GRAPH_DIR / "graph.dot"),
        help="Path to write Graphviz DOT file (defaults to <project_id>.dot when --project-id is set)",
    )
    export_p.set_defaults(func=cmd_export)

    return parser


def main(argv: Sequence[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
