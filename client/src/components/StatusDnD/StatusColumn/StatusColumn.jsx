import React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import ApplicationCard from "./ApplicationCard";

function StatusColumn({ status, applications, expandedView, onHide }) {

    const { setNodeRef } = useDroppable({ id: status });
    return (
        <div ref={setNodeRef} className="status-column" style={{ minWidth: "250px", border: "1px solid #ccc", padding: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>{status}</h3>
                <button onClick={onHide}>Hide</button>
            </div>

            <SortableContext
                items={applications.map((app) => app.id)}
                strategy={verticalListSortingStrategy}
            >
                {applications.map((app) => (
                    <ApplicationCard key={app.id} app={app} expanded={expandedView} />
                ))}
            </SortableContext>
        </div>
    );
}

export default StatusColumn;
