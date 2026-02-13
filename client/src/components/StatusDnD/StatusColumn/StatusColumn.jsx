import React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import ApplicationCard from "../ApplicationCard/ApplicationCard";
import ThinLeftArrow from "../../../assets/icons/table/ThinLeftArrow.svg?react";
import "./StatusColumn.css";

const STATUS_COLORS = {
    Wishlist: "var(--wishlist-status-color)",
    Applied: "var(--applied-status-color)",
    Interviewing: "var(--interviewing-status-color)",
    Offer: "var(--offer-status-color)",
    Rejected: "var(--rejected-status-color)",
    Ghosted: "var(--ghosted-status-color)",
    Withdrawn: "var(--withdrawn-status-color)",
};

function StatusColumn({ status, applications, expandedView, onHide, onEdit, onDelete, onIncrementRound }) {
    const { setNodeRef } = useDroppable({ id: status });
    const statusColor = STATUS_COLORS[status] || "var(--decor-line-color)";
    return (
        <div ref={setNodeRef} className="status-column" style={{ "--status-color": statusColor }}>
            <div className="status-column-accent" aria-hidden="true" />
            <div className="status-column-header">
                <div className="status-column-title-wrap">
                    <span className="status-column-dot" style={{ backgroundColor: statusColor }} aria-hidden="true" />
                    <h3 className="status-column-title">{status.toUpperCase()}</h3>
                    <span className="status-column-count" aria-label={`${applications.length} cards`}>
                        {applications.length}
                    </span>
                </div>
                <button
                    type="button"
                    className="status-column-minimize"
                    onClick={(e) => {
                        e.stopPropagation();
                        onHide();
                    }}
                    aria-label={`Minimize ${status} column`}
                    title="Minimize column"
                >
                    <ThinLeftArrow className="status-column-minimize-icon" />
                </button>
            </div>
            <div className="status-column-content">
                <SortableContext
                    items={applications.map((app) => app.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {applications.map((app) => (
                        <ApplicationCard
                            key={app.id}
                            app={app}
                            expanded={expandedView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onIncrementRound={onIncrementRound}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

export default React.memo(StatusColumn);
