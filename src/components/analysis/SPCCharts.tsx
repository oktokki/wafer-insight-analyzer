
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SPCChartsProps {
  data?: any;
}

export const SPCCharts = ({ data }: SPCChartsProps) => {
  const controlData = {
    values: [87.2, 88.1, 86.9, 89.3, 87.5, 88.7, 85.2, 86.8, 88.9, 87.1, 89.2, 86.5],
    ucl: 92.0,
    lcl: 82.0,
    target: 87.0
  };

  const paretoData = [
    { defect: "Edge Ring", count: 45, percentage: 38.2 },
    { defect: "Center Fail", count: 28, percentage: 23.7 },
    { defect: "Random", count: 22, percentage: 18.6 },
    { defect: "Cluster", count: 15, percentage: 12.7 },
    { defect: "Scratch", count: 8, percentage: 6.8 }
  ];

  const maxValue = Math.max(...controlData.values);
  const minValue = Math.min(...controlData.values);
  const range = controlData.ucl - controlData.lcl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SPC Charts</CardTitle>
        <CardDescription>
          Statistical Process Control for yield monitoring and defect analysis
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
                    style={{ top: `${(1 - (controlData.ucl - controlData.lcl) / range) * 100}%` }}
                  >
                    <span className="text-xs text-red-600 ml-2">UCL: {controlData.ucl}%</span>
                  </div>
                  <div 
                    className="absolute w-full border-t-2 border-blue-500"
                    style={{ top: `${(1 - (controlData.target - controlData.lcl) / range) * 100}%` }}
                  >
                    <span className="text-xs text-blue-600 ml-2">Target: {controlData.target}%</span>
                  </div>
                  <div 
                    className="absolute w-full border-t-2 border-red-500 border-dashed"
                    style={{ top: `${(1 - (controlData.lcl - controlData.lcl) / range) * 100}%` }}
                  >
                    <span className="text-xs text-red-600 ml-2">LCL: {controlData.lcl}%</span>
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
                            marginBottom: `${((value - controlData.lcl) / range) * 200}px`
                          }}
                          title={`Lot ${index + 1}: ${value}%`}
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
                        <span>{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">Key Insights:</div>
                    <div className="text-blue-700">
                      • Edge Ring failures account for 38% of total defects
                      <br />
                      • Top 3 defects represent 80% of all failures
                      <br />
                      • Focus on edge process optimization
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
