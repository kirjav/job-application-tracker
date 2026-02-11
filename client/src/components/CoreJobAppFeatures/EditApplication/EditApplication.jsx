import { useEffect, useState } from "react";
import API from "../../../utils/api";
import ApplicationForm from "../ApplicationForm/ApplicationForm";

const EditApplication = ({ applicationId, onSuccess, onClose }) => {
  const [appData, setAppData] = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await API.get(`/applications/${applicationId}`);
        setAppData(res.data);
      } catch (err) {
        console.error("Failed to load application", err);
        onClose?.(); // Close or hide component if it fails
      }
    };

    fetchApplication();
  }, [applicationId, onClose]);

  return appData ? (
    <div className="edit-application">
      <h3>Edit Application</h3>
      <ApplicationForm
        existingApp={appData}
        onSuccess={onSuccess}
        onCancel={onClose}
      />
      <div className="edit-application-actions">
        <button type="button" className="edit-application-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <p>Loading application...</p>
  );
};

export default EditApplication;
