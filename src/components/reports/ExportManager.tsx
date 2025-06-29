import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF } from "@/utils/pdfExporter";
import { exportToExcel } from "@/utils/excelExporter";

interface ExportManagerProps {
  data?: any;
}

export const ExportManager = ({ data }: ExportManagerProps) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [exportSections, setExportSections] = useState({
    summary: true,
    waferMaps: true,
    yieldAnalysis: true,
    defectPatterns: true,
    integrityReport: true,
    rawData: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const hasData = data?.edsData?.waferMaps?.length > 0;

  const handleExport = async () => {
    if (!hasData) {
      toast({
        title: "No data to export",
        description: "Please upload EDS data first",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      const exportData = generateExportData(data, exportSections);
      
      if (exportFormat === 'csv') {
        downloadCSV(exportData);
      } else if (exportFormat === 'excel') {
        await exportToExcel(exportData, exportSections);
      } else {
        await exportToPDF(exportData, exportSections);
      }

      toast({
        title: "Export successful",
        description: `${exportFormat.toUpperCase()} file has been downloaded`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportData = (data: any, sections: typeof exportSections) => {
    const exportData: any = {};

    if (sections.summary && data.edsData) {
      exportData.summary = {
        totalWafers: data.edsData.waferMaps.length,
        averageYield: data.edsData.waferMaps.reduce((sum: number, w: any) => sum + w.header.yield, 0) / data.edsData.waferMaps.length,
        lotNumber: data.edsData.waferMaps[0]?.header.lotNo,
        device: data.edsData.waferMaps[0]?.header.device
      };
    }

    if (sections.waferMaps && data.edsData?.waferMaps) {
      exportData.waferMaps = data.edsData.waferMaps.map((wafer: any) => ({
        waferId: wafer.header.waferId,
        slotNo: wafer.header.slotNo,
        yield: wafer.header.yield,
        passDie: wafer.header.passDie,
        failDie: wafer.header.failDie,
        totalTestDie: wafer.header.totalTestDie
      }));
    }

    if (sections.integrityReport && data.edsData?.integrityReport) {
      exportData.integrityReport = {
        overallStatus: data.edsData.integrityReport.overallStatus,
        waferCountValid: data.edsData.integrityReport.waferCountValidation.isValid,
        bin1CountValid: data.edsData.integrityReport.bin1CountValidation.isValid,
        recommendations: data.edsData.integrityReport.recommendations
      };
    }

    return exportData;
  };

  const downloadCSV = (data: any) => {
    if (!data.waferMaps) return;

    const csvContent = [
      ['Wafer ID', 'Slot No', 'Yield (%)', 'Pass Die', 'Fail Die', 'Total Die'],
      ...data.waferMaps.map((wafer: any) => [
        wafer.waferId,
        wafer.slotNo,
        wafer.yield.toFixed(2),
        wafer.passDie,
        wafer.failDie,
        wafer.totalTestDie
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wafer-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "CSV file has been downloaded",
    });
  };

  const updateSection = (section: keyof typeof exportSections, checked: boolean) => {
    setExportSections(prev => ({ ...prev, [section]: checked }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Export Manager</span>
        </CardTitle>
        <CardDescription>
          Export analysis results and reports in various formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>PDF Report</span>
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Excel Workbook</span>
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>CSV Data</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Sections */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Include Sections</label>
            <div className="space-y-2">
              {Object.entries(exportSections).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => updateSection(key as keyof typeof exportSections, checked as boolean)}
                  />
                  <label htmlFor={key} className="text-sm capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Summary */}
          {hasData && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Export Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• {data.edsData.waferMaps.length} wafer maps</p>
                <p>• {Object.values(exportSections).filter(Boolean).length} sections selected</p>
                <p>• Format: {exportFormat.toUpperCase()}</p>
              </div>
            </div>
          )}

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            disabled={!hasData || isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>

          {!hasData && (
            <p className="text-sm text-gray-500 text-center">
              Upload EDS data to enable export functionality
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
