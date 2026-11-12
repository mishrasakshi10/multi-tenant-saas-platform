
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Issues.css";

function Issues() {
    const { selectedWorkspaceId } = useAuth();

    const [issues, setIssues] = useState([]);
    const [projects, setProjects] = useState([]);
    const [boards, setBoards] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [comments, setComments] = useState([]);
    const [activities, setActivities] = useState([]);

    const [selectedIssue, setSelectedIssue] = useState(null);

    // EDIT ISSUE STATES
    const [editingIssue, setEditingIssue] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

    const [editData, setEditData] = useState({
        title: "",
        description: "",
        issue_type: "task",
        priority: "medium",
        status: "todo",
        due_date: ""
    });

    const [commentText, setCommentText] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [commentError, setCommentError] = useState("");
    const [commentSuccess, setCommentSuccess] = useState("");

    const [activityLoading, setActivityLoading] = useState(false);
    const [activityError, setActivityError] = useState("");
    const [showActivity, setShowActivity] = useState(false);

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

    // FETCH COMMENTS
    const fetchComments = async () => {
        try {
            setCommentLoading(true);
            setCommentError("");

            const response = await api.get("projects/comments/");
            setComments(getList(response.data));
        } catch (err) {
            setCommentError(
                err.response?.data?.detail ||
                "Unable to load comments."
            );
        } finally {
            setCommentLoading(false);
        }
    };

    // FETCH ACTIVITIES
    const fetchActivities = async () => {
        try {
            setActivityLoading(true);
            setActivityError("");

            const response = await api.get("projects/activities/");
            setActivities(getList(response.data));
        } catch (err) {
            setActivityError(
                err.response?.data?.detail ||
                "Unable to load activity history."
            );
        } finally {
            setActivityLoading(false);
        }
    };

    // FETCH ALL DATA
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

            await Promise.all([
                fetchComments(),
                fetchActivities()
            ]);
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

    // WORKSPACE FILTERING
    const filteredProjects = selectedWorkspaceId
        ? projects.filter(
            (project) =>
                String(project.workspace) === String(selectedWorkspaceId)
        )
        : [];

    const workspaceProjectIds = filteredProjects.map(
        (project) => String(project.id)
    );

    const filteredIssues = issues.filter(
        (issue) =>
            workspaceProjectIds.includes(String(issue.project))
    );

    const filteredWorkspaceBoards = boards.filter(
        (board) =>
            workspaceProjectIds.includes(String(board.project))
    );

    const filteredWorkspaceSprints = sprints.filter(
        (sprint) =>
            workspaceProjectIds.includes(String(sprint.project))
    );

    // CLEAR OLD SELECTIONS WHEN WORKSPACE CHANGES
    useEffect(() => {
        setIssueData((previous) => ({
            ...previous,
            project: "",
            board: "",
            sprint: ""
        }));

        setSelectedIssue(null);
        setEditingIssue(null);
        setError("");
        setSuccess("");
        setEditError("");
        setEditSuccess("");
    }, [selectedWorkspaceId]);

    // CREATE ISSUE FORM
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

    // PROJECT-WISE BOARDS AND SPRINTS
    const filteredBoards = filteredWorkspaceBoards.filter(
        (board) =>
            String(board.project) === String(issueData.project)
    );

    const filteredSprints = filteredWorkspaceSprints.filter(
        (sprint) =>
            String(sprint.project) === String(issueData.project)
    );

    // CREATE ISSUE
    const handleCreateIssue = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !selectedWorkspaceId ||
            !workspaceProjectIds.includes(String(issueData.project)) ||
            !issueData.board ||
            !issueData.title.trim()
        ) {
            setError(
                "Please select a valid project, board and enter an issue title."
            );
            return;
        }

        const selectedBoard = filteredBoards.find(
            (board) => String(board.id) === String(issueData.board)
        );

        if (!selectedBoard) {
            setError("Please select a valid board for this project.");
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

    // OPEN EDIT FORM
    const handleStartEdit = (issue) => {
        setEditingIssue(issue);

        setEditData({
            title: issue.title || "",
            description: issue.description || "",
            issue_type: issue.issue_type || "task",
            priority: issue.priority || "medium",
            status: issue.status || "todo",
            due_date: issue.due_date
                ? String(issue.due_date).slice(0, 10)
                : ""
        });

        setEditError("");
        setEditSuccess("");
    };

    // EDIT FORM INPUT CHANGE
    const handleEditChange = (e) => {
        const { name, value } = e.target;

        setEditData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // UPDATE ISSUE
    const handleUpdateIssue = async (e) => {
        e.preventDefault();

        setEditError("");
        setEditSuccess("");

        if (!editData.title.trim()) {
            setEditError("Issue title is required.");
            return;
        }

        try {
            setUpdating(true);

            await api.patch(
                `projects/issues/${editingIssue.id}/`,
                {
                    title: editData.title.trim(),
                    description: editData.description.trim(),
                    issue_type: editData.issue_type,
                    priority: editData.priority,
                    status: editData.status,
                    due_date: editData.due_date || null
                }
            );

            setEditSuccess("Issue updated successfully!");
            setEditingIssue(null);

            setEditData({
                title: "",
                description: "",
                issue_type: "task",
                priority: "medium",
                status: "todo",
                due_date: ""
            });

            await fetchData();

        } catch (err) {
            const data = err.response?.data;

            setEditError(
                data?.detail ||
                data?.title?.[0] ||
                data?.status?.[0] ||
                data?.priority?.[0] ||
                "Unable to update issue. Please try again."
            );
        } finally {
            setUpdating(false);
        }
    };

    // CANCEL EDIT
    const handleCancelEdit = () => {
        setEditingIssue(null);
        setEditError("");
        setEditSuccess("");
    };

    // OPEN COMMENTS
    const handleOpenComments = (issue) => {
        if (selectedIssue?.id === issue.id) {
            setSelectedIssue(null);
            return;
        }

        setSelectedIssue(issue);
        setCommentText("");
        setCommentError("");
        setCommentSuccess("");
    };

    // ADD COMMENT
    const handleAddComment = async (e) => {
        e.preventDefault();

        setCommentError("");
        setCommentSuccess("");

        if (!commentText.trim()) {
            setCommentError("Please enter a comment.");
            return;
        }

        try {
            setCommentSubmitting(true);

            await api.post("projects/comments/", {
                issue: selectedIssue.id,
                body: commentText.trim()
            });

            setCommentText("");
            setCommentSuccess("Comment added successfully!");

            await Promise.all([
                fetchComments(),
                fetchActivities()
            ]);

        } catch (err) {
            const data = err.response?.data;

            setCommentError(
                data?.detail ||
                data?.body?.[0] ||
                data?.issue?.[0] ||
                "Unable to add comment."
            );
        } finally {
            setCommentSubmitting(false);
        }
    };

    // HELPER FUNCTIONS
    const getProjectName = (id) =>
        projects.find(
            (item) => String(item.id) === String(id)
        )?.name || `Project #${id}`;

    const getBoardName = (id) =>
        boards.find(
            (item) => String(item.id) === String(id)
        )?.name || `Board #${id}`;

    const getPriorityClass = (priority) =>
        `issue-priority issue-priority-${priority}`;

    const getStatusClass = (status) =>
        `issue-status issue-status-${status}`;

    const formatDate = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    };

    const getActivityText = (activity) => {
        const actor = activity.actor
            ? `User #${activity.actor}`
            : "A user";

        const field = activity.field_name
            ? activity.field_name.replaceAll("_", " ")
            : "";

        switch (activity.action) {
            case "created":
                return `${actor} created issue "${activity.new_value || ""}"`;

            case "status_changed":
                return `${actor} changed status from ${activity.old_value} to ${activity.new_value}`;

            case "assigned":
                return `${actor} changed the assignee`;

            case "commented":
                return `${actor} added a comment`;

            case "attachment_added":
                return `${actor} added an attachment`;

            case "updated":
                return `${actor} updated ${field || "issue details"}`;

            default:
                return `${actor} performed an action`;
        }
    };

    // COMMENTS FOR SELECTED ISSUE
    const issueComments = selectedIssue
        ? comments.filter(
            (comment) =>
                String(comment.issue) === String(selectedIssue.id)
        )
        : [];

    // ACTIVITIES FOR CURRENT WORKSPACE
    const visibleActivities = selectedIssue
        ? activities.filter(
            (activity) =>
                String(activity.issue) === String(selectedIssue.id)
        )
        : activities.filter(
            (activity) =>
                filteredIssues.some(
                    (issue) =>
                        String(issue.id) === String(activity.issue)
                )
        );

    return (
        <div className="issues-page">

            {/* PAGE HEADER */}
            <div className="issues-header">
                <div>
                    <p className="issues-breadcrumb">ISSUE MANAGEMENT</p>
                    <h1>Issues</h1>
                    <p className="issues-subtitle">
                        Create, track and manage your project tasks.
                    </p>
                </div>

                <div className="issues-count">
                    <span>{filteredIssues.length}</span>
                    <small>Total Issues</small>
                </div>
            </div>

            {/* CREATE ISSUE */}
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

                                {filteredProjects.map((project) => (
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
                        disabled={
                            creating ||
                            !selectedWorkspaceId ||
                            filteredProjects.length === 0
                        }
                    >
                        {creating ? "Creating..." : "+ Create Issue"}
                    </button>
                </form>

                {error && <p className="issue-error">{error}</p>}
                {success && <p className="issue-success">{success}</p>}
            </div>

            {/* EDIT ISSUE FORM */}
            {editingIssue && (
                <div className="issue-edit-card">
                    <div className="issue-edit-header">
                        <div>
                            <p className="issues-breadcrumb">UPDATE ISSUE</p>
                            <h2>Edit Issue #{editingIssue.id}</h2>
                            <p>Update issue details and save your changes.</p>
                        </div>

                        <button
                            type="button"
                            className="issue-refresh"
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </button>
                    </div>

                    <form onSubmit={handleUpdateIssue}>
                        <div className="issue-form-grid">

                            <div className="issue-form-group">
                                <label>Issue Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={editData.title}
                                    onChange={handleEditChange}
                                    placeholder="Enter issue title"
                                    required
                                />
                            </div>

                            <div className="issue-form-group">
                                <label>Issue Type</label>
                                <select
                                    name="issue_type"
                                    value={editData.issue_type}
                                    onChange={handleEditChange}
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
                                    value={editData.priority}
                                    onChange={handleEditChange}
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
                                    value={editData.status}
                                    onChange={handleEditChange}
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
                                    value={editData.due_date}
                                    onChange={handleEditChange}
                                />
                            </div>

                            <div className="issue-form-group issue-description">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={editData.description}
                                    onChange={handleEditChange}
                                    placeholder="Describe the issue..."
                                />
                            </div>

                        </div>

                        <div className="issue-edit-actions">
                            <button
                                type="submit"
                                className="issue-create-button"
                                disabled={updating}
                            >
                                {updating ? "Updating..." : "Save Changes"}
                            </button>

                            <button
                                type="button"
                                className="issue-refresh"
                                onClick={handleCancelEdit}
                                disabled={updating}
                            >
                                Cancel
                            </button>
                        </div>

                        {editError && (
                            <p className="issue-error">{editError}</p>
                        )}
                    </form>
                </div>
            )}

            {editSuccess && (
                <p className="issue-success">{editSuccess}</p>
            )}

            {/* ISSUE LIST */}
            <div className="issue-list-header">
                <div>
                    <h2>All Issues</h2>
                    <p>Issues in the selected workspace.</p>
                </div>

                <button
                    className="issue-refresh"
                    onClick={fetchData}
                    type="button"
                >
                    ↻ Refresh
                </button>
            </div>

            {loading ? (
                <div className="issue-empty">Loading issues...</div>
            ) : !selectedWorkspaceId ? (
                <div className="issue-empty">
                    <h3>No workspace selected</h3>
                    <p>Please select a workspace from the sidebar.</p>
                </div>
            ) : filteredIssues.length === 0 ? (
                <div className="issue-empty">
                    <div className="issue-empty-icon">☷</div>
                    <h3>No issues in this workspace</h3>
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
                                <th>Comments</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredIssues.map((issue) => (
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

                                    <td>
                                        <button
                                            type="button"
                                            className="issue-comments-button"
                                            onClick={() => handleOpenComments(issue)}
                                        >
                                            {selectedIssue?.id === issue.id
                                                ? "Close"
                                                : "View Comments"}
                                        </button>
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            className="issue-edit-button"
                                            onClick={() => handleStartEdit(issue)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ISSUE COMMENTS */}
            {selectedIssue && (
                <div className="issue-comments-card">
                    <div className="issue-comments-header">
                        <div>
                            <p className="issues-breadcrumb">COLLABORATION</p>
                            <h2>Comments</h2>
                            <p>
                                Issue #{selectedIssue.id} — {selectedIssue.title}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="issue-refresh"
                            onClick={fetchComments}
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    <div className="issue-comments-list">
                        {commentLoading ? (
                            <p>Loading comments...</p>
                        ) : commentError ? (
                            <p className="issue-error">{commentError}</p>
                        ) : issueComments.length === 0 ? (
                            <div className="issue-no-comments">
                                No comments yet. Start the discussion!
                            </div>
                        ) : (
                            issueComments.map((comment) => (
                                <div className="issue-comment" key={comment.id}>
                                    <div className="issue-comment-avatar">
                                        {String(comment.author || "?").charAt(0)}
                                    </div>

                                    <div className="issue-comment-content">
                                        <div className="issue-comment-meta">
                                            <strong>
                                                User #{comment.author}
                                            </strong>
                                            <small>{formatDate(comment.created_at)}</small>
                                        </div>

                                        <p>{comment.body}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form
                        className="issue-comment-form"
                        onSubmit={handleAddComment}
                    >
                        <label htmlFor="issue-comment-input">
                            Add a comment
                        </label>

                        <textarea
                            id="issue-comment-input"
                            rows={3}
                            placeholder="Write your comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />

                        <button
                            type="submit"
                            className="issue-create-button"
                            disabled={commentSubmitting || !commentText.trim()}
                        >
                            {commentSubmitting ? "Posting..." : "Post Comment"}
                        </button>

                        {commentError && (
                            <p className="issue-error">{commentError}</p>
                        )}

                        {commentSuccess && (
                            <p className="issue-success">{commentSuccess}</p>
                        )}
                    </form>
                </div>
            )}

            {/* ACTIVITY LOG */}
            <div className="issue-activity-card">
                <div className="issue-activity-header">
                    <div>
                        <p className="issues-breadcrumb">PROJECT HISTORY</p>
                        <h2>Activity Log</h2>
                        <p>
                            Track important actions performed on your issues.
                        </p>
                    </div>

                    <div className="issue-activity-actions">
                        <button
                            type="button"
                            className="issue-refresh"
                            onClick={() => setShowActivity(!showActivity)}
                        >
                            {showActivity ? "Hide Activity" : "View Activity"}
                        </button>

                        <button
                            type="button"
                            className="issue-refresh"
                            onClick={fetchActivities}
                        >
                            ↻ Refresh
                        </button>
                    </div>
                </div>

                {showActivity && (
                    <div className="issue-activity-list">
                        {activityLoading ? (
                            <p>Loading activity history...</p>
                        ) : activityError ? (
                            <p className="issue-error">{activityError}</p>
                        ) : visibleActivities.length === 0 ? (
                            <div className="issue-no-comments">
                                No activity recorded yet.
                            </div>
                        ) : (
                            visibleActivities.map((activity) => (
                                <div
                                    className="issue-activity-item"
                                    key={activity.id}
                                >
                                    <div className="issue-activity-dot">•</div>

                                    <div className="issue-activity-content">
                                        <p>
                                            {getActivityText(activity)}
                                        </p>

                                        <small>
                                            Issue #{activity.issue}
                                            {" · "}
                                            {formatDate(activity.created_at)}
                                        </small>

                                        {activity.action === "commented" && activity.new_value && (
                                            <div className="issue-activity-detail">
                                                {activity.new_value}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}

export default Issues;
