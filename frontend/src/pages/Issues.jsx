
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Issues.css";

function Issues() {
    const [issues, setIssues] = useState([]);
    const [projects, setProjects] = useState([]);
    const [boards, setBoards] = useState([]);
    const [sprints, setSprints] = useState([]);

    const [issueData, setIssueData] = useState({
        project: "",
        board: "",
        sprint: "",
        title: "",
        description: "",
        issue_type: "task",
        priority: "medium",
        status: "todo",
        due_date: ""
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

            const [
                issueResponse,
                projectResponse,
                boardResponse,
                sprintResponse
            ] = await Promise.all([
                api.get("projects/issues/"),
                api.get("projects/"),
                api.get("projects/boards/"),
                api.get("projects/sprints/")
            ]);

            setIssues(getList(issueResponse.data));
            setProjects(getList(projectResponse.data));
            setBoards(getList(boardResponse.data));
            setSprints(getList(sprintResponse.data));
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load issues."
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

        setIssueData((previous) => {
            if (name === "project") {
                return {
                    ...previous,
                    project: value,
                    board: "",
                    sprint: ""
                };
            }

            return {
                ...previous,
                [name]: value
            };
        });
    };

    const filteredBoards = boards.filter(
        (board) => String(board.project) === String(issueData.project)
    );

    const filteredSprints = sprints.filter(
        (sprint) => String(sprint.project) === String(issueData.project)
    );

    const handleCreateIssue = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!issueData.project || !issueData.board || !issueData.title.trim()) {
            setError("Please select a project, board and enter an issue title.");
            return;
        }

        try {
            setCreating(true);

            await api.post("projects/issues/", {
                project: Number(issueData.project),
                board: Number(issueData.board),
                sprint: issueData.sprint
                    ? Number(issueData.sprint)
                    : null,
                title: issueData.title.trim(),
                description: issueData.description.trim(),
                issue_type: issueData.issue_type,
                priority: issueData.priority,
                status: issueData.status,
                due_date: issueData.due_date || null
            });

            setIssueData({
                project: "",
                board: "",
                sprint: "",
                title: "",
                description: "",
                issue_type: "task",
                priority: "medium",
                status: "todo",
                due_date: ""
            });

            setSuccess("Issue created successfully!");
            await fetchData();
        } catch (err) {
            const data = err.response?.data;

            setError(
                data?.detail ||
                data?.title?.[0] ||
                data?.project?.[0] ||
                data?.board?.[0] ||
                "Unable to create issue. Please check your details."
            );
        } finally {
            setCreating(false);
        }
    };

    const getProjectName = (id) =>
        projects.find((item) => String(item.id) === String(id))?.name ||
        `Project #${id}`;

    const getBoardName = (id) =>
        boards.find((item) => String(item.id) === String(id))?.name ||
        `Board #${id}`;

    const getPriorityClass = (priority) =>
        `issue-priority issue-priority-${priority}`;

    const getStatusClass = (status) =>
        `issue-status issue-status-${status}`;

    return (
        <div className="issues-page">

            <div className="issues-header">
                <div>
                    <p className="issues-breadcrumb">ISSUE MANAGEMENT</p>
                    <h1>Issues</h1>
                    <p className="issues-subtitle">
                        Create, track and manage your project tasks.
                    </p>
                </div>

                <div className="issues-count">
                    <span>{issues.length}</span>
                    <small>Total Issues</small>
                </div>
            </div>

            <div className="issue-create-card">
                <h2>Create an Issue</h2>
                <p>Add a task, bug or story to your project board.</p>

                <form onSubmit={handleCreateIssue}>
                    <div className="issue-form-grid">

                        <div className="issue-form-group">
                            <label>Project *</label>
                            <select
                                name="project"
                                value={issueData.project}
                                onChange={handleChange}
                            >
                                <option value="">Select Project</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="issue-form-group">
                            <label>Board *</label>
                            <select
                                name="board"
                                value={issueData.board}
                                onChange={handleChange}
                                disabled={!issueData.project}
                            >
                                <option value="">Select Board</option>
                                {filteredBoards.map((board) => (
                                    <option key={board.id} value={board.id}>
                                        {board.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="issue-form-group">
                            <label>Sprint (Optional)</label>
                            <select
                                name="sprint"
                                value={issueData.sprint}
                                onChange={handleChange}
                                disabled={!issueData.project}
                            >
                                <option value="">No Sprint</option>
                                {filteredSprints.map((sprint) => (
                                    <option key={sprint.id} value={sprint.id}>
                                        {sprint.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="issue-form-group">
                            <label>Issue Title *</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter issue title"
                                value={issueData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="issue-form-group">
                            <label>Issue Type</label>
                            <select
                                name="issue_type"
                                value={issueData.issue_type}
                                onChange={handleChange}
                            >
                                <option value="task">Task</option>
                                <option value="bug">Bug</option>
                                <option value="story">Story</option>
                            </select>
                        </div>

                        <div className="issue-form-group">
                            <label>Priority</label>
                            <select
                                name="priority"
                                value={issueData.priority}
                                onChange={handleChange}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="issue-form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={issueData.status}
                                onChange={handleChange}
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        <div className="issue-form-group">
                            <label>Due Date</label>
                            <input
                                type="date"
                                name="due_date"
                                value={issueData.due_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="issue-form-group issue-description">
                            <label>Description</label>
                            <textarea
                                name="description"
                                rows={3}
                                placeholder="Describe the issue..."
                                value={issueData.description}
                                onChange={handleChange}
                            />
                        </div>

                    </div>

                    <button
                        type="submit"
                        className="issue-create-button"
                        disabled={creating || projects.length === 0}
                    >
                        {creating ? "Creating..." : "+ Create Issue"}
                    </button>
                </form>

                {error && <p className="issue-error">{error}</p>}
                {success && <p className="issue-success">{success}</p>}
            </div>

            <div className="issue-list-header">
                <div>
                    <h2>All Issues</h2>
                    <p>Issues across your available projects.</p>
                </div>

                <button className="issue-refresh" onClick={fetchData}>
                    ↻ Refresh
                </button>
            </div>

            {loading ? (
                <div className="issue-empty">Loading issues...</div>
            ) : issues.length === 0 ? (
                <div className="issue-empty">
                    <div className="issue-empty-icon">☷</div>
                    <h3>No issues yet</h3>
                    <p>Create your first issue using the form above.</p>
                </div>
            ) : (
                <div className="issue-table-wrapper">
                    <table className="issue-table">
                        <thead>
                            <tr>
                                <th>Issue</th>
                                <th>Project</th>
                                <th>Board</th>
                                <th>Type</th>
                                <th>Priority</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {issues.map((issue) => (
                                <tr key={issue.id}>
                                    <td>
                                        <strong>{issue.title}</strong>
                                        <small>#{issue.id}</small>
                                    </td>
                                    <td>{getProjectName(issue.project)}</td>
                                    <td>{getBoardName(issue.board)}</td>
                                    <td>{issue.issue_type}</td>
                                    <td>
                                        <span className={getPriorityClass(issue.priority)}>
                                            {issue.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={getStatusClass(issue.status)}>
                                            {issue.status.replace("_", " ")}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}

export default Issues;
