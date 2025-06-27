
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from "recharts";
import { AlertTriangle, Search, TrendingDown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DefectPatternsProps {
  data?: any;
}

export const DefectPatterns = ({ data }: DefectPatternsProps) => {
  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  
  let spatialData, defectSummary, patternAnalysis, clusterData;
  
  if (hasEdsData) {
    const waferMaps = data.edsData.waferMaps;
    
    // Analyze spatial defect patterns
    spatialData = [];
    let totalDefects = 0;
    
    waferMaps.forEach((wafer, waferIndex) => {
      if (wafer.coordinateMap && wafer.coordinateMap.length > 0) {
        wafer.coordinateMap.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (cell === 'X') { // Failed die
              spatialData.push({
                wafer: waferIndex + 1,
                x: colIndex,
                y: rowIndex,
                type: 'Fail'
              });
              totalDefects++;
            }
          });
        });
      }
    });
    
    // Generate defect summary by wafer
    defectSummary = waferMaps.map((wafer, index) => ({
      wafer: `W${wafer.header.slotNo}`,
      defects: wafer.header.failDie,
      defectRate: ((wafer.header.failDie / wafer.header.totalTestDie) * 100).toFixed(2),
      pattern: wafer.header.failDie > 100 ? 'High' : wafer.header.failDie > 50 ? 'Medium' : 'Low'
    }));
    
    // Pattern analysis
    const edgeDefects = spatialData.filter(d => 
      d.x < 3 || d.x > 15 || d.y < 3 || d.y > 15
    ).length;
    
    const centerDefects = spatialData.filter(d => 
      d.x >= 7 && d.x <= 11 && d.y >= 7 && d.y <= 11
    ).length;
    
    patternAnalysis = [
      { pattern: 'Edge Effects', count: edgeDefects, percentage: ((edgeDefects / totalDefects) * 100).toFixed(1) },
      { pattern: 'Center Clustering', count: centerDefects, percentage: ((centerDefects / totalDefects) * 100).toFixed(1) },
      { pattern: 'Random Distribution', count: totalDefects - edgeDefects - centerDefects, percentage: (((totalDefects - edgeDefects - centerDefects) / totalDefects) * 100).toFixed(1) }
    ];
    
    // Cluster analysis by quadrant
    clusterData = [
      { quadrant: 'Top-Left', defects: spatialData.filter(d => d.x < 9 && d.y < 9).length },
      { quadrant: 'Top-Right', defects: spatialData.filter(d => d.x >= 9 && d.y < 9).length },
      { quadrant: 'Bottom-Left', defects: spatialData.filter(d => d.x < 9 && d.y >= 9).length },
      { quadrant: 'Bottom-Right', defects: spatialData.filter(d => d.x >= 9 && d.y >= 9).length }
    ];
  } else {
    // Mock data
    spatialData = Array.from({ length: 200 }, (_, i) => ({
      wafer: Math.floor(i / 40) + 1,
      x: Math.random() * 20,
      y: Math.random() * 20,
      type: Math.random() > 0.8 ? 'Fail' : 'Pass'
    })).filter(d => d.type === 'Fail');
    
    defectSummary = [
      { wafer: "W1", defects: 248, defectRate: "14.9", pattern: "High" },
      { wafer: "W2", defects: 215, defectRate: "12.9", pattern: "Medium" },
      { wafer: "W3", defects: 273, defectRate: "16.4", pattern: "High" },
      { wafer: "W4", defects: 179, defectRate: "10.7", pattern: "Medium" },
      { wafer: "W5", defects: 221, defectRate: "13.2", pattern: "Medium" }
    ];
    
    patternAnalysis = [
      { pattern: 'Edge Effects', count: 45, percentage: '38.1' },
      { pattern: 'Center Clustering', count: 28, percentage: '23.7' },
      { pattern: 'Random Distribution', count: 45, percentage: '38.2' }
    ];
    
    clusterData = [
      { quadrant: 'Top-Left', defects: 28 },
      { quadrant: 'Top-Right', defects: 31 },
      { quadrant: 'Bottom-Left', defects: 25 },
      { quadrant: 'Bottom-Right', defects: 34 }
    ];
  }

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  const getPatternBadge = (pattern: string) => {
    switch (pattern) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Defects</p>
                <p className="text-2xl font-bold text-red-600">{spatialData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Search className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pattern Types</p>
                <p className="text-2xl font-bold text-blue-600">{patternAnalysis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Edge Effects</p>
                <p className="text-2xl font-bold text-orange-600">{patternAnalysis[0]?.percentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Hot Spots</p>
                <p className="text-2xl font-bold text-purple-600">{Math.max(...clusterData.map(c => c.defects))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defect Distribution by Wafer */}
        <Card>
          <CardHeader>
            <CardTitle>Defect Distribution by Wafer</CardTitle>
            <CardDescription>Number of defects per wafer</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={defectSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="wafer" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="defects">
                  {defectSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPatternColor(entry.pattern)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spatial Defect Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Spatial Defect Distribution</CardTitle>
            <CardDescription>Defect locations across wafer surface</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={spatialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" domain={[0, 20]} />
                <YAxis dataKey="y" domain={[0, 20]} />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={() => 'Defect Location'}
                />
                <Scatter dataKey="x" fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Defect Pattern Analysis</CardTitle>
          <CardDescription>Classification of defect patterns and their distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patternAnalysis.map((pattern, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div>
                    <h4 className="font-medium">{pattern.pattern}</h4>
                    <p className="text-sm text-gray-600">{pattern.count} defects</p>
                  </div>
                </div>
                <Badge variant="outline">{pattern.percentage}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quadrant Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Quadrant Defect Analysis</CardTitle>
          <CardDescription>Defect clustering by wafer quadrants</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={clusterData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="quadrant" type="category" />
              <Tooltip />
              <Bar dataKey="defects" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Wafer Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wafer Defect Summary</CardTitle>
          <CardDescription>Detailed breakdown by individual wafer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {defectSummary.map((wafer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">{wafer.wafer}</span>
                  <span className="text-sm text-gray-600">{wafer.defects} defects</span>
                  <span className="text-sm text-gray-600">{wafer.defectRate}% rate</span>
                </div>
                <Badge className={getPatternBadge(wafer.pattern)}>
                  {wafer.pattern} Risk
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
