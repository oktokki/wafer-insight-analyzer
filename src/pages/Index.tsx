
import { useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Header } from "@/components/navigation/Header";
import { DataUpload } from "@/components/data/DataUpload";
import { WaferMapViewer } from "@/components/analysis/WaferMapViewer";
import { YieldDashboard } from "@/components/analysis/YieldDashboard";
import { SPCCharts } from "@/components/analysis/SPCCharts";
import { DefectPatterns } from "@/components/analysis/DefectPatterns";
import { ReportSummary } from "@/components/reports/ReportSummary";

const Index = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [uploadedData, setUploadedData] = useState(null);

  const renderMainContent = () => {
    switch (currentView) {
      case "upload":
        return <DataUpload onDataUpload={setUploadedData} />;
      case "wafer-map":
        return <WaferMapViewer data={uploadedData} />;
      case "yield-analysis":
        return <YieldDashboard data={uploadedData} />;
      case "spc":
        return <SPCCharts data={uploadedData} />;
      case "defect-patterns":
        return <DefectPatterns data={uploadedData} />;
      case "reports":
        return <ReportSummary data={uploadedData} />;
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <YieldDashboard data={uploadedData} />
              <WaferMapViewer data={uploadedData} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SPCCharts data={uploadedData} />
              <DefectPatterns data={uploadedData} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col">
        <Header uploadedData={uploadedData} />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
