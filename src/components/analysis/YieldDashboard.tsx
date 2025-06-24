
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface YieldDashboardProps {
  data?: any;
}

export const YieldDashboard = ({ data }: YieldDashboardProps) => {
  const yieldData = {
    current: 87.5,
    target: 85.0,
    previous: 89.2,
    trend: -1.7,
    lots: [
      { id: "LOT001", yield: 88.3, status: "pass" },
      { id: "LOT002", yield: 86.7, status: "pass" },
      { id: "LOT003", yield: 87.9, status: "pass" },
      { id: "LOT004", yield: 82.1, status: "warning" },
      { id: "LOT005", yield: 91.2, status: "excellent" }
    ],
    bins: {
      bin1: 87.5, // Pass
      bin2: 8.3,  // Fail
      bin3: 2.1,  // Marginal
      bin4: 2.1   // No Test
    }
  };

  const getTrendIcon = () => {
    if (yieldData.trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (yieldData.trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case "pass":
        return <Badge className="bg-blue-100 text-blue-800">Pass</Badge>;
      case "warning":
        return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yield Analysis Dashboard</CardTitle>
        <CardDescription>
          Real-time yield monitoring and lot-level analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{yieldData.current}%</div>
              <div className="text-sm text-blue-600">Current Yield</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{yieldData.target}%</div>
              <div className="text-sm text-green-600">Target</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1">
                <span className="text-2xl font-bold">{Math.abs(yieldData.trend)}%</span>
                {getTrendIcon()}
              </div>
              <div className="text-sm text-gray-600">vs Previous</div>
            </div>
          </div>

          {/* Bin Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium">Bin Distribution</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-sm">Bin 1 (Pass)</span>
                <span className="font-medium text-green-700">{yieldData.bins.bin1}%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                <span className="text-sm">Bin 2 (Fail)</span>
                <span className="font-medium text-red-700">{yieldData.bins.bin2}%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-sm">Bin 3 (Marginal)</span>
                <span className="font-medium text-orange-700">{yieldData.bins.bin3}%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Bin 4 (No Test)</span>
                <span className="font-medium text-gray-700">{yieldData.bins.bin4}%</span>
              </div>
            </div>
          </div>

          {/* Recent Lots */}
          <div className="space-y-3">
            <h4 className="font-medium">Recent Lots</h4>
            <div className="space-y-2">
              {yieldData.lots.map((lot) => (
                <div key={lot.id} className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-sm">{lot.id}</span>
                    {getStatusBadge(lot.status)}
                  </div>
                  <span className="font-medium">{lot.yield}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
