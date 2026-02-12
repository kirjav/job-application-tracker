// components/ApplicationForm.jsx
import { useEffect, useState, useRef } from "react";
import API from "../../../utils/api";
import TagInput from "../TableFeature/TagInput/TagInput";

import { STATUS_OPTIONS } from "../../../constants/ApplicationStatuses";
import { MODE_OPTIONS } from "../../../constants/ApplicationModes";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import "./ApplicationForm.css";

const ApplicationForm = ({ existingApp, onSuccess, onCancel }) => {
  const qc = useQueryClient();
  const isEditMode = !!existingApp;

  const [selectedTags, setSelectedTags] = useState(() => existingApp?.tags || []);
  const [formData, setFormData] = useState({
    company: existingApp?.company || "",
    position: existingApp?.position || "",
    status: existingApp?.status || "",
    mode: existingApp?.mode || "",
    source: existingApp?.source || "",
    notes: existingApp?.notes || "",
    tailoredResume: existingApp?.tailoredResume || false,
    tailoredCoverLetter: existingApp?.tailoredCoverLetter || false,
    dateApplied: existingApp?.dateApplied
      ? existingApp.dateApplied.split("T")[0]
      : new Date().toISOString().split("T")[0],
    salaryExact: existingApp?.salaryExact || "",
    salaryMin: existingApp?.salaryMin || "",
    salaryMax: existingApp?.salaryMax || "",
    tagIds: existingApp?.tags?.map((tag) => tag.id) || [],
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tagIds: selectedTags.map((tag) => tag.id),
    }));
  }, [selectedTags]);

  const resetForm = () => {
    setSelectedTags([]);
    setFormData({
      company: "",
      position: "",
      status: "",
      mode: "",
      source: "",
      notes: "",
      tailoredResume: false,
      tailoredCoverLetter: false,
      dateApplied: new Date().toISOString().split("T")[0],
      salaryExact: "",
      salaryMin: "",
      salaryMax: "",
      tagIds: [],
    });
  };

  // --- mutations ---
  const createMutation = useMutation({
    mutationFn: async (payload) => (await API.post("/applications", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["applications", "stats"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => (await API.put(`/applications/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["applications", "stats"] });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const submitIntentRef = useRef("submit"); // "submit" | "addAnother" | "saveNew"

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const intent = submitIntentRef.current; // "submit" | "addAnother" | "saveNew"

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: existingApp.id, payload: formData });
        alert(intent === "saveNew" ? "Application updated! Starting a new blank entry…" : "Application updated!");
      } else {
        await createMutation.mutateAsync(formData);
        alert(intent === "addAnother" ? "Application created! Ready for another." : "Application created!");
      }

      if (intent === "addAnother" || intent === "saveNew") {
        resetForm();
      } else {
        onSuccess?.();
      }
    } catch (err) {
      console.error("Application form error:", err);
      alert("Something went wrong.");
    } finally {
      submitIntentRef.current = "submit";
    }
  };


  const ref = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onCancel]);

  return (
    <div className="application-overlay">
      <form onSubmit={handleSubmit} className="application-form" ref={ref}>
        <header className="application-form-header">
          {onCancel ? (
            <button
              type="button"
              className="application-form-close"
              onClick={onCancel}
              aria-label="Close"
            >
              ×
            </button>
          ) : (
            <div className="application-form-header-spacer" />
          )}
          <h2 className="application-form-title" id="application-form-heading">
            {isEditMode ? "Update" : "Create"} Application
          </h2>
          <div className="application-form-header-spacer" />
        </header>
        <div className="application-form-divider" aria-hidden="true" />

        <div className="application-form-body">
        <div className="application-form-section">
          <label className="application-form-label application-form-label-required" htmlFor="app-company">Company</label>
          <input id="app-company" className="application-form-input" name="company" value={formData.company} onChange={handleChange} placeholder="Company" required />
        </div>
        <div className="application-form-section">
          <label className="application-form-label application-form-label-required" htmlFor="app-position">Position</label>
          <input id="app-position" className="application-form-input" name="position" value={formData.position} onChange={handleChange} placeholder="Position" required />
        </div>

        <div className="application-form-row application-form-two-col">
          <div className="application-form-section">
            <label className="application-form-label application-form-label-required" htmlFor="app-status">Status</label>
            <select id="app-status" className="application-form-select" name="status" value={formData.status} onChange={handleChange} required>
              <option value="" disabled>Select status</option>
              {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="application-form-section">
            <label className="application-form-label application-form-label-required" htmlFor="app-mode">Work Arrangement</label>
            <select id="app-mode" className="application-form-select" name="mode" value={formData.mode} onChange={handleChange} required>
              <option value="" disabled>Select mode</option>
              {MODE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="application-form-section">
          <label className="application-form-label application-form-label-required" htmlFor="app-dateApplied">Date Applied</label>
          <div className="application-form-date-pill">
            <input id="app-dateApplied" className="application-form-date-input" type="date" name="dateApplied" value={formData.dateApplied} onChange={handleChange} required />
          </div>
        </div>

        <div className="application-form-row application-form-three-col">
          <div className="application-form-section">
            <label className="application-form-label" htmlFor="app-salaryExact">Exact Salary</label>
            <div className="application-form-salary-wrap">
              <span className="application-form-salary-prefix" aria-hidden>$</span>
              <input id="app-salaryExact" className="application-form-input" type="number" name="salaryExact" value={formData.salaryExact || ""} onChange={handleChange} placeholder="—" />
            </div>
          </div>
          <div className="application-form-section">
            <label className="application-form-label" htmlFor="app-salaryMin">Min Salary</label>
            <div className="application-form-salary-wrap">
              <span className="application-form-salary-prefix" aria-hidden>$</span>
              <input id="app-salaryMin" className="application-form-input" type="number" name="salaryMin" value={formData.salaryMin || ""} onChange={handleChange} placeholder="—" />
            </div>
          </div>
          <div className="application-form-section">
            <label className="application-form-label" htmlFor="app-salaryMax">Max Salary</label>
            <div className="application-form-salary-wrap">
              <span className="application-form-salary-prefix" aria-hidden>$</span>
              <input id="app-salaryMax" className="application-form-input" type="number" name="salaryMax" value={formData.salaryMax || ""} onChange={handleChange} placeholder="—" />
            </div>
          </div>
        </div>

        <div className="application-form-section">
          <label className="application-form-label" htmlFor="app-source">Source</label>
          <input id="app-source" className="application-form-input" name="source" value={formData.source} onChange={handleChange} placeholder="e.g. LinkedIn" />
        </div>

        <div className="application-form-section">
          <label className="application-form-label" htmlFor="app-notes">Notes</label>
          <textarea id="app-notes" className="application-form-textarea" name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes" rows={3} />
        </div>

        <div className="application-form-section application-form-checkboxes">
          <label className="application-form-checkbox-label">
            <input type="checkbox" name="tailoredResume" checked={formData.tailoredResume} onChange={handleCheckboxChange} className="application-form-checkbox" />
            <span>Tailored Resume</span>
          </label>
          <label className="application-form-checkbox-label">
            <input type="checkbox" name="tailoredCoverLetter" checked={formData.tailoredCoverLetter} onChange={handleCheckboxChange} className="application-form-checkbox" />
            <span>Tailored Cover Letter</span>
          </label>
        </div>

        <div className="application-form-section">
          <label className="application-form-label">Tags</label>
          <div className="application-form-tag-wrap">
            <TagInput selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
          </div>
        </div>

        <div className="application-form-actions">
          <button
            type="submit"
            className="application-form-btn application-form-btn-solid"
            onClick={() => (submitIntentRef.current = "submit")}
          >
            {isEditMode ? "Update" : "Submit"}
          </button>
          {!isEditMode && (
            <button
              type="submit"
              className="application-form-btn application-form-btn-outline"
              onClick={() => (submitIntentRef.current = "addAnother")}
            >
              Add another
            </button>
          )}
          {isEditMode && (
            <button
              type="submit"
              className="application-form-btn application-form-btn-outline"
              onClick={() => (submitIntentRef.current = "saveNew")}
              title="Save this, then start a new blank entry"
            >
              Save & New
            </button>
          )}
        </div>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
