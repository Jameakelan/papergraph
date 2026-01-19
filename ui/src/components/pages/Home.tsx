import { useState } from "react";
import { Link } from "react-router-dom";
import { useProjectData } from "../../hooks/useProjectData";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Inbox } from "../features/Inbox"; // New Import
import { Folder, Plus, Trash2, BookOpen, FlaskConical } from "lucide-react"; // Icons

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
      <div className="max-w-6xl mx-auto space-y-8">
        {" "}
        {/* Increased max-width */}
        <header className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <FlaskConical className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              PaperGraph
            </h1>
          </div>
          <p className="text-[var(--color-text-muted)] ml-14">
            Manage your research projects and knowledge graphs.
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Projects (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Folder className="w-5 h-5 text-[var(--color-primary)]" />
                All Projects
              </h2>

              {loading ? (
                <div className="text-center py-12 text-[var(--color-text-muted)]">
                  Loading projects...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Project Card (always first) */}
                  <Card className="h-full border-dashed border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] bg-transparent">
                    <form
                      onSubmit={handleCreate}
                      className="flex flex-col h-full justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          New Project
                        </h3>
                        <Input
                          placeholder="Project Name..."
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="bg-[var(--color-bg-app)]"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={!newProjectName.trim()}
                        variant="secondary"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                      </Button>
                    </form>
                  </Card>

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

                  {/* Demo project static link if DB is empty/fails */}
                  {projects.length === 0 && (
                    <Link to="/project/demo" className="block group">
                      <Card className="h-full hover:border-[var(--color-primary)] transition-colors cursor-pointer group-hover:shadow-[var(--shadow-lg)]">
                        <div className="flex flex-col h-full gap-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                              <BookOpen className="w-5 h-5 text-orange-400" />
                            </div>
                            <h3 className="font-bold text-lg group-hover:text-[var(--color-primary)] transition-colors">
                              Demo Project
                            </h3>
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-auto pt-4 flex gap-2 items-center">
                            <span className="bg-[var(--color-bg-surface-hover)] px-2 py-1 rounded">
                              Static
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: Inbox (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            <Inbox />

            {/* Quick Links or Stats could go here */}
            <Card title="Quick Stats">
              <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
                <div className="flex justify-between">
                  <span>Active Projects</span>
                  <span className="font-mono">{projects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Agent Status</span>
                  <span className="text-green-400">Online</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
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
    <div className="relative group h-full">
      <Link to={`/project/${project.id}`} className="block h-full">
        <Card className="h-full hover:border-[var(--color-primary)] transition-all cursor-pointer group-hover:shadow-[var(--shadow-lg)] group-hover:-translate-y-1 duration-200">
          <div className="flex flex-col h-full gap-2">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Folder className="w-5 h-5 text-blue-400" />
              </div>
              {/* Delete button positioned absolute or here, let's keep it clean */}
            </div>

            <h3 className="font-bold text-lg group-hover:text-[var(--color-primary)] transition-colors truncate">
              {project.name}
            </h3>

            {project.description && (
              <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="text-xs text-[var(--color-text-muted)] mt-auto pt-4 border-t border-[var(--color-border)]/50">
              Created: {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>
        </Card>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-4 right-4 p-1.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-[var(--color-bg-surface-hover)] rounded-md transition-all opacity-0 group-hover:opacity-100"
        title="Delete Project"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
