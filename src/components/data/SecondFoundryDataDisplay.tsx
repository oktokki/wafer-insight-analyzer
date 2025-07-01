
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SecondFoundryMapData } from "@/utils/secondFoundryParser";

interface SecondFoundryDataDisplayProps {
  parsedData: SecondFoundryMapData[];
}

export const SecondFoundryDataDisplay = ({ parsedData }: SecondFoundryDataDisplayProps) => {
  const totalGood = parsedData.reduce((sum, wafer) => sum + wafer.header.good, 0);
  const totalFail = parsedData.reduce((sum, wafer) => sum + wafer.header.fail, 0);
  const averageYield = parsedData.length > 0 
    ? parsedData.reduce((sum, wafer) => sum + wafer.yield, 0) / parsedData.length 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Second Foundry Data Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Total Wafers:</span> {parsedData.length}
            </div>
            <div>
              <span className="font-medium">Total Good Dies:</span> {totalGood.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Total Fail Dies:</span> {totalFail.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Average Yield:</span> {averageYield.toFixed(2)}%
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Wafer Information:</h4>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {parsedData.map((wafer, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{wafer.header.waferId}</span>
                    <span className="text-sm text-gray-500 ml-2">({wafer.header.device})</span>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="default">
                      {wafer.yield.toFixed(1)}%
                    </Badge>
                    <Badge variant="outline">
                      {wafer.header.x}×{wafer.header.y}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Bin Distribution (All Wafers):</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">
                GOOD: {totalGood.toLocaleString()}
              </Badge>
              <Badge variant="destructive">
                FAIL: {totalFail.toLocaleString()}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
