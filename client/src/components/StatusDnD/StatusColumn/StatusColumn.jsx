import React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import ApplicationCard from "../ApplicationCard/ApplicationCard";
import ThinLeftArrow from "../../../assets/icons/table/ThinLeftArrow.svg?react";
import "./StatusColumn.css";

function StatusColumn({ status, applications, expandedView, onHide }) {
    const { setNodeRef } = useDroppable({ id: status });
    return (
        <div ref={setNodeRef} className="status-column">
            <div className="status-column-header">
                <div className="status-column-title-wrap">
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
                        <ApplicationCard key={app.id} app={app} expanded={expandedView} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

export default StatusColumn;
