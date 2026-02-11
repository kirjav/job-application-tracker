import ApplicationForm from "../../CoreJobAppFeatures/ApplicationForm/ApplicationForm";

const AddApplication = ({ onClose }) => {
  return (
    <div className="add-application-overlay" onClick={onClose}>
      <div
        className="add-application-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <ApplicationForm onSuccess={onClose} onCancel={onClose} />
      </div>
    </div>
  );
};

export default AddApplication;
