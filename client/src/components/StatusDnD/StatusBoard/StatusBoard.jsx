import React, { useState, useEffect } from "react";
import { DndContext } from "@dnd-kit/core";
import StatusColumn from "..//StatusColumn/StatusColumn";
import axios from "../../../utils/api";
import { STATUS_OPTIONS } from "../../../constants/ApplicationStatuses";

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

        // Step 1: Find dragged item
        const draggedApp = applications.find((a) => a.id === activeId);
        if (!draggedApp) return;

        // Step 2: Find the actual column from `over.id`
        // If over.id is a column ID (like "Applied"), fine.
        // But if it's a card ID, get that card's status.
        const overApp = applications.find((a) => a.id === over.id);
        const overColumn = STATUS_OPTIONS.includes(over.id) ? over.id : overApp?.status;

        if (!overColumn || draggedApp.status === overColumn) return;

        // Step 3: Optimistic UI update
        const updatedApplications = applications.map((app) =>
            app.id === activeId ? { ...app, status: overColumn } : app
        );
        setApplications(updatedApplications);

        // Step 4: Persist to server
        axios
            .patch(`/applications/${activeId}`, { status: overColumn })
            .catch((err) => {
                console.error("Failed to update application status:", err?.response?.data || err);
                setApplications(applications); // revert if failed
            });
    }



    return (
        <div className="status-board">
            <button onClick={() => setExpandedView((prev) => !prev)}>
                {expandedView ? "Minimize Cards" : "Expand Cards"}
            </button>

            <DndContext
                collisionDetection={closestCenter}
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