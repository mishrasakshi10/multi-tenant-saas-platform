
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./KanbanBoard.css";

function KanbanBoard() {
    const navigate = useNavigate();

    const [issues, setIssues] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingIssue, setUpdatingIssue] = useState(null);

    const columns = [
        { id: "todo", title: "To Do", className: "todo" },
        { id: "in_progress", title: "In Progress", className: "in-progress" },
        { id: "in_review", title: "In Review", className: "in-review" },
        { id: "done", title: "Done", className: "done" },
    ];

    const getList = (data) => {
        if (Array.isArray(data)) return data;
        return data?.results || [];
    };

    const fetchData = async () => {
        try {
            const [projectResponse, issueResponse] = await Promise.all([
                api.get("projects/"),
                api.get("projects/issues/"),
            ]);

            setProjects(getList(projectResponse.data));
            setIssues(getList(issueResponse.data));
            setError("");
        } catch (err) {
            setError("Unable to load Kanban Board.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDragStart = (event, issueId) => {
        event.dataTransfer.setData("issueId", String(issueId));
        event.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = async (event, newStatus) => {
        event.preventDefault();

        const issueId = Number(event.dataTransfer.getData("issueId"));
        const issue = issues.find((item) => item.id === issueId);

        if (!issue || issue.status === newStatus) return;

        setUpdatingIssue(issueId);
        setError("");

        try {
            await api.patch(`projects/issues/${issueId}/`, {
                status: newStatus,
            });

            setIssues((previous) =>
                previous.map((item) =>
                    item.id === issueId
                        ? { ...item, status: newStatus }
                        : item
                )
            );
        } catch (err) {
            setError("Unable to update issue status. Please try again.");
        } finally {
            setUpdatingIssue(null);
        }
    };

    const filteredIssues = issues.filter((issue) =>
        selectedProject
            ? String(issue.project) === selectedProject
            : true
    );

    const formatPriority = (priority) => {
        return priority
            ?.replaceAll("_", " ")
            .toUpperCase();
    };

    if (loading) {
        return (
            <div className="kanban-loading">
                Loading Kanban Board...
            </div>
        );
    }

    return (
        <div className="kanban-page">

            {/* HEADER */}
            <header className="kanban-header">
                <div>
                    <h1>Kanban Board</h1>
                    <p>
                        Manage your project issues using drag and drop.
                    </p>
                </div>

                <button
                    className="kanban-back-button"
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </button>
            </header>

            {/* PROJECT FILTER */}
            <div className="kanban-filter">
                <label>Select Project</label>

                <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                >
                    <option value="">All Projects</option>

                    {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                            {project.name}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="kanban-error">
                    {error}
                </div>
            )}

            {/* KANBAN COLUMNS */}
            <div className="kanban-columns">

                {columns.map((column) => {
                    const columnIssues = filteredIssues.filter(
                        (issue) => issue.status === column.id
                    );

                    return (
                        <div
                            key={column.id}
                            className={`kanban-column ${column.className}`}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) =>
                                handleDrop(event, column.id)
                            }
                        >
                            <h3>
                                {column.title}
                                <span className="kanban-count">
                                    {columnIssues.length}
                                </span>
                            </h3>

                            {columnIssues.length === 0 && (
                                <div className="kanban-empty">
                                    No issues here
                                </div>
                            )}

                            {columnIssues.map((issue) => (
                                <div
                                    key={issue.id}
                                    className="kanban-issue"
                                    draggable={updatingIssue !== issue.id}
                                    onDragStart={(event) =>
                                        handleDragStart(event, issue.id)
                                    }
                                    style={{
                                        opacity:
                                            updatingIssue === issue.id
                                                ? 0.5
                                                : 1,
                                    }}
                                >
                                    <h4>{issue.title}</h4>

                                    <p>
                                        {issue.description ||
                                            "No description available"}
                                    </p>

                                    <span
                                        className={`priority-badge priority-${issue.priority}`}
                                    >
                                        {formatPriority(issue.priority)}
                                    </span>

                                    {updatingIssue === issue.id && (
                                        <p>Updating status...</p>
                                    )}
                                </div>
                            ))}

                        </div>
                    );
                })}

            </div>
        </div>
    );
}

export default KanbanBoard;
