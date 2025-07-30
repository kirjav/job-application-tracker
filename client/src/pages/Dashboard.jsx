import ApplicationTable from "../components/ApplicationTable/ApplicationTable";
import StatusBoard from "../components/StatusDnD/StatusBoard/StatusBoard"
import LogoutButton from "../components/LogoutButton";
import useTokenMonitor from "../hooks/useTokenMonitor";

const Dashboard = () => {
  useTokenMonitor();
  return (

    <div>
      <div style={{ padding: "2rem" }}>
        <h1>Welcome to your dashboard!</h1>
      </div>
      <h1>Dashboard</h1>
      <ApplicationTable />

      <StatusBoard />

    </div>
  );
};

export default Dashboard;