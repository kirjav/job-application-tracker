import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function ApplicationCard({ app, expanded }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: "1px solid #aaa",
    borderRadius: "8px",
    padding: "0.5rem",
    backgroundColor: "white",
    marginBottom: "0.5rem",
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{app.title}</strong>
        <button onClick={() => alert(`Edit ${app.title}`)}>Edit</button>
      </div>

      {expanded && (
        <div>
          <p>Company: {app.company}</p>
          <p>Status: {app.status}</p>
          {/* Add more fields here if needed */}
        </div>
      )}
    </div>
  );
}

export default ApplicationCard;
