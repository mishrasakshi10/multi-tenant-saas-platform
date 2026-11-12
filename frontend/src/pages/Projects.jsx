
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import api from "../services/api";
import "./Projects.css";

function Projects() {
    const navigate = useNavigate();

    const { selectedWorkspaceId } = useAuth();

    const [projects, setProjects] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);

    const [projectData, setProjectData] = useState({
        workspace: selectedWorkspaceId || "",
        name: "",
        key: "",
        description: ""
    });

    const [editData, setEditData] = useState({
        name: "",
        key: "",
        description: ""
    });

    const [editingProjectId, setEditingProjectId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getList = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    };

    // FETCH PROJECTS AND WORKSPACES
    const fetchData = async () => {
        try {
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

    // UPDATE CREATE FORM WHEN WORKSPACE CHANGES
    useEffect(() => {
        setProjectData(previous => ({
            ...previous,
            workspace: selectedWorkspaceId || ""
        }));

        setEditingProjectId(null);
        setError("");
        setSuccess("");
    }, [selectedWorkspaceId]);

    // CURRENT WORKSPACE
    const currentWorkspace = workspaces.find(
        workspace =>
            String(workspace.id) === String(selectedWorkspaceId)
    );

    const currentRole = currentWorkspace?.current_user_role;

    const canManageProjects = ["OWNER", "ADMIN"].includes(currentRole);

    // GET PROJECT ROLE
    const getProjectRole = (project) => {
        const workspace = workspaces.find(
            item => String(item.id) === String(project.workspace)
        );

        return workspace?.current_user_role;
    };

    const canManageProject = (project) => {
        return ["OWNER", "ADMIN"].includes(getProjectRole(project));
    };

    // ROLE LABEL
    const getRoleLabel = (role) => {
        switch (role) {
            case "OWNER":
                return "Workspace Owner";
            case "ADMIN":
                return "Workspace Admin";
            case "MEMBER":
                return "Workspace Member";
            default:
                return "Workspace Role";
        }
    };

    // FORM CHANGE
    const handleChange = (e) => {
        const { name, value } = e.target;

        setProjectData(previous => ({
            ...previous,
            [name]: name === "key" ? value.toUpperCase() : value
        }));
    };

    // CREATE PROJECT
    const handleCreateProject = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!selectedWorkspaceId) {
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
                workspace: Number(selectedWorkspaceId),
                name: projectData.name.trim(),
                key: projectData.key.trim().toUpperCase(),
                description: projectData.description.trim()
            });

            setProjectData({
                workspace: selectedWorkspaceId,
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
                "Unable to create project."
            );
        } finally {
            setCreating(false);
        }
    };

    // START EDITING
    const handleEditClick = (project) => {
        setEditingProjectId(project.id);

        setEditData({
            name: project.name || "",
            key: project.key || "",
            description: project.description || ""
        });

        setError("");
        setSuccess("");
    };

    // EDIT FORM CHANGE
    const handleEditChange = (e) => {
        const { name, value } = e.target;

        setEditData(previous => ({
            ...previous,
            [name]: name === "key" ? value.toUpperCase() : value
        }));
    };

    // UPDATE PROJECT
    const handleUpdateProject = async (projectId) => {
        setError("");
        setSuccess("");

        if (!editData.name.trim()) {
            setError("Project name cannot be empty.");
            return;
        }

        if (!editData.key.trim()) {
            setError("Project key cannot be empty.");
            return;
        }

        try {
            setUpdating(true);

            await api.patch(`projects/${projectId}/`, {
                name: editData.name.trim(),
                key: editData.key.trim().toUpperCase(),
                description: editData.description.trim()
            });

            setEditingProjectId(null);
            setSuccess("Project updated successfully!");

            await fetchData();

        } catch (err) {
            const data = err.response?.data;

            setError(
                data?.detail ||
                data?.name?.[0] ||
                data?.key?.[0] ||
                "Unable to update project."
            );
        } finally {
            setUpdating(false);
        }
    };

    // CANCEL EDIT
    const handleCancelEdit = () => {
        setEditingProjectId(null);

        setEditData({
            name: "",
            key: "",
            description: ""
        });
    };

    // DELETE PROJECT
    const handleDeleteProject = async (projectId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this project?"
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            setDeletingId(projectId);

            await api.delete(`projects/${projectId}/`);

            setSuccess("Project deleted successfully!");

            await fetchData();

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to delete project."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // GET WORKSPACE NAME
    const getWorkspaceName = (workspaceId) => {
        const workspace = workspaces.find(
            item => String(item.id) === String(workspaceId)
        );

        return workspace?.name || `Workspace #${workspaceId}`;
    };

    // FILTER PROJECTS BY SELECTED WORKSPACE
    const filteredProjects = selectedWorkspaceId
        ? projects.filter(
            project =>
                String(project.workspace) === String(selectedWorkspaceId)
        )
        : [];

    return (
        <div className="projects-page">

            <div className="projects-header">
                <div>
                    <p className="projects-breadcrumb">
                        PROJECT MANAGEMENT
                    </p>

                    <h1>
                        {currentWorkspace
                            ? currentWorkspace.name
                            : "Projects"}
                    </h1>

                    <p className="projects-subtitle">
                        {currentWorkspace
                            ? "Projects in this workspace."
                            : "Select a workspace to view its projects."}
                    </p>

                    {currentWorkspace && currentRole && (
                        <div className="workspace-role-info">
                            <span>Your Role:</span>
                            <strong>{getRoleLabel(currentRole)}</strong>
                        </div>
                    )}
                </div>

                <div className="projects-count">
                    <span>{filteredProjects.length}</span>
                    <small>Workspace Projects</small>
                </div>
            </div>

            {selectedWorkspaceId && (
                <button
                    type="button"
                    className="project-refresh"
                    onClick={() => navigate("/workspaces")}
                    style={{ marginBottom: "20px" }}
                >
                    ← Back to Workspaces
                </button>
            )}

            {currentWorkspace && currentRole && (
                <div className="project-role-message">
                    {canManageProjects
                        ? "You have workspace administration permissions. You can edit and delete projects."
                        : "You have workspace member permissions. You can create projects and work on your assigned tasks."}
                </div>
            )}

            <div className="project-create-card">
                <div>
                    <h2>Create a Project</h2>
                    <p>Add a new project to the selected workspace.</p>
                </div>

                <form onSubmit={handleCreateProject}>
                    <div className="project-form-grid">

                        <div className="project-form-group">
                            <label>Workspace</label>

                            <select
                                name="workspace"
                                value={selectedWorkspaceId || ""}
                                disabled
                            >
                                <option value="">Select Workspace</option>

                                {currentWorkspace && (
                                    <option value={currentWorkspace.id}>
                                        {currentWorkspace.name}
                                    </option>
                                )}
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
                        disabled={
                            creating ||
                            !selectedWorkspaceId ||
                            workspaces.length === 0
                        }
                    >
                        {creating ? "Creating..." : "+ Create Project"}
                    </button>
                </form>

                {workspaces.length === 0 && !loading && (
                    <p className="project-error">
                        Create a workspace before creating a project.
                    </p>
                )}
            </div>

            <div className="project-list-header">
                <div>
                    <h2>Your Projects</h2>

                    <p>
                        {currentWorkspace
                            ? `Projects belonging to ${currentWorkspace.name}.`
                            : "Select a workspace from the sidebar."}
                    </p>
                </div>

                <button
                    className="project-refresh"
                    onClick={fetchData}
                >
                    ↻ Refresh
                </button>
            </div>

            {error && (
                <p className="project-error">{error}</p>
            )}

            {success && (
                <p className="project-success">{success}</p>
            )}

            {loading ? (
                <div className="project-empty">
                    Loading projects...
                </div>

            ) : !selectedWorkspaceId ? (
                <div className="project-empty">
                    <h3>No workspace selected</h3>
                    <p>Select a workspace from the sidebar dropdown.</p>
                </div>

            ) : filteredProjects.length === 0 ? (
                <div className="project-empty">
                    <div className="project-empty-icon">◫</div>
                    <h3>No projects in this workspace</h3>
                    <p>Create a project using the form above.</p>
                </div>

            ) : (
                <div className="project-grid">
                    {filteredProjects.map(project => {
                        const canManage = canManageProject(project);
                        const isEditing = editingProjectId === project.id;

                        return (
                            <div
                                className="project-card"
                                key={project.id}
                            >
                                <div className="project-card-top">
                                    <div className="project-card-icon">◫</div>

                                    <span className="project-card-key">
                                        {project.key || "PROJECT"}
                                    </span>
                                </div>

                                {isEditing ? (
                                    <div style={{ marginTop: "15px" }}>
                                        <h3>Edit Project</h3>

                                        <div className="project-form-group">
                                            <label>Project Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={editData.name}
                                                onChange={handleEditChange}
                                            />
                                        </div>

                                        <div className="project-form-group">
                                            <label>Project Key</label>
                                            <input
                                                type="text"
                                                name="key"
                                                value={editData.key}
                                                onChange={handleEditChange}
                                                maxLength={10}
                                            />
                                        </div>

                                        <div className="project-form-group">
                                            <label>Description</label>
                                            <textarea
                                                name="description"
                                                rows={3}
                                                value={editData.description}
                                                onChange={handleEditChange}
                                            />
                                        </div>

                                        <div style={{
                                            display: "flex",
                                            gap: "10px",
                                            marginTop: "15px"
                                        }}>
                                            <button
                                                type="button"
                                                className="project-create-button"
                                                disabled={updating}
                                                onClick={() =>
                                                    handleUpdateProject(project.id)
                                                }
                                            >
                                                {updating
                                                    ? "Saving..."
                                                    : "Save Changes"}
                                            </button>

                                            <button
                                                type="button"
                                                className="project-refresh"
                                                onClick={handleCancelEdit}
                                                disabled={updating}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
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
                                            <span>
                                                Project ID: {project.id}
                                            </span>

                                            <span>
                                                {project.status || "Active"}
                                            </span>
                                        </div>

                                        {canManage && (
                                            <div style={{
                                                display: "flex",
                                                gap: "10px",
                                                marginTop: "18px"
                                            }}>
                                                <button
                                                    type="button"
                                                    className="project-refresh"
                                                    onClick={() =>
                                                        handleEditClick(project)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteProject(project.id)
                                                    }
                                                    disabled={deletingId === project.id}
                                                    style={{
                                                        background: "#fee2e2",
                                                        color: "#b91c1c",
                                                        border: "none",
                                                        padding: "9px 15px",
                                                        borderRadius: "7px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    {deletingId === project.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </div>
                                        )}

                                        {!canManage && (
                                            <p style={{
                                                marginTop: "15px",
                                                fontSize: "12px",
                                                color: "#64748b"
                                            }}>
                                                Member access – Edit and Delete
                                                permissions are not available.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Projects;
