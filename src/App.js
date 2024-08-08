import React, { useState, useEffect } from "react";
import FamilyTreeChart from "./FamilyTreeChart";
import data from "./data.json";

function App() {
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    setTreeData(data);
  }, []);

  return (
    <div className="App">{treeData && <FamilyTreeChart data={treeData} />}</div>
  );
}

export default App;
