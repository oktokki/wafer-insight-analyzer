
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SPCChartsProps {
  data?: any;
}

export const SPCCharts = ({ data }: SPCChartsProps) => {
  const controlData = useMemo(() => {
    // Check if we have real EDS data
    if (data?.edsData?.waferMaps?.length > 0) {
      const waferMaps = data.edsData.waferMaps;
      
      // Use actual yield values from wafers
      const values = waferMaps.map(wafer => wafer.header.yield);
      const avgYield = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Calculate control limits based on actual data
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avgYield, 2), 0) / values.length);
      const ucl = avgYield + (3 * stdDev);
      const lcl = Math.max(0, avgYield - (3 * stdDev));
      
      return {
        values,
        ucl,
        lcl,
        target: avgYield,
        isRealData: true
      };
    }
    
    // Fallback to mock data
    return {
      values: [87.2, 88.1, 86.9, 89.3, 87.5, 88.7, 85.2, 86.8, 88.9, 87.1, 89.2, 86.5],
      ucl: 92.0,
      lcl: 82.0,
      target: 87.0,
      isRealData: false
    };
  }, [data]);

  const paretoData = useMemo(() => {
    // Check if we have real EDS data
    if (data?.edsData?.waferMaps?.length > 0) {
      const waferMaps = data.edsData.waferMaps;
      
      // Analyze defect patterns from real data
      let edgeDefects = 0;
      let centerDefects = 0;
      let randomDefects = 0;
      
      waferMaps.forEach(wafer => {
        const map = wafer.coordinateMap;
        const rows = map.length;
        const cols = map[0]?.length || 0;
        
        // Simple pattern detection
        map.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell === 'X') {
              // Check if it's at edge
              if (y < 2 || y >= rows - 2 || x < 2 || x >= cols - 2) {
                edgeDefects++;
              } else if (Math.abs(y - rows/2) < 3 && Math.abs(x - cols/2) < 3) {
                centerDefects++;
              } else {
                randomDefects++;
              }
            }
          });
        });
      });
      
      const totalDefects = edgeDefects + centerDefects + randomDefects;
      
      if (totalDefects > 0) {
        return [
          { defect: "Edge Ring", count: edgeDefects, percentage: (edgeDefects / totalDefects) * 100 },
          { defect: "Center Fail", count: centerDefects, percentage: (centerDefects / totalDefects) * 100 },
          { defect: "Random", count: randomDefects, percentage: (randomDefects / totalDefects) * 100 }
        ].sort((a, b) => b.count - a.count);
      }
    }
    
    // Fallback to mock data
    return [
      { defect: "Edge Ring", count: 45, percentage: 38.2 },
      { defect: "Center Fail", count: 28, percentage: 23.7 },
      { defect: "Random", count: 22, percentage: 18.6 },
      { defect: "Cluster", count: 15, percentage: 12.7 },
      { defect: "Scratch", count: 8, percentage: 6.8 }
    ];
  }, [data]);

  const range = controlData.ucl - controlData.lcl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SPC Charts</CardTitle>
        <CardDescription>
          {controlData.isRealData ? 'Real EDS data' : 'Mock data'} - Statistical Process Control for yield monitoring and defect analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="control" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="control">Control Chart</TabsTrigger>
            <TabsTrigger value="pareto">Pareto Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="control" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Yield Control Chart</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="relative h-64">
                  {/* Control Lines */}
                  <div 
                    className="absolute w-full border-t-2 border-red-500 border-dashed"
                    style={{ top: `${Math.max(0, Math.min(100, (1 - (controlData.ucl - controlData.lcl) / range) * 100))}%` }}
                  >
                    <span className="text-xs text-red-600 ml-2">UCL: {controlData.ucl.toFixed(1)}%</span>
                  </div>
                  <div 
                    className="absolute w-full border-t-2 border-blue-500"
                    style={{ top: `${Math.max(0, Math.min(100, (1 - (controlData.target - controlData.lcl) / range) * 100))}%` }}
                  >
                    <span className="text-xs text-blue-600 ml-2">Target: {controlData.target.toFixed(1)}%</span>
                  </div>
                  <div 
                    className="absolute w-full border-t-2 border-red-500 border-dashed"
                    style={{ top: `${Math.max(0, Math.min(100, (1 - (controlData.lcl - controlData.lcl) / range) * 100))}%` }}
                  >
                    <span className="text-xs text-red-600 ml-2">LCL: {controlData.lcl.toFixed(1)}%</span>
                  </div>
                  
                  {/* Data Points */}
                  <div className="flex items-end justify-between h-full pt-8 pb-4">
                    {controlData.values.map((value, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center space-y-1"
                      >
                        <div
                          className="w-3 h-3 bg-blue-600 rounded-full relative"
                          style={{
                            marginBottom: `${Math.max(0, Math.min(200, ((value - controlData.lcl) / range) * 200))}px`
                          }}
                          title={`${controlData.isRealData ? 'Wafer' : 'Lot'} ${index + 1}: ${value.toFixed(1)}%`}
                        />
                        <span className="text-xs text-gray-500">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pareto" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Defect Pareto Analysis</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  {paretoData.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.defect}</span>
                        <span>{item.count} ({item.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">Key Insights:</div>
                    <div className="text-blue-700">
                      {paretoData.length > 0 && (
                        <>
                          • {paretoData[0].defect} failures account for {paretoData[0].percentage.toFixed(0)}% of total defects
                          <br />
                          • Top 3 defects represent {paretoData.slice(0, 3).reduce((sum, item) => sum + item.percentage, 0).toFixed(0)}% of all failures
                          <br />
                          • Focus on {paretoData[0].defect.toLowerCase()} process optimization
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
