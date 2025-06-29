
import { useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Header } from "@/components/navigation/Header";
import { DataUpload } from "@/components/data/DataUpload";
import { WaferMapViewer } from "@/components/analysis/WaferMapViewer";
import { YieldDashboard } from "@/components/analysis/YieldDashboard";
import { SPCCharts } from "@/components/analysis/SPCCharts";
import { DefectPatterns } from "@/components/analysis/DefectPatterns";
import { CorrelationAnalysis } from "@/components/analysis/CorrelationAnalysis";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { ExportManager } from "@/components/reports/ExportManager";
import { DataFilters, FilterState } from "@/components/filters/DataFilters";

const Index = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [uploadedData, setUploadedData] = useState(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    yieldRange: { min: 0, max: 100 },
    deviceFilter: 'all',
    lotFilter: 'all'
  });

  // Filter data based on current filters
  const getFilteredData = () => {
    if (!uploadedData?.edsData?.waferMaps) return uploadedData;

    const filteredWafers = uploadedData.edsData.waferMaps.filter((wafer: any) => {
      // Search filter
      if (filters.searchTerm && !wafer.header.waferId.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      // Device filter
      if (filters.deviceFilter !== 'all' && wafer.header.device !== filters.deviceFilter) {
        return false;
      }

      // Lot filter
      if (filters.lotFilter !== 'all' && wafer.header.lotNo !== filters.lotFilter) {
        return false;
      }

      // Yield range filter
      const yieldValue = wafer.header.yieldValue || wafer.header.yield || 0;
      if (yieldValue < filters.yieldRange.min || yieldValue > filters.yieldRange.max) {
        return false;
      }

      return true;
    });

    return {
      ...uploadedData,
      edsData: {
        ...uploadedData.edsData,
        waferMaps: filteredWafers
      }
    };
  };

  const filteredData = getFilteredData();

  const renderMainContent = () => {
    switch (currentView) {
      case "upload":
        return <DataUpload onDataUpload={setUploadedData} />;
      case "wafer-map":
        return (
          <div className="space-y-6">
            <DataFilters data={uploadedData} onFilterChange={setFilters} />
            <WaferMapViewer data={filteredData} />
          </div>
        );
      case "yield-analysis":
        return (
          <div className="space-y-6">
            <DataFilters data={uploadedData} onFilterChange={setFilters} />
            <YieldDashboard data={filteredData} />
          </div>
        );
      case "spc":
        return (
          <div className="space-y-6">
            <DataFilters data={uploadedData} onFilterChange={setFilters} />
            <SPCCharts data={filteredData} />
          </div>
        );
      case "defect-patterns":
        return (
          <div className="space-y-6">
            <DataFilters data={uploadedData} onFilterChange={setFilters} />
            <DefectPatterns data={filteredData} />
          </div>
        );
      case "correlation":
        return (
          <div className="space-y-6">
            <DataFilters data={uploadedData} onFilterChange={setFilters} />
            <CorrelationAnalysis data={filteredData} />
          </div>
        );
      case "reports":
        return (
          <div className="space-y-6">
            <ReportSummary data={filteredData} />
            <ExportManager data={filteredData} />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <DataFilters data={uploadedData} onFilterChange={setFilters} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <YieldDashboard data={filteredData} />
              <WaferMapViewer data={filteredData} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SPCCharts data={filteredData} />
              <DefectPatterns data={filteredData} />
            </div>
            <CorrelationAnalysis data={filteredData} />
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
