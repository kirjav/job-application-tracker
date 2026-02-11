import React, { useState, useEffect, useMemo } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { rectIntersection } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import StatusColumn from "../StatusColumn/StatusColumn";
import axios from "../../../utils/api";
import { STATUS_OPTIONS } from "../../../constants/ApplicationStatuses";
import { ApplicationCardPreview } from "../ApplicationCard/ApplicationCard";
import ThinRightArrow from "../../../assets/icons/table/ThinRightArrow.svg?react";
import "./StatusBoard.css";

function MinimizedColumn({ status, onExpand }) {
    return (
        <button
            type="button"
            className="status-board-minimized-column"
            onClick={onExpand}
            aria-label={`Show ${status} column`}
            title={`Show ${status} column`}
        >
            <span className="status-board-minimized-column-label">{status}</span>
            <ThinRightArrow className="status-board-minimized-column-icon" />
        </button>
    );
}

function StatusBoard({ expandedView = true }) {
    const [applications, setApplications] = useState([]);
    const [hiddenStatuses, setHiddenStatuses] = useState(new Set());
    const [activeId, setActiveId] = useState(null);

    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
    });
    const sensors = useSensors(pointerSensor);

    const activeApp = useMemo(
        () => (activeId ? applications.find((a) => a.id === activeId) : null),
        [activeId, applications]
    );

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
            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={({ active }) => setActiveId(active.id)}
                onDragEnd={(event) => {
                    handleDragEnd(event);
                    setActiveId(null);
                }}
                onDragCancel={() => setActiveId(null)}
            >
                <div className="status-columns-wrapper">
                    <div className="status-columns">
                        {STATUS_OPTIONS.map((status) => {
                            if (hiddenStatuses.has(status)) {
                                return (
                                    <MinimizedColumn
                                        key={status}
                                        status={status}
                                        onExpand={() =>
                                            setHiddenStatuses((prev) => {
                                                const next = new Set(prev);
                                                next.delete(status);
                                                return next;
                                            })
                                        }
                                    />
                                );
                            }
                            return (
                                <StatusColumn
                                    key={status}
                                    status={status}
                                    applications={grouped[status] ?? []}
                                    expandedView={expandedView}
                                    onHide={() =>
                                        setHiddenStatuses((prev) => new Set(prev).add(status))
                                    }
                                />
                            );
                        })}
                    </div>
                </div>
                <DragOverlay
                    dropAnimation={{
                        duration: 200,
                        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                    }}
                    modifiers={[snapCenterToCursor]}
                >
                    {activeApp ? (
                        <ApplicationCardPreview
                            app={activeApp}
                            expanded={expandedView}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

export default StatusBoard;