
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedEdsData } from "@/utils/edsMapParser";
import { DataIntegrityReportComponent } from "./DataIntegrityReport";

interface EdsDataDisplayProps {
  parsedData: ParsedEdsData;
}

export const EdsDataDisplay = ({ parsedData }: EdsDataDisplayProps) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>EDS Data Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Wafer Count:</span> {parsedData.waferMaps.length}
              </div>
              <div>
                <span className="font-medium">Average Yield:</span> {' '}
                {parsedData.waferMaps.length > 0 
                  ? (parsedData.waferMaps.reduce((sum, w) => sum + w.header.yield, 0) / parsedData.waferMaps.length).toFixed(2)
                  : parsedData.lotSummary?.overallStats.overallYield.toFixed(2) || 0}%
              </div>
            </div>
            
            {parsedData.lotSummary && (
              <div className="space-y-2">
                <h4 className="font-medium">Lot Summary Information:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Lot:</span> {parsedData.lotSummary.header.lotNumber}</div>
                  <div><span className="font-medium">Device:</span> {parsedData.lotSummary.header.device}</div>
                  <div><span className="font-medium">Total Dies:</span> {parsedData.lotSummary.overallStats.totalDies.toLocaleString()}</div>
                  <div><span className="font-medium">Pass Dies:</span> {parsedData.lotSummary.overallStats.totalPass.toLocaleString()}</div>
                </div>
                {parsedData.lotSummary.testModes.length > 0 && (
                  <div>
                    <span className="font-medium">Test Modes:</span> {parsedData.lotSummary.testModes.join(', ')}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="font-medium">Quick Validation Results:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant={parsedData.validationResults.waferCountMatch ? "default" : "destructive"}>
                  Wafer Count: {parsedData.validationResults.waferCountMatch ? "✓" : "✗"}
                </Badge>
                <Badge variant={parsedData.validationResults.bin1CountMatch ? "default" : "destructive"}>
                  BIN1 Count: {parsedData.validationResults.bin1CountMatch ? "✓" : "✗"}
                </Badge>
                {parsedData.lotSummary && (
                  <Badge variant={parsedData.validationResults.lotSummaryMatch ? "default" : "destructive"}>
                    Lot Summary: {parsedData.validationResults.lotSummaryMatch ? "✓" : "✗"}
                  </Badge>
                )}
              </div>
              
              {parsedData.validationResults.issues.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Quick Validation Issues:</span>
                  </div>
                  <ul className="text-sm text-amber-700 mt-1 ml-6">
                    {parsedData.validationResults.issues.slice(0, 3).map((issue, idx) => (
                      <li key={idx}>• {issue}</li>
                    ))}
                    {parsedData.validationResults.issues.length > 3 && (
                      <li>• ...and {parsedData.validationResults.issues.length - 3} more issues</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DataIntegrityReportComponent report={parsedData.integrityReport} />
    </>
  );
};
