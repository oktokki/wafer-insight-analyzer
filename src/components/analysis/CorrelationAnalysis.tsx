
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface CorrelationAnalysisProps {
  data?: any;
}

export const CorrelationAnalysis = ({ data }: CorrelationAnalysisProps) => {
  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  
  if (!hasEdsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Correlation Analysis</CardTitle>
          <CardDescription>Statistical correlation between wafer position and yield</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Upload EDS data to view correlation analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const waferMaps = data.edsData.waferMaps;
  
  // Calculate position-based yield correlation
  const positionYieldData = waferMaps.map((wafer, index) => ({
    position: wafer.header.slotNo || index + 1,
    yield: wafer.header.yield,
    waferId: wafer.header.waferId,
    passDie: wafer.header.passDie,
    totalDie: wafer.header.totalTestDie
  }));

  // Calculate yield statistics
  const yields = waferMaps.map(w => w.header.yield);
  const avgYield = yields.reduce((sum, y) => sum + y, 0) / yields.length;
  const maxYield = Math.max(...yields);
  const minYield = Math.min(...yields);
  const yieldStdDev = Math.sqrt(yields.reduce((sum, y) => sum + Math.pow(y - avgYield, 2), 0) / yields.length);

  // Calculate correlation coefficient between position and yield
  const n = positionYieldData.length;
  const sumX = positionYieldData.reduce((sum, d) => sum + d.position, 0);
  const sumY = positionYieldData.reduce((sum, d) => sum + d.yield, 0);
  const sumXY = positionYieldData.reduce((sum, d) => sum + (d.position * d.yield), 0);
  const sumXX = positionYieldData.reduce((sum, d) => sum + (d.position * d.position), 0);
  const sumYY = positionYieldData.reduce((sum, d) => sum + (d.yield * d.yield), 0);
  
  const correlation = (n * sumXY - sumX * sumY) / 
    Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  const getCorrelationIcon = (corr: number) => {
    if (corr > 0.3) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (corr < -0.3) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getCorrelationStrength = (corr: number) => {
    const abs = Math.abs(corr);
    if (abs > 0.7) return "Strong";
    if (abs > 0.3) return "Moderate";
    return "Weak";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Correlation Analysis</CardTitle>
          <CardDescription>Statistical relationships in wafer test data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Yield Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Average Yield</p>
                <p className="text-2xl font-bold">{avgYield.toFixed(2)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Yield Range</p>
                <p className="text-2xl font-bold">{(maxYield - minYield).toFixed(2)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Std Deviation</p>
                <p className="text-2xl font-bold">{yieldStdDev.toFixed(2)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Wafer Count</p>
                <p className="text-2xl font-bold">{waferMaps.length}</p>
              </div>
            </div>

            {/* Position-Yield Correlation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Position vs Yield Correlation</h3>
                <div className="flex items-center space-x-2">
                  {getCorrelationIcon(correlation)}
                  <Badge variant={Math.abs(correlation) > 0.3 ? "default" : "secondary"}>
                    {getCorrelationStrength(correlation)} ({correlation.toFixed(3)})
                  </Badge>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={positionYieldData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" name="Position" />
                    <YAxis dataKey="yield" name="Yield" unit="%" />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow">
                              <p className="font-medium">{data.waferId}</p>
                              <p>Position: {data.position}</p>
                              <p>Yield: {data.yield.toFixed(2)}%</p>
                              <p>Pass Dies: {data.passDie.toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter dataKey="yield" fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Yield Distribution */}
            <div className="space-y-3">
              <h3 className="font-medium">Yield Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={positionYieldData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="waferId" angle={-45} textAnchor="end" height={80} />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Bar dataKey="yield" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
