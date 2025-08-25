import "./StatusDisplay.css";

export function StatusDisplay ({statusType = ""}) {
    return (
        <div className="status-pill" data-status={statusType}>{statusType}</div>
    )
}