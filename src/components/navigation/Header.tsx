
import { Upload, Settings, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF } from "@/utils/pdfExporter";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  uploadedData: any;
}

export const Header = ({ uploadedData }: HeaderProps) => {
  const { toast } = useToast();

  const handleExportReport = async () => {
    if (!uploadedData?.edsData?.waferMaps?.length && !uploadedData?.secondFoundryData?.length) {
      toast({
        title: "No data to export",
        description: "Please upload wafer map data first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate export data similar to ExportManager
      const exportData: any = {};
      const exportSections = {
        summary: true,
        waferMaps: true,
        yieldAnalysis: true,
        defectPatterns: true,
        integrityReport: true,
        rawData: false
      };

      // Handle EDS data
      if (uploadedData.edsData?.waferMaps?.length > 0) {
        exportData.summary = {
          totalWafers: uploadedData.edsData.waferMaps.length,
          averageYield: uploadedData.edsData.waferMaps.reduce((sum: number, w: any) => sum + w.header.yield, 0) / uploadedData.edsData.waferMaps.length,
          lotNumber: uploadedData.edsData.waferMaps[0]?.header.lotNo,
          device: uploadedData.edsData.waferMaps[0]?.header.device
        };

        exportData.waferMaps = uploadedData.edsData.waferMaps.map((wafer: any) => ({
          waferId: wafer.header.waferId,
          slotNo: wafer.header.slotNo,
          yieldValue: wafer.header.yield,
          passDie: wafer.header.passDie,
          failDie: wafer.header.failDie,
          totalTestDie: wafer.header.totalTestDie
        }));
      }
      // Handle Second Foundry data
      else if (uploadedData.secondFoundryData?.length > 0) {
        exportData.summary = {
          totalWafers: uploadedData.secondFoundryData.length,
          averageYield: uploadedData.secondFoundryData.reduce((sum: number, w: any) => sum + w.yieldPercentage, 0) / uploadedData.secondFoundryData.length,
          lotNumber: 'N/A',
          device: uploadedData.secondFoundryData[0]?.header.device
        };

        exportData.waferMaps = uploadedData.secondFoundryData.map((wafer: any) => ({
          waferId: wafer.header.waferId,
          slotNo: 'N/A',
          yieldValue: wafer.yieldPercentage,
          passDie: wafer.header.good,
          failDie: wafer.header.fail,
          totalTestDie: wafer.header.good + wafer.header.fail
        }));
      }

      if (uploadedData.edsData?.integrityReport) {
        exportData.integrityReport = {
          overallStatus: uploadedData.edsData.integrityReport.overallStatus,
          waferCountValid: uploadedData.edsData.integrityReport.waferCountValidation.isValid,
          bin1CountValid: uploadedData.edsData.integrityReport.bin1CountValidation.isValid,
          recommendations: uploadedData.edsData.integrityReport.recommendations
        };
      }

      await exportToPDF(exportData, exportSections);

      toast({
        title: "Export successful",
        description: "PDF report has been downloaded",
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KGD Analytics System</h1>
              <p className="text-sm text-gray-500">Knowledge-based Quality Diagnostics Platform</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            Status: {uploadedData ? (
              <span className="text-green-600 font-medium">Data Loaded</span>
            ) : (
              <span className="text-orange-600 font-medium">No Data</span>
            )}
          </div>
          
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
};
