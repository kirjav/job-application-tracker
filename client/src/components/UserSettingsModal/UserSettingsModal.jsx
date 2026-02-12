import { useState, useEffect, useCallback } from "react";
import API from "../../utils/api";
import "./UserSettingsModal.css";

const EDIT_MODES = { NAME: "name", EMAIL: "email", PASSWORD: "password", INACTIVITY: "inactivity" };

export default function UserSettingsModal({ onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const [nameValue, setNameValue] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [inactivityDays, setInactivityDays] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const { data } = await API.get("/user/me");
      setProfile(data);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const openEdit = (mode) => {
    setEditError("");
    setEditMode(mode);
    if (mode === EDIT_MODES.NAME) setNameValue(profile?.name ?? "");
    if (mode === EDIT_MODES.EMAIL) {
      setEmailPassword("");
      setNewEmail("");
    }
    if (mode === EDIT_MODES.PASSWORD) {
      setOldPassword("");
      setNewPassword("");
    }
    if (mode === EDIT_MODES.INACTIVITY) setInactivityDays(String(profile?.inactivityGraceDays ?? 0));
  };

  const closeEdit = () => {
    setEditMode(null);
    setEditError("");
  };

  const handleSaveName = async () => {
    setEditError("");
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setEditError("Name is required");
      return;
    }
    setSaving(true);
    try {
      await API.patch("/user/me", { name: trimmed });
      setProfile((p) => (p ? { ...p, name: trimmed } : p));
      closeEdit();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setEditError("");
    if (!emailPassword) {
      setEditError("Current password is required");
      return;
    }
    if (!newEmail.trim()) {
      setEditError("New email is required");
      return;
    }
    setSaving(true);
    try {
      await API.put("/user/update-email", { password: emailPassword, newEmail: newEmail.trim() });
      await fetchProfile();
      closeEdit();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    setEditError("");
    if (!oldPassword) {
      setEditError("Current password is required");
      return;
    }
    if (!newPassword) {
      setEditError("New password is required");
      return;
    }
    setSaving(true);
    try {
      await API.put("/user/update-password", { oldPassword, newPassword });
      closeEdit();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInactivity = async () => {
    setEditError("");
    const num = parseInt(inactivityDays, 10);
    if (Number.isNaN(num) || num < 0 || num > 365) {
      setEditError("Enter a number between 0 and 365");
      return;
    }
    setSaving(true);
    try {
      await API.patch("/user/me", { inactivityGraceDays: num });
      setProfile((p) => (p ? { ...p, inactivityGraceDays: num } : p));
      closeEdit();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Failed to update threshold");
    } finally {
      setSaving(false);
    }
  };

  if (!profile && !loading && !error) return null;

  return (
    <div className="user-settings-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} onKeyDown={(e) => { if (e.key === "Escape" && !editMode) onClose(); }}>
      <div className="user-settings-modal" role="dialog" aria-labelledby="user-settings-title" aria-modal="true">
        <div className="user-settings-header">
          <h2 id="user-settings-title" className="user-settings-title">User Settings</h2>
          <button type="button" className="user-settings-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="user-settings-body">
          {loading && <div className="user-settings-loading">Loading…</div>}
          {error && <div className="user-settings-loading user-settings-error">{error}</div>}
          {profile && !loading && (
            <>
              <div className="user-settings-row">
                <div className="user-settings-row-content">
                  <span className="user-settings-row-label">Name</span>
                  <span className="user-settings-row-value">{profile.name || "—"}</span>
                </div>
                <button type="button" className="user-settings-edit-btn" onClick={() => openEdit(EDIT_MODES.NAME)}>
                  Edit
                </button>
              </div>
              <div className="user-settings-row">
                <div className="user-settings-row-content">
                  <span className="user-settings-row-label">Email</span>
                  <span className="user-settings-row-value">{profile.emailMasked || "—"}</span>
                </div>
                <button type="button" className="user-settings-edit-btn" onClick={() => openEdit(EDIT_MODES.EMAIL)}>
                  Edit
                </button>
              </div>
              <div className="user-settings-row">
                <div className="user-settings-row-content">
                  <span className="user-settings-row-label">Password</span>
                  <span className="user-settings-row-value">••••••••</span>
                </div>
                <button type="button" className="user-settings-edit-btn" onClick={() => openEdit(EDIT_MODES.PASSWORD)}>
                  Edit
                </button>
              </div>
              <div className="user-settings-row">
                <div className="user-settings-row-content">
                  <span className="user-settings-row-label">Application Inactivity Threshold</span>
                  <span className="user-settings-row-value">
                    {profile.inactivityGraceDays ?? 0} days
                  </span>
                </div>
                <button type="button" className="user-settings-edit-btn" onClick={() => openEdit(EDIT_MODES.INACTIVITY)}>
                  Edit
                </button>
              </div>
            </>
          )}
        </div>

        {/* Edit sub-modal */}
        {editMode && (
          <div
            className="user-settings-edit-overlay"
            onClick={(e) => { e.stopPropagation(); closeEdit(); }}
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${editMode}`}
            onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); closeEdit(); } }}
          >
            <div className="user-settings-edit-box" onClick={(e) => e.stopPropagation()}>
              {editMode === EDIT_MODES.NAME && (
                <>
                  <h3 className="user-settings-edit-title">Edit Name</h3>
                  <div className="user-settings-edit-field">
                    <label htmlFor="user-settings-name">Name</label>
                    <input
                      id="user-settings-name"
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {editError && <p className="user-settings-error">{editError}</p>}
                  <div className="user-settings-edit-actions">
                    <button type="button" className="user-settings-edit-cancel" onClick={closeEdit}>
                      Cancel
                    </button>
                    <button type="button" className="user-settings-edit-save" onClick={handleSaveName} disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </>
              )}
              {editMode === EDIT_MODES.EMAIL && (
                <>
                  <h3 className="user-settings-edit-title">Edit Email</h3>
                  <div className="user-settings-edit-field">
                    <label htmlFor="user-settings-email-password">Current password</label>
                    <input
                      id="user-settings-email-password"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="user-settings-edit-field">
                    <label htmlFor="user-settings-new-email">New email</label>
                    <input
                      id="user-settings-new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  {editError && <p className="user-settings-error">{editError}</p>}
                  <div className="user-settings-edit-actions">
                    <button type="button" className="user-settings-edit-cancel" onClick={closeEdit}>
                      Cancel
                    </button>
                    <button type="button" className="user-settings-edit-save" onClick={handleSaveEmail} disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </>
              )}
              {editMode === EDIT_MODES.PASSWORD && (
                <>
                  <h3 className="user-settings-edit-title">Edit Password</h3>
                  <div className="user-settings-edit-field">
                    <label htmlFor="user-settings-old-password">Current password</label>
                    <input
                      id="user-settings-old-password"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="user-settings-edit-field">
                    <label htmlFor="user-settings-new-password">New password</label>
                    <input
                      id="user-settings-new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  {editError && <p className="user-settings-error">{editError}</p>}
                  <div className="user-settings-edit-actions">
                    <button type="button" className="user-settings-edit-cancel" onClick={closeEdit}>
                      Cancel
                    </button>
                    <button type="button" className="user-settings-edit-save" onClick={handleSavePassword} disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </>
              )}
              {editMode === EDIT_MODES.INACTIVITY && (
                <>
                  <h3 className="user-settings-edit-title">Edit Application Inactivity Threshold</h3>
                  <div className="user-settings-edit-field">
                    <label htmlFor="user-settings-inactivity">Days (0–365)</label>
                    <input
                      id="user-settings-inactivity"
                      type="number"
                      min={0}
                      max={365}
                      value={inactivityDays}
                      onChange={(e) => setInactivityDays(e.target.value)}
                    />
                  </div>
                  {editError && <p className="user-settings-error">{editError}</p>}
                  <div className="user-settings-edit-actions">
                    <button type="button" className="user-settings-edit-cancel" onClick={closeEdit}>
                      Cancel
                    </button>
                    <button type="button" className="user-settings-edit-save" onClick={handleSaveInactivity} disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
