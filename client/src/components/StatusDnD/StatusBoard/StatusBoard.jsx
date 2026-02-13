import React, { useState, useMemo, useCallback } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { rectIntersection } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import StatusColumn from "../StatusColumn/StatusColumn";
import EditApplication from "../../CoreJobAppFeatures/EditApplication/EditApplication";
import API from "../../../utils/api";
import { STATUS_OPTIONS } from "../../../constants/ApplicationStatuses";
import { ApplicationCardPreview } from "../ApplicationCard/ApplicationCard";
import ThinRightArrow from "../../../assets/icons/table/ThinRightArrow.svg?react";
import ThinLeftArrow from "../../../assets/icons/table/ThinLeftArrow.svg?react";
import ArchiveIcon from "../../../assets/icons/KanbanBoard/ArchiveIcon.svg?react";
import "../../CoreJobAppFeatures/TableFeature/ApplicationTablePage/ApplicationTablePage.css";
import "./StatusBoard.css";

const POSITIVE_STATUSES = ["Wishlist", "Applied", "Interviewing", "Offer"];
const NEGATIVE_STATUSES = ["Rejected", "Ghosted", "Withdrawn"];

function fireOfferCelebration() {
  const count = 120;
  const defaults = { origin: { y: 0.6 }, zIndex: 9999 };
  function fire(particleRatio, opts) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

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

function NegativeDrawerToggle({ expanded, onToggle }) {
    return (
        <button
            type="button"
            className={`negative-drawer-toggle ${expanded ? "negative-drawer-expanded" : ""}`}
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide rejected, ghosted, and withdrawn columns" : "Show rejected, ghosted, and withdrawn columns"}
            title={expanded ? "Collapse" : "Rejected / Ghosted / Withdrawn"}
        >
            {expanded
                ? <ThinLeftArrow className="negative-drawer-chevron" />
                : <ThinRightArrow className="negative-drawer-chevron" />
            }
            <ArchiveIcon className="negative-drawer-icon" />
        </button>
    );
}

function StatusBoard({ expandedView = true, activityFilter = "all" }) {
    const qc = useQueryClient();
    const queryKey = ["applications", "board", activityFilter];

    const { data: applications = [] } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await API.get("/applications/all", {
                params: { activity: activityFilter },
            });
            return res.data;
        },
    });

    const [hiddenStatuses, setHiddenStatuses] = useState(new Set());
    const [showNegative, setShowNegative] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [editAppId, setEditAppId] = useState(null);

    const handleDelete = useCallback(
        async (id) => {
            if (!window.confirm("Delete this application?")) return;
            try {
                await API.delete(`/applications/${id}`);
                qc.invalidateQueries({ queryKey: ["applications"] });
            } catch (err) {
                console.error("Failed to delete application:", err);
                alert("Failed to delete application.");
            }
        },
        [qc]
    );

    const handleIncrementRound = useCallback(
        (appId, currentDone, total) => {
            const newDone = currentDone + 1;
            // Don't exceed total if set
            if (total != null && newDone > total) return;

            // Optimistic update
            const previous = qc.getQueryData(queryKey);
            qc.setQueryData(queryKey, (old) =>
                (old || []).map((app) =>
                    app.id === appId ? { ...app, interviewRoundsDone: newDone } : app
                )
            );

            API.patch(`/applications/${appId}`, { interviewRoundsDone: newDone })
                .catch((err) => {
                    console.error("Failed to increment interview round:", err);
                    qc.setQueryData(queryKey, previous);
                });
        },
        [qc, queryKey]
    );

    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
    });
    const sensors = useSensors(pointerSensor);

    const activeApp = useMemo(
        () => (activeId ? applications.find((a) => a.id === activeId) : null),
        [activeId, applications]
    );

    const grouped = useMemo(
        () => STATUS_OPTIONS.reduce((acc, status) => {
            acc[status] = applications.filter((app) => app.status === status);
            return acc;
        }, {}),
        [applications]
    );

    function handleDragEnd(event) {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const draggedId = active.id;

        // Step 1: Find dragged item
        const draggedApp = applications.find((a) => a.id === draggedId);
        if (!draggedApp) return;

        // Step 2: Find the actual column from `over.id`
        const overApp = applications.find((a) => a.id === over.id);
        const overColumn = STATUS_OPTIONS.includes(over.id) ? over.id : overApp?.status;

        if (!overColumn || draggedApp.status === overColumn) return;

        // Step 3: Optimistic cache update
        const previous = qc.getQueryData(queryKey);
        qc.setQueryData(queryKey, (old) =>
            (old || []).map((app) =>
                app.id === draggedId ? { ...app, status: overColumn } : app
            )
        );

        // Step 4: Persist to server
        API
            .patch(`/applications/${draggedId}`, { status: overColumn })
            .then(() => {
                if (overColumn === "Offer") fireOfferCelebration();
                qc.invalidateQueries({ queryKey: ["applications", "stats"] });
            })
            .catch((err) => {
                console.error("Failed to update application status:", err?.response?.data || err);
                qc.setQueryData(queryKey, previous); // revert on failure
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
                        {/* Positive columns – always visible */}
                        {POSITIVE_STATUSES.map((status) => {
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
                                    onEdit={setEditAppId}
                                    onDelete={handleDelete}
                                    onIncrementRound={handleIncrementRound}
                                />
                            );
                        })}

                        {/* Negative columns drawer */}
                        <NegativeDrawerToggle
                            expanded={showNegative}
                            onToggle={() => setShowNegative((v) => !v)}
                        />

                        {showNegative && NEGATIVE_STATUSES.map((status) => {
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
                                    onEdit={setEditAppId}
                                    onDelete={handleDelete}
                                    onIncrementRound={handleIncrementRound}
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

            {editAppId && (
                <div
                    className="status-board-edit-overlay"
                    onClick={() => setEditAppId(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Edit Application"
                    onKeyDown={(e) => { if (e.key === "Escape") setEditAppId(null); }}
                >
                    <div className="status-board-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <EditApplication
                            applicationId={editAppId}
                            onSuccess={() => {
                                setEditAppId(null);
                                qc.invalidateQueries({ queryKey: ["applications"] });
                            }}
                            onClose={() => setEditAppId(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default StatusBoard;