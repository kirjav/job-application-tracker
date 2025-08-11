import { useEffect, useState } from "react";
import API from "../../utils/api";
import EditApplication from "../EditApplication/EditApplication";
import "./ApplicationTable.css";

const ApplicationTable = () => {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [editAppId, setEditAppId] = useState(null);

  const fetchApplications = async (page = 1) => {
    setLoading(true);
    try {
      const res = await API.get("/applications", {
        params: { page, pageSize: pagination.pageSize },
      });
      setApplications(res.data.applications);
      setPagination({
        currentPage: res.data.currentPage,
        pageSize: res.data.pageSize,
        totalPages: res.data.totalPages,
      });
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await API.delete(`/applications/${id}`);
      fetchApplications(pagination.currentPage);
    } catch (err) {
      console.error("Failed to delete application", err);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div>
      <h2>Applications</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Position</th>
              <th>Status</th>
               <th>Mode</th>
              <th>Date Applied</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.company}</td>
                <td>{app.position}</td>
                <td>{app.status}</td>
                <td>{app.mode}</td>
                <td>{new Date(app.dateApplied).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => setEditAppId(app.id)}>Edit</button>
                  <button onClick={() => handleDelete(app.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={() => fetchApplications(pagination.currentPage - 1)}
          disabled={pagination.currentPage <= 1}
        >
          Previous
        </button>
        <span style={{ margin: "0 1rem" }}>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button
          onClick={() => fetchApplications(pagination.currentPage + 1)}
          disabled={pagination.currentPage >= pagination.totalPages}
        >
          Next
        </button>
      </div>

      {editAppId && (
        <div className="modal">
          <EditApplication
            applicationId={editAppId}
            onSuccess={() => {
              setEditAppId(null);
              fetchApplications(pagination.currentPage);
            }}
            onClose={() => setEditAppId(null)}
          />
        </div>
      )}
    </div>
  );
};

export default ApplicationTable;