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
        <h2>{isEditMode ? "Update" : "Create"} Application</h2>

        <input name="company" value={formData.company} onChange={handleChange} placeholder="Company" required />
        <input name="position" value={formData.position} onChange={handleChange} placeholder="Position" required />

        <select name="status" value={formData.status} onChange={handleChange} required>
          <option value="" disabled>Select status</option>
          {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        <select name="mode" value={formData.mode} onChange={handleChange} required>
          <option value="" disabled>Select Work Arrangement</option>
          {MODE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        <input type="number" name="salaryExact" value={formData.salaryExact || ""} onChange={handleChange} placeholder="Exact Salary" />
        <input type="number" name="salaryMin" value={formData.salaryMin || ""} onChange={handleChange} placeholder="Min Salary" />
        <input type="number" name="salaryMax" value={formData.salaryMax || ""} onChange={handleChange} placeholder="Max Salary" />
        <input name="source" value={formData.source} onChange={handleChange} placeholder="Source (e.g. LinkedIn)" />
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes" />

        <label>
          <input type="checkbox" name="tailoredResume" checked={formData.tailoredResume} onChange={handleCheckboxChange} />
          Tailored Resume
        </label>

        <label>
          <input type="checkbox" name="tailoredCoverLetter" checked={formData.tailoredCoverLetter} onChange={handleCheckboxChange} />
          Tailored Cover Letter
        </label>

        <input type="date" name="dateApplied" value={formData.dateApplied} onChange={handleChange} required />

        <TagInput selectedTags={selectedTags} setSelectedTags={setSelectedTags} />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            onClick={() => (submitIntentRef.current = "submit")}
          >
            {isEditMode ? "Update" : "Submit"}
          </button>

          {!isEditMode && (
            <button
              type="submit"
              onClick={() => (submitIntentRef.current = "addAnother")}
            >
              Add another
            </button>
          )}

          {isEditMode && (
            <button
              type="submit"
              onClick={() => (submitIntentRef.current = "saveNew")}
              title="Save this, then start a new blank entry"
            >
              Save & New
            </button>
          )}

          {onCancel && (
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default ApplicationForm;
