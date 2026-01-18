import { useState } from "react";
import { Link } from "react-router-dom";
import { useProjectData } from "../../hooks/useProjectData";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function Home() {
  const { projects, loading, addProject, deleteProject } = useProjectData();
  const [newProjectName, setNewProjectName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    // Client-side simulation
    const id = newProjectName.toLowerCase().replace(/\s+/g, "-");
    addProject({
      id,
      name: newProjectName,
      created_at: new Date().toISOString(),
    });
    setNewProjectName("");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-main)] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="PaperGraph Logo"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              PaperGraph
            </h1>
          </div>
          <p className="text-[var(--color-text-muted)]">
            Manage your research projects and knowledge graphs.
          </p>
        </header>

        <Card title="Start a New Project">
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                label="Project Name"
                placeholder="e.g. My Ph.D. Research"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </form>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            Loading projects...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => {
                  if (
                    confirm(
                      "Are you sure? This will delete the project and its associated graph file. This action cannot be undone.",
                    )
                  ) {
                    deleteProject(project.id);
                  }
                }}
              />
            ))}
            {projects.length === 0 && (
              <div className="col-span-full text-center py-12 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-lg">
                No projects found. Create one to get started.
              </div>
            )}

            {/* Demo project static link if DB is empty/fails */}
            <Link to="/project/demo" className="block group">
              <Card className="h-full hover:border-[var(--color-primary)] transition-colors cursor-pointer group-hover:shadow-[var(--shadow-lg)]">
                <div className="flex flex-col h-full gap-2">
                  <h3 className="font-bold text-lg group-hover:text-[var(--color-primary)] transition-colors">
                    Demo Project
                  </h3>
                  <div className="text-xs text-[var(--color-text-muted)] mt-auto pt-4">
                    Static demo
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: any;
  onDelete: () => void;
}) {
  return (
    <Link to={`/project/${project.id}`} className="block group relative">
      <Card className="h-full hover:border-[var(--color-primary)] transition-colors cursor-pointer group-hover:shadow-[var(--shadow-lg)]">
        <div className="flex flex-col h-full gap-2">
          <h3 className="font-bold text-lg group-hover:text-[var(--color-primary)] transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
              {project.description}
            </p>
          )}
          <div className="text-xs text-[var(--color-text-muted)] mt-auto pt-4">
            Created: {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>
      </Card>
      <button
        onClick={(e) => {
          e.preventDefault();
          onDelete();
        }}
        className="absolute top-2 right-2 p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-[var(--color-bg-surface-hover)] rounded-full transition-colors opacity-0 group-hover:opacity-100"
        title="Delete Project"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </Link>
  );
}
