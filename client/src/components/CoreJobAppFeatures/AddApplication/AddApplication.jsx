import { useEffect, useRef } from "react";
import ApplicationForm from "../../CoreJobAppFeatures/ApplicationForm/ApplicationForm";

const AddApplication = ({ onClose }) => {
  const overlayRef = useRef(null);

  // trap focus + ESC to close
  useEffect(() => {
    const prev = document.activeElement;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      // focus-trap: loop Tab within the overlay
      if (e.key === "Tab" && overlayRef.current) {
        const focusable = overlayRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // move focus into the dialog
    requestAnimationFrame(() => {
      const first = overlayRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="add-application-overlay"
      onClick={onClose}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Add Application"
    >
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
