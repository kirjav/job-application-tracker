import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import confetti from "canvas-confetti";
import TableRowOptions from "../../../assets/icons/table/TableRowOptions.svg?react";
import { Dropdown } from "../../Popover/Dropdown";
import "./ApplicationCard.css";

function fireRoundCelebration(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  confetti({
    particleCount: 30,
    spread: 50,
    startVelocity: 20,
    origin: { x, y },
    zIndex: 9999,
    scalar: 0.7,
    ticks: 60,
  });
}

function fireAllRoundsComplete(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  confetti({
    particleCount: 80,
    spread: 100,
    startVelocity: 35,
    origin: { x, y },
    zIndex: 9999,
  });
}

function InterviewProgress({ app, onIncrement, interactive }) {
  const done = app.interviewRoundsDone ?? 0;
  const total = app.interviewRoundsTotal;
  const hasTotal = total != null && total > 0;
  const allDone = hasTotal && done >= total;

  if (done === 0 && !hasTotal) return null;

  const btnRef = React.useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (allDone) return;
    onIncrement?.(app.id, done, total);
    // Fire celebration from button position
    if (hasTotal && done + 1 >= total) {
      fireAllRoundsComplete(btnRef.current);
    } else {
      fireRoundCelebration(btnRef.current);
    }
  };

  return (
    <div className="interview-progress">
      {hasTotal ? (
        <div className="interview-progress-bar-wrap">
          <div className="interview-progress-bar">
            <div
              className={`interview-progress-fill ${allDone ? "interview-progress-complete" : ""}`}
              style={{ width: `${Math.min((done / total) * 100, 100)}%` }}
            />
          </div>
          <span className="interview-progress-label">
            {done}/{total} rounds
          </span>
        </div>
      ) : (
        <span className="interview-progress-label">
          {done} round{done !== 1 ? "s" : ""} done
        </span>
      )}
      {interactive && !allDone && (
        <button
          ref={btnRef}
          type="button"
          className="interview-progress-increment"
          onClick={handleClick}
          aria-label={`Mark interview round ${done + 1} complete`}
          title="Complete a round"
        >
          +
        </button>
      )}
      {allDone && <span className="interview-progress-check" aria-label="All rounds complete" title="All rounds complete">&#10003;</span>}
    </div>
  );
}

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
export function ApplicationCardPreview({ app, expanded, isOverlay, onEdit, onDelete }) {
  const color = STATUS_COLORS[app.status] || "var(--decor-line-color)";
  const inactiveClass = app.isInactive ? "application-card-inactive" : "";
  return (
    <div
      className={`application-card ${expanded ? "expanded" : "minimized"} ${isOverlay ? "application-card-drag-overlay" : ""} ${inactiveClass}`}
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
                {app.status === "Interviewing" && (
                  <InterviewProgress app={app} interactive={false} />
                )}
              </>
            )}
          </div>
          {!isOverlay && (
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="application-card-options"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Options"
                >
                  <TableRowOptions />
                </button>
              }
              align="right"
              portal
            >
              {({ close }) => (
                <div role="menu" className="application-card-dropdown-menu">
                  <button
                    className="application-card-menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onEdit?.(app.id);
                      close();
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="application-card-menu-item application-card-menu-item-danger"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onDelete?.(app.id);
                      close();
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ app, expanded, onEdit, onDelete, onIncrementRound }) {
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

  const inactiveClass = app.isInactive ? "application-card-inactive" : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`application-card ${expanded ? "expanded" : "minimized"} ${inactiveClass}`}
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
                {app.status === "Interviewing" && (
                  <InterviewProgress app={app} onIncrement={onIncrementRound} interactive />
                )}
              </>
            )}
          </div>
          <Dropdown
            trigger={
              <button
                type="button"
                className="application-card-options"
                onClick={(e) => e.stopPropagation()}
                aria-label="Options"
              >
                <TableRowOptions />
              </button>
            }
            align="right"
            portal
          >
            {({ close }) => (
              <div role="menu" className="application-card-dropdown-menu">
                <button
                  className="application-card-menu-item"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onEdit?.(app.id);
                    close();
                  }}
                >
                  Edit
                </button>
                <button
                  className="application-card-menu-item application-card-menu-item-danger"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onDelete?.(app.id);
                    close();
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

export default ApplicationCard;
