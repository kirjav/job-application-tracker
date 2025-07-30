import { useEffect, useState } from "react";
import API from "../utils/api";
import TagInput from "../components/TagInput/TagInput";
import { STATUS_OPTIONS } from "../constants/ApplicationStatuses";


const ApplicationForm = ({ existingApp, onSuccess }) => {
  const isEditMode = !!existingApp;

  const [selectedTags, setSelectedTags] = useState(() =>
    existingApp?.tags || []
  );

  const [formData, setFormData] = useState({
    company: existingApp?.company || "",
    position: existingApp?.position || "",
    status: existingApp?.status || "",
    source: existingApp?.source || "",
    notes: existingApp?.notes || "",
    tailoredResume: existingApp?.tailoredResume || false,
    tailoredCoverLetter: existingApp?.tailoredCoverLetter || false,
    dateApplied: existingApp?.dateApplied
      ? existingApp.dateApplied.split("T")[0]
      : "",
    tagIds: existingApp?.tags?.map((tag) => tag.id) || [],
  });

  // keep tagIds in sync with selectedTags
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tagIds: selectedTags.map((tag) => tag.id),
    }));
  }, [selectedTags]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode) {
        await API.put(`/applications/${existingApp.id}`, formData);
        alert("Application updated!");
      } else {
        await API.post("/applications", formData);
        alert("Application created!");
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Application form error:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEditMode ? "Update" : "Create"} Application</h2>

      <input
        type="text"
        name="company"
        value={formData.company}
        onChange={handleChange}
        placeholder="Company"
        required
      />

      <input
        type="text"
        name="position"
        value={formData.position}
        onChange={handleChange}
        placeholder="Position"
        required
      />

      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
        required
      >
        <option value="" disabled>
          Select status
        </option>
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>


      <input
        type="text"
        name="source"
        value={formData.source}
        onChange={handleChange}
        placeholder="Source (e.g. LinkedIn)"
      />

      <textarea
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        placeholder="Notes"
      />

      <label>
        <input
          type="checkbox"
          name="tailoredResume"
          checked={formData.tailoredResume}
          onChange={handleCheckboxChange}
        />
        Tailored Resume
      </label>

      <label>
        <input
          type="checkbox"
          name="tailoredCoverLetter"
          checked={formData.tailoredCoverLetter}
          onChange={handleCheckboxChange}
        />
        Tailored Cover Letter
      </label>

      <input
        type="date"
        name="dateApplied"
        value={formData.dateApplied}
        onChange={handleChange}
        required
      />

      <TagInput
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />

      <button type="submit">{isEditMode ? "Update" : "Submit"}</button>
    </form>
  );
};

export default ApplicationForm;