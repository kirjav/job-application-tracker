import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TableRowOptions from "../../../assets/icons/table/TableRowOptions.svg?react";
import "./ApplicationCard.css";

const STATUS_COLORS = {
  Wishlist: "var(--wishlist-status-color)",
  Applied: "var(--applied-status-color)",
  Interviewing: "var(--interviewing-status-color)",
  Offer: "var(--offer-status-color)",
  Rejected: "var(--rejected-status-color)",
  Ghosted: "var(--ghosted-status-color)",
  Withdrawn: "var(--withdrawn-status-color)",
};

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

/** Presentational card used in DragOverlay (no drag hooks – avoids jitter) */
export function ApplicationCardPreview({ app, expanded, isOverlay }) {
  const color = STATUS_COLORS[app.status] || "var(--decor-line-color)";
  return (
    <div
      className={`application-card ${expanded ? "expanded" : "minimized"} ${isOverlay ? "application-card-drag-overlay" : ""}`}
    >
      <div className="application-card-color-bar" style={{ backgroundColor: color }} />
      <div className="application-card-content">
        <div className="application-card-main">
          <div className="application-card-text">
            <div className="application-card-company">{app.company}</div>
            {expanded && (
              <>
                <div className="application-card-position">{app.position}</div>
                <div className="application-card-date">Applied: {formatDate(app.dateApplied)}</div>
              </>
            )}
          </div>
          {!isOverlay && (
            <button
              className="application-card-options"
              onClick={(e) => {
                e.stopPropagation();
                alert(`Options for ${app.company}`);
              }}
              aria-label="Options"
            >
              <TableRowOptions />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ app, expanded }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = isDragging
    ? { opacity: 0, transition: "none", pointerEvents: "none" }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: 1,
      };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`application-card ${expanded ? "expanded" : "minimized"}`}
      {...attributes}
      {...listeners}
    >
      <div
        className="application-card-color-bar"
        style={{ backgroundColor: STATUS_COLORS[app.status] || "var(--decor-line-color)" }}
      />
      <div className="application-card-content">
        <div className="application-card-main">
          <div className="application-card-text">
            <div className="application-card-company">{app.company}</div>
            {expanded && (
              <>
                <div className="application-card-position">{app.position}</div>
                <div className="application-card-date">Applied: {formatDate(app.dateApplied)}</div>
              </>
            )}
          </div>
          <button
            className="application-card-options"
            onClick={(e) => {
              e.stopPropagation();
              alert(`Options for ${app.company}`);
            }}
            aria-label="Options"
          >
            <TableRowOptions />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplicationCard;
