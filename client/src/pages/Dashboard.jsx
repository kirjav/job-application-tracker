import StatusBoard from "../components/StatusDnD/StatusBoard/StatusBoard"
import useTokenMonitor from "../hooks/useTokenMonitor";

const Dashboard = () => {
  useTokenMonitor();
  return (

    <div>
      <div style={{ padding: "2rem" }}>
        <h1>Welcome to your dashboard!</h1>
      </div>
      <h1>Dashboard</h1>
      <StatusBoard />

    </div>
  );
};

export default Dashboard;