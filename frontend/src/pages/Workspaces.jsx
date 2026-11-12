
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import api from "../services/api";
import "./Workspaces.css";

function Workspaces() {
    const navigate = useNavigate();
    const { setSelectedWorkspaceId } = useAuth();

    const [workspaces, setWorkspaces] = useState([]);
    const [workspaceName, setWorkspaceName] = useState("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getList = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    };

    // FETCH WORKSPACES
    const fetchWorkspaces = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("workspaces/");

            setWorkspaces(getList(response.data));

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load workspaces."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    // CREATE WORKSPACE
    const handleCreateWorkspace = async (e) => {
        e.preventDefault();

        if (!workspaceName.trim()) {
            setError("Please enter a workspace name.");
            return;
        }

        try {
            setCreating(true);
            setError("");
            setSuccess("");

            await api.post("workspaces/", {
                name: workspaceName.trim()
            });

            setWorkspaceName("");
            setSuccess("Workspace created successfully!");

            await fetchWorkspaces();

        } catch (err) {
            const data = err.response?.data;

            setError(
                data?.name?.[0] ||
                data?.detail ||
                "Unable to create workspace."
            );
        } finally {
            setCreating(false);
        }
    };

    // OPEN WORKSPACE
    const handleOpenWorkspace = (workspace) => {
        // Save selected workspace globally
        setSelectedWorkspaceId(workspace.id);

        // Open Projects page for selected workspace
        navigate(`/projects?workspace=${workspace.id}`);
    };

    return (
        <div className="workspaces-page">

            {/* HEADER */}
            <div className="workspaces-header">
                <div>
                    <p className="workspace-breadcrumb">
                        WORKSPACE MANAGEMENT
                    </p>

                    <h1>Workspaces</h1>

                    <p className="workspace-subtitle">
                        Create and manage your workspaces in one place.
                    </p>
                </div>

                <div className="workspace-count">
                    <span>{workspaces.length}</span>
                    <small>Total Workspaces</small>
                </div>
            </div>

            {/* CREATE WORKSPACE */}
            <div className="workspace-create-card">

                <div>
                    <h2>Create a Workspace</h2>

                    <p>
                        Start a new workspace for your team or project.
                    </p>
                </div>

                <form onSubmit={handleCreateWorkspace}>

                    <input
                        type="text"
                        placeholder="Enter workspace name"
                        value={workspaceName}
                        onChange={(e) =>
                            setWorkspaceName(e.target.value)
                        }
                    />

                    <button
                        type="submit"
                        disabled={creating}
                    >
                        {creating
                            ? "Creating..."
                            : "+ Create Workspace"}
                    </button>

                </form>

                {error && (
                    <p className="workspace-error">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="workspace-success">
                        {success}
                    </p>
                )}

            </div>

            {/* WORKSPACE LIST HEADER */}
            <div className="workspace-list-header">

                <div>
                    <h2>Your Workspaces</h2>

                    <p>
                        All workspaces available to your account.
                    </p>
                </div>

                <button
                    onClick={fetchWorkspaces}
                    className="workspace-refresh"
                    disabled={loading}
                >
                    ↻ Refresh
                </button>

            </div>

            {/* WORKSPACE LIST */}
            {loading ? (

                <div className="workspace-empty">
                    Loading workspaces...
                </div>

            ) : workspaces.length === 0 ? (

                <div className="workspace-empty">

                    <div className="workspace-empty-icon">
                        ▣
                    </div>

                    <h3>No workspaces yet</h3>

                    <p>
                        Create your first workspace using the form above.
                    </p>

                </div>

            ) : (

                <div className="workspace-grid">

                    {workspaces.map((workspace) => (

                        <button
                            type="button"
                            className="workspace-card workspace-card-clickable"
                            key={workspace.id}
                            onClick={() =>
                                handleOpenWorkspace(workspace)
                            }
                        >

                            <div className="workspace-card-top">

                                <div className="workspace-card-icon">
                                    ▣
                                </div>

                                <span className="workspace-status">
                                    Active
                                </span>

                            </div>

                            <h3>{workspace.name}</h3>

                            <p>
                                {workspace.slug
                                    ? `/${workspace.slug}`
                                    : `Workspace #${workspace.id}`}
                            </p>

                            <div className="workspace-card-footer">

                                <span>
                                    ID: {workspace.id}
                                </span>

                                <span>
                                    Open Workspace →
                                </span>

                            </div>

                        </button>

                    ))}

                </div>

            )}

        </div>
    );
}

export default Workspaces;
