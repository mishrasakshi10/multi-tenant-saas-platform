
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Boards.css";

function Boards() {
    const [boards, setBoards] = useState([]);
    const [projects, setProjects] = useState([]);

    const [boardData, setBoardData] = useState({
        project: "",
        name: "",
        description: "",
        is_default: false
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

            const [boardResponse, projectResponse] =
                await Promise.all([
                    api.get("projects/boards/"),
                    api.get("projects/")
                ]);

            setBoards(getList(boardResponse.data));
            setProjects(getList(projectResponse.data));
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load boards."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setBoardData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleCreateBoard = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!boardData.project) {
            setError("Please select a project.");
            return;
        }

        if (!boardData.name.trim()) {
            setError("Please enter a board name.");
            return;
        }

        try {
            setCreating(true);

            await api.post("projects/boards/", {
                project: Number(boardData.project),
                name: boardData.name.trim(),
                description: boardData.description.trim(),
                is_default: boardData.is_default
            });

            setBoardData({
                project: "",
                name: "",
                description: "",
                is_default: false
            });

            setSuccess("Board created successfully!");
            await fetchData();
        } catch (err) {
            const data = err.response?.data;

            setError(
                data?.detail ||
                data?.name?.[0] ||
                data?.project?.[0] ||
                "Unable to create board."
            );
        } finally {
            setCreating(false);
        }
    };

    const getProjectName = (projectId) => {
        const project = projects.find(
            (item) => String(item.id) === String(projectId)
        );

        return project?.name || `Project #${projectId}`;
    };

    return (
        <div className="boards-page">

            <div className="boards-header">
                <div>
                    <p className="boards-breadcrumb">
                        BOARD MANAGEMENT
                    </p>
                    <h1>Boards</h1>
                    <p className="boards-subtitle">
                        Create and organize boards for your projects.
                    </p>
                </div>

                <div className="boards-count">
                    <span>{boards.length}</span>
                    <small>Total Boards</small>
                </div>
            </div>

            <div className="board-create-card">
                <div>
                    <h2>Create a Board</h2>
                    <p>
                        Select a project and create a board for managing tasks.
                    </p>
                </div>

                <form onSubmit={handleCreateBoard}>
                    <div className="board-form-grid">

                        <div className="board-form-group">
                            <label>Select Project</label>
                            <select
                                name="project"
                                value={boardData.project}
                                onChange={handleChange}
                            >
                                <option value="">Select Project</option>

                                {projects.map((project) => (
                                    <option
                                        key={project.id}
                                        value={project.id}
                                    >
                                        {project.name} ({project.key})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="board-form-group">
                            <label>Board Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="e.g. Development Board"
                                value={boardData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="board-form-group board-description">
                            <label>Description</label>
                            <textarea
                                name="description"
                                rows={3}
                                placeholder="Describe your board..."
                                value={boardData.description}
                                onChange={handleChange}
                            />
                        </div>

                    </div>

                    <label className="board-checkbox">
                        <input
                            type="checkbox"
                            name="is_default"
                            checked={boardData.is_default}
                            onChange={handleChange}
                        />
                        Set as default board
                    </label>

                    <button
                        type="submit"
                        className="board-create-button"
                        disabled={creating || projects.length === 0}
                    >
                        {creating ? "Creating..." : "+ Create Board"}
                    </button>
                </form>

                {error && <p className="board-error">{error}</p>}
                {success && <p className="board-success">{success}</p>}

                {projects.length === 0 && !loading && (
                    <p className="board-error">
                        Create a project before creating a board.
                    </p>
                )}
            </div>

            <div className="board-list-header">
                <div>
                    <h2>Your Boards</h2>
                    <p>Boards available across your projects.</p>
                </div>

                <button
                    className="board-refresh"
                    onClick={fetchData}
                >
                    ↻ Refresh
                </button>
            </div>

            {loading ? (
                <div className="board-empty">Loading boards...</div>
            ) : boards.length === 0 ? (
                <div className="board-empty">
                    <div className="board-empty-icon">▤</div>
                    <h3>No boards yet</h3>
                    <p>Create your first board using the form above.</p>
                </div>
            ) : (
                <div className="board-grid">
                    {boards.map((board) => (
                        <div className="board-card" key={board.id}>
                            <div className="board-card-top">
                                <div className="board-card-icon">▤</div>

                                {board.is_default && (
                                    <span className="board-default">
                                        Default
                                    </span>
                                )}
                            </div>

                            <h3>{board.name}</h3>

                            <p className="board-card-description">
                                {board.description ||
                                    "No description added."}
                            </p>

                            <div className="board-project">
                                <span>Project</span>
                                <strong>
                                    {getProjectName(board.project)}
                                </strong>
                            </div>

                            <div className="board-card-footer">
                                <span>Board ID: {board.id}</span>
                                <span>
                                    {board.is_default ? "Default Board" : "Board"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}

export default Boards;
