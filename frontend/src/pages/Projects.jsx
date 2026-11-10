
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Projects.css";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);

    const [projectData, setProjectData] = useState({
        workspace: "",
        name: "",
        key: "",
        description: ""
    });

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getList = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [projectResponse, workspaceResponse] =
                await Promise.all([
                    api.get("projects/"),
                    api.get("workspaces/")
                ]);

            setProjects(getList(projectResponse.data));
            setWorkspaces(getList(workspaceResponse.data));
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load projects."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setProjectData((previous) => ({
            ...previous,
            [name]: name === "key" ? value.toUpperCase() : value
        }));
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!projectData.workspace) {
            setError("Please select a workspace.");
            return;
        }

        if (!projectData.name.trim()) {
            setError("Please enter a project name.");
            return;
        }

        if (!projectData.key.trim()) {
            setError("Please enter a project key.");
            return;
        }

        try {
            setCreating(true);

            await api.post("projects/", {
                workspace: Number(projectData.workspace),
                name: projectData.name.trim(),
                key: projectData.key.trim().toUpperCase(),
                description: projectData.description.trim()
            });

            setProjectData({
                workspace: "",
                name: "",
                key: "",
                description: ""
            });

            setSuccess("Project created successfully!");
            await fetchData();
        } catch (err) {
            const data = err.response?.data;

            setError(
                data?.detail ||
                data?.name?.[0] ||
                data?.key?.[0] ||
                data?.workspace?.[0] ||
                "Unable to create project. Please check your details."
            );
        } finally {
            setCreating(false);
        }
    };

    const getWorkspaceName = (workspaceId) => {
        const workspace = workspaces.find(
            (item) => String(item.id) === String(workspaceId)
        );

        return workspace?.name || `Workspace #${workspaceId}`;
    };

    return (
        <div className="projects-page">

            <div className="projects-header">
                <div>
                    <p className="projects-breadcrumb">
                        PROJECT MANAGEMENT
                    </p>
                    <h1>Projects</h1>
                    <p className="projects-subtitle">
                        Organize your work and manage projects.
                    </p>
                </div>

                <div className="projects-count">
                    <span>{projects.length}</span>
                    <small>Total Projects</small>
                </div>
            </div>

            <div className="project-create-card">
                <div>
                    <h2>Create a Project</h2>
                    <p>
                        Add a new project to one of your workspaces.
                    </p>
                </div>

                <form onSubmit={handleCreateProject}>
                    <div className="project-form-grid">

                        <div className="project-form-group">
                            <label>Workspace</label>
                            <select
                                name="workspace"
                                value={projectData.workspace}
                                onChange={handleChange}
                            >
                                <option value="">Select Workspace</option>

                                {workspaces.map((workspace) => (
                                    <option
                                        key={workspace.id}
                                        value={workspace.id}
                                    >
                                        {workspace.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="project-form-group">
                            <label>Project Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="e.g. Website Development"
                                value={projectData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="project-form-group">
                            <label>Project Key</label>
                            <input
                                type="text"
                                name="key"
                                placeholder="e.g. WEB"
                                value={projectData.key}
                                onChange={handleChange}
                                maxLength={10}
                            />
                        </div>

                        <div className="project-form-group project-description">
                            <label>Description</label>
                            <textarea
                                name="description"
                                placeholder="Describe your project..."
                                value={projectData.description}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                    </div>

                    <button
                        type="submit"
                        className="project-create-button"
                        disabled={creating || workspaces.length === 0}
                    >
                        {creating ? "Creating..." : "+ Create Project"}
                    </button>
                </form>

                {error && <p className="project-error">{error}</p>}
                {success && <p className="project-success">{success}</p>}

                {workspaces.length === 0 && !loading && (
                    <p className="project-error">
                        Create a workspace before creating a project.
                    </p>
                )}
            </div>

            <div className="project-list-header">
                <div>
                    <h2>Your Projects</h2>
                    <p>Projects across your available workspaces.</p>
                </div>

                <button
                    className="project-refresh"
                    onClick={fetchData}
                >
                    ↻ Refresh
                </button>
            </div>

            {loading ? (
                <div className="project-empty">
                    Loading projects...
                </div>
            ) : projects.length === 0 ? (
                <div className="project-empty">
                    <div className="project-empty-icon">◫</div>
                    <h3>No projects yet</h3>
                    <p>Create your first project using the form above.</p>
                </div>
            ) : (
                <div className="project-grid">
                    {projects.map((project) => (
                        <div className="project-card" key={project.id}>
                            <div className="project-card-top">
                                <div className="project-card-icon">
                                    ◫
                                </div>
                                <span className="project-card-key">
                                    {project.key || "PROJECT"}
                                </span>
                            </div>

                            <h3>{project.name}</h3>

                            <p className="project-card-description">
                                {project.description ||
                                    "No description added."}
                            </p>

                            <div className="project-workspace">
                                <span>Workspace</span>
                                <strong>
                                    {getWorkspaceName(project.workspace)}
                                </strong>
                            </div>

                            <div className="project-card-footer">
                                <span>Project ID: {project.id}</span>
                                <span>{project.status || "Active"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}

export default Projects;
