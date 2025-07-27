import React, { useState, useEffect } from "react";
import { DndContext } from "@dnd-kit/core";
import StatusColumn from "../StatusColumn";
import axios from "../../../utils/api";
import { STATUS_OPTIONS } from "../../../constants/ApplicationStatuses";

// Group applications by status based on known statuses
const grouped = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = applications.filter((app) => app.status === status);
    return acc;
}, {});


import { closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

function StatusBoard() {
    const [applications, setApplications] = useState([]);
    const [expandedView, setExpandedView] = useState(true);
    const [hiddenStatuses, setHiddenStatuses] = useState(new Set());

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const res = await axios.get("/applications/all");
                setApplications(res.data);
            } catch (err) {
                console.error("Failed to fetch applications:", err);
            }
        };

        fetchApplications();
    }, []);

    const grouped = STATUS_OPTIONS.reduce((acc, status) => {
        acc[status] = applications.filter((app) => app.status === status);
        return acc;
    }, {});

    function handleDragEnd(event) {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeId = active.id;
        const overColumn = over?.id;

        // Find the dragged application
        const draggedApp = applications.find((a) => a.id === activeId);
        if (!draggedApp) return;

        // If it's already in the target status, do nothing
        if (draggedApp.status === overColumn) return;

        // Update the local state first
        const updatedApplications = applications.map((app) =>
            app.id === activeId ? { ...app, status: overColumn } : app
        );
        setApplications(updatedApplications);

        // Now update on the server
        axios
            .patch(`/applications/${activeId}`, { status: overColumn })
            .catch((err) => {
                console.error("Failed to update application status:", err);
                // Optionally revert UI if needed
                setApplications(applications); // revert on failure
            });
    }


    return (
        <div className="status-board">
            <button onClick={() => setExpandedView((prev) => !prev)}>
                {expandedView ? "Minimize Cards" : "Expand Cards"}
            </button>

            <DndContext
                onDragEnd={handleDragEnd}
            >

                <div className="status-columns" style={{ display: "flex", gap: "1rem" }}>
                    {Object.entries(grouped).map(([status, apps]) =>
                        hiddenStatuses.has(status) ? null : (
                            <StatusColumn
                                key={status}
                                status={status}
                                applications={apps}
                                expandedView={expandedView}
                                onHide={() =>
                                    setHiddenStatuses((prev) => new Set(prev).add(status))
                                }
                            />
                        )
                    )}
                </div>
            </DndContext>
        </div>
    );
}

export default StatusBoard;