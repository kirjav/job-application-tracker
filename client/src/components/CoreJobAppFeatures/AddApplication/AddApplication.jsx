import ApplicationForm from "../../CoreJobAppFeatures/ApplicationForm/ApplicationForm";

const AddApplication = ({ onClose }) => {
  return (
    <div className="add-application-overlay" onClick={onClose}>
      <div
        className="add-application-modal"
        onClick={(e) => e.stopPropagation()} // prevents closing when clicking inside modal
      >
        <div className="add-application-header">
          <h2>Add Application</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <ApplicationForm onSuccess={onClose} onCancel={onClose} />
      </div>
    </div>
  );
};

export default AddApplication;
