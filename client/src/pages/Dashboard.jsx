import ApplicationTable from "../components/ApplicationTable/ApplicationTable";
import EditApplication from "../components/EditApplication";
import LogoutButton from "../components/LogoutButton";
import { useState } from "react";

const Dashboard = () => {
  const [selectedAppId, setSelectedAppId] = useState(null);

  return (
    
    <div>
      <div style={{ padding: "2rem" }}>
      <h1>Welcome to your dashboard!</h1>
      <LogoutButton />
    </div>
      <h1>Dashboard</h1>
      <ApplicationTable />
    </div>
  );
};

export default Dashboard;