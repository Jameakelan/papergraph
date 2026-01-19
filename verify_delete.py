import sqlite3
import urllib.request
import urllib.parse
import json
import time
import os

DB_PATH = "library/db/papers.db"
API_URL = "http://localhost:5173/api"

def verify_delete():
    # 1. Setup Data directly in DB
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Create Project
    project_id = "test-delete-cascade"
    c.execute("INSERT OR REPLACE INTO projects (id, name) VALUES (?, ?)", (project_id, "Test Delete"))
    
    # Create Papers
    c.execute("INSERT INTO papers (project_id, title) VALUES (?, ?)", (project_id, "Paper 1"))
    p1_id = c.lastrowid
    c.execute("INSERT INTO papers (project_id, title) VALUES (?, ?)", (project_id, "Paper 2"))
    p2_id = c.lastrowid
    
    # Create Relationship
    c.execute("INSERT INTO relationships (source_id, target_id, relation_type) VALUES (?, ?, ?)", (p1_id, p2_id, "references"))
    
    # Create Risk Assessment
    c.execute("INSERT INTO risk_assessments (paper_id, overall_bias) VALUES (?, ?)", (p1_id, "Low"))
    
    conn.commit()
    print(f"Created: Project={project_id}, Papers=[{p1_id}, {p2_id}]")
    
    # Verify they exist
    assert c.execute("SELECT count(*) FROM papers WHERE project_id=?", (project_id,)).fetchone()[0] == 2
    assert c.execute("SELECT count(*) FROM relationships WHERE source_id=?", (p1_id,)).fetchone()[0] == 1
    assert c.execute("SELECT count(*) FROM risk_assessments WHERE paper_id=?", (p1_id,)).fetchone()[0] == 1
    
    conn.close()
    
    # 2. Call Delete API
    print("Calling DELETE API...")
    url = f"{API_URL}/projects?id={project_id}"
    req = urllib.request.Request(url, method='DELETE')
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                 print(f"Delete failed: {response.read().decode()}")
                 return
    except urllib.error.HTTPError as e:
        print(f"Delete failed: {e.read().decode()}")
        return
        
    # 3. Verify Deletion
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    papers_count = c.execute("SELECT count(*) FROM papers WHERE project_id=?", (project_id,)).fetchone()[0]
    # Check if papers were actually deleted (not just orphan/null if logic failed)
    # Also check specific IDs
    p1_exists = c.execute("SELECT count(*) FROM papers WHERE id=?", (p1_id,)).fetchone()[0]
    
    rels_count = c.execute("SELECT count(*) FROM relationships WHERE source_id=?", (p1_id,)).fetchone()[0]
    risks_count = c.execute("SELECT count(*) FROM risk_assessments WHERE paper_id=?", (p1_id,)).fetchone()[0]
    
    conn.close()
    
    print("\nResults:")
    print(f"Papers Remaining (by project_id): {papers_count}")
    print(f"Paper 1 Exists: {p1_exists}")
    print(f"Relationships Remaining: {rels_count}")
    print(f"Risk Assessments Remaining: {risks_count}")
    
    if papers_count == 0 and p1_exists == 0 and rels_count == 0 and risks_count == 0:
        print("SUCCESS: All related data deleted.")
    else:
        print("FAILURE: Some data remains.")

if __name__ == "__main__":
    verify_delete()
