
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedStdfData } from "@/utils/stdfParser";

interface StdfDataDisplayProps {
  parsedStdfData: ParsedStdfData;
}

export const StdfDataDisplay = ({ parsedStdfData }: StdfDataDisplayProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>STDF Data Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Total Parts:</span> {parsedStdfData.summary.totalParts.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Pass Parts:</span> {parsedStdfData.summary.passParts.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Fail Parts:</span> {parsedStdfData.summary.failParts.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Yield:</span> {parsedStdfData.summary.yieldPercentage.toFixed(2)}%
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">File Information:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Lot ID:</span> {parsedStdfData.header.lotId}</div>
              <div><span className="font-medium">Part Type:</span> {parsedStdfData.header.partType}</div>
              <div><span className="font-medium">Test Program:</span> {parsedStdfData.header.testProgram}</div>
              <div><span className="font-medium">Test Time:</span> {new Date(parsedStdfData.header.testTime).toLocaleString()}</div>
              <div><span className="font-medium">Operator:</span> {parsedStdfData.header.operatorId}</div>
              <div><span className="font-medium">Temperature:</span> {parsedStdfData.header.testTemperature}°C</div>
            </div>
            
            {parsedStdfData.waferInfo && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <h5 className="font-medium text-blue-900 mb-1">Wafer Information:</h5>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div><span className="font-medium">Wafer ID:</span> {parsedStdfData.waferInfo.waferId}</div>
                  <div><span className="font-medium">Size:</span> {parsedStdfData.waferInfo.waferX} × {parsedStdfData.waferInfo.waferY} {parsedStdfData.waferInfo.waferUnits}</div>
                  <div><span className="font-medium">Flat:</span> {parsedStdfData.waferInfo.flatDirection}</div>
                  <div><span className="font-medium">Center:</span> ({parsedStdfData.waferInfo.centerX}, {parsedStdfData.waferInfo.centerY})</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Bin Distribution:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(parsedStdfData.binSummary).map(([bin, data]) => (
                <Badge key={bin} variant={bin === '1' ? "default" : "destructive"}>
                  BIN{bin}: {data.count} ({data.description})
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Available Tests:</h4>
            <div className="flex flex-wrap gap-2">
              {parsedStdfData.summary.testNames.map(testName => (
                <Badge key={testName} variant="outline">
                  {testName}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
