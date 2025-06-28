
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, HeatMapChart } from "recharts";
import { AlertTriangle, Search, TrendingDown, Zap, Target, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DefectPatternsProps {
  data?: any;
}

interface DefectPoint {
  x: number;
  y: number;
  wafer: number;
  type: string;
  severity?: number;
}

interface PatternAnalysis {
  pattern: string;
  count: number;
  percentage: string;
  confidence: number;
  description: string;
}

interface ClusterInfo {
  quadrant: string;
  defects: number;
  density: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export const DefectPatterns = ({ data }: DefectPatternsProps) => {
  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  
  let spatialData: DefectPoint[], defectSummary, patternAnalysis: PatternAnalysis[], clusterData: ClusterInfo[];
  let heatmapData, defectDensity, totalDefects = 0;
  
  if (hasEdsData) {
    const waferMaps = data.edsData.waferMaps;
    
    // Enhanced spatial defect analysis
    spatialData = [];
    const waferSize = { rows: 0, cols: 0 };
    
    waferMaps.forEach((wafer, waferIndex) => {
      if (wafer.coordinateMap && wafer.coordinateMap.length > 0) {
        waferSize.rows = Math.max(waferSize.rows, wafer.coordinateMap.length);
        waferSize.cols = Math.max(waferSize.cols, wafer.coordinateMap[0]?.length || 0);
        
        wafer.coordinateMap.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (cell === 'X') {
              spatialData.push({
                x: colIndex,
                y: rowIndex,
                wafer: waferIndex + 1,
                type: 'Fail',
                severity: Math.random() * 100 // Mock severity score
              });
              totalDefects++;
            }
          });
        });
      }
    });
    
    // Generate defect summary with enhanced metrics
    defectSummary = waferMaps.map((wafer, index) => ({
      wafer: `W${wafer.header.slotNo}`,
      defects: wafer.header.failDie,
      defectRate: ((wafer.header.failDie / wafer.header.totalTestDie) * 100).toFixed(2),
      pattern: wafer.header.failDie > 100 ? 'High' : wafer.header.failDie > 50 ? 'Medium' : 'Low',
      density: (wafer.header.failDie / (waferSize.rows * waferSize.cols) * 100).toFixed(2)
    }));
    
    // Advanced pattern analysis with confidence scoring
    const edgeDefects = spatialData.filter(d => 
      d.x < 3 || d.x > waferSize.cols - 4 || d.y < 3 || d.y > waferSize.rows - 4
    ).length;
    
    const centerDefects = spatialData.filter(d => {
      const centerX = waferSize.cols / 2;
      const centerY = waferSize.rows / 2;
      const distance = Math.sqrt(Math.pow(d.x - centerX, 2) + Math.pow(d.y - centerY, 2));
      return distance < Math.min(waferSize.cols, waferSize.rows) * 0.2;
    }).length;
    
    const cornerDefects = spatialData.filter(d => 
      (d.x < 3 && d.y < 3) || 
      (d.x < 3 && d.y > waferSize.rows - 4) ||
      (d.x > waferSize.cols - 4 && d.y < 3) ||
      (d.x > waferSize.cols - 4 && d.y > waferSize.rows - 4)
    ).length;
    
    const randomDefects = totalDefects - edgeDefects - centerDefects - cornerDefects;
    
    patternAnalysis = [
      { 
        pattern: 'Edge Effects', 
        count: edgeDefects, 
        percentage: ((edgeDefects / totalDefects) * 100).toFixed(1),
        confidence: edgeDefects > totalDefects * 0.3 ? 95 : 70,
        description: 'Defects concentrated near wafer edges, possibly due to processing non-uniformity'
      },
      { 
        pattern: 'Center Clustering', 
        count: centerDefects, 
        percentage: ((centerDefects / totalDefects) * 100).toFixed(1),
        confidence: centerDefects > totalDefects * 0.2 ? 90 : 65,
        description: 'High defect density in wafer center, indicating equipment alignment issues'
      },
      { 
        pattern: 'Corner Concentration', 
        count: cornerDefects, 
        percentage: ((cornerDefects / totalDefects) * 100).toFixed(1),
        confidence: cornerDefects > totalDefects * 0.15 ? 85 : 60,
        description: 'Defects in wafer corners, suggesting handling or chuck-related issues'
      },
      { 
        pattern: 'Random Distribution', 
        count: randomDefects, 
        percentage: ((randomDefects / totalDefects) * 100).toFixed(1),
        confidence: randomDefects > totalDefects * 0.4 ? 80 : 50,
        description: 'Scattered defects with no clear spatial pattern'
      }
    ];
    
    // Enhanced cluster analysis with density and risk assessment
    const quadrantSize = { x: waferSize.cols / 2, y: waferSize.rows / 2 };
    clusterData = [
      { 
        quadrant: 'Top-Left', 
        defects: spatialData.filter(d => d.x < quadrantSize.x && d.y < quadrantSize.y).length,
        density: 0,
        riskLevel: 'Low' as const
      },
      { 
        quadrant: 'Top-Right', 
        defects: spatialData.filter(d => d.x >= quadrantSize.x && d.y < quadrantSize.y).length,
        density: 0,
        riskLevel: 'Low' as const
      },
      { 
        quadrant: 'Bottom-Left', 
        defects: spatialData.filter(d => d.x < quadrantSize.x && d.y >= quadrantSize.y).length,
        density: 0,
        riskLevel: 'Low' as const
      },
      { 
        quadrant: 'Bottom-Right', 
        defects: spatialData.filter(d => d.x >= quadrantSize.x && d.y >= quadrantSize.y).length,
        density: 0,
        riskLevel: 'Low' as const
      }
    ];
    
    // Calculate density and risk levels
    clusterData.forEach(cluster => {
      const area = quadrantSize.x * quadrantSize.y;
      cluster.density = (cluster.defects / area * 1000).toFixed(2) as any;
      cluster.riskLevel = cluster.defects > totalDefects * 0.3 ? 'High' : 
                         cluster.defects > totalDefects * 0.2 ? 'Medium' : 'Low';
    });
    
    // Generate heatmap data for density visualization
    const gridSize = 10;
    heatmapData = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const xRange = [i * waferSize.cols / gridSize, (i + 1) * waferSize.cols / gridSize];
        const yRange = [j * waferSize.rows / gridSize, (j + 1) * waferSize.rows / gridSize];
        
        const defectsInCell = spatialData.filter(d => 
          d.x >= xRange[0] && d.x < xRange[1] && 
          d.y >= yRange[0] && d.y < yRange[1]
        ).length;
        
        heatmapData.push({
          x: i,
          y: j,
          value: defectsInCell,
          density: (defectsInCell / ((xRange[1] - xRange[0]) * (yRange[1] - yRange[0])) * 100).toFixed(2)
        });
      }
    }
    
    defectDensity = (totalDefects / (waferSize.rows * waferSize.cols) * 100).toFixed(3);
    
  } else {
    // Mock data with enhanced metrics
    spatialData = Array.from({ length: 200 }, (_, i) => ({
      wafer: Math.floor(i / 40) + 1,
      x: Math.random() * 20,
      y: Math.random() * 20,
      type: Math.random() > 0.8 ? 'Fail' : 'Pass',
      severity: Math.random() * 100
    })).filter(d => d.type === 'Fail');
    
    totalDefects = spatialData.length;
    
    defectSummary = [
      { wafer: "W1", defects: 248, defectRate: "14.9", pattern: "High", density: "2.8" },
      { wafer: "W2", defects: 215, defectRate: "12.9", pattern: "Medium", density: "2.4" },
      { wafer: "W3", defects: 273, defectRate: "16.4", pattern: "High", density: "3.1" },
      { wafer: "W4", defects: 179, defectRate: "10.7", pattern: "Medium", density: "2.0" },
      { wafer: "W5", defects: 221, defectRate: "13.2", pattern: "Medium", density: "2.5" }
    ];
    
    patternAnalysis = [
      { pattern: 'Edge Effects', count: 45, percentage: '38.1', confidence: 92, description: 'Strong edge concentration pattern detected' },
      { pattern: 'Center Clustering', count: 28, percentage: '23.7', confidence: 85, description: 'Moderate center clustering observed' },
      { pattern: 'Corner Concentration', count: 18, percentage: '15.3', confidence: 78, description: 'Corner defects present but limited' },
      { pattern: 'Random Distribution', count: 27, percentage: '22.9', confidence: 65, description: 'Some random defects without clear pattern' }
    ];
    
    clusterData = [
      { quadrant: 'Top-Left', defects: 28, density: 2.8, riskLevel: 'Medium' as const },
      { quadrant: 'Top-Right', defects: 31, density: 3.1, riskLevel: 'High' as const },
      { quadrant: 'Bottom-Left', defects: 25, density: 2.5, riskLevel: 'Medium' as const },
      { quadrant: 'Bottom-Right', defects: 34, density: 3.4, riskLevel: 'High' as const }
    ];
    
    defectDensity = "2.7";
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Defects</p>
                <p className="text-2xl font-bold text-red-600">{totalDefects}</p>
                <p className="text-xs text-gray-500">Density: {defectDensity}%</p>
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
                <p className="text-xs text-gray-500">Detected patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Dominant Pattern</p>
                <p className="text-2xl font-bold text-orange-600">{patternAnalysis[0]?.percentage}%</p>
                <p className="text-xs text-gray-500">{patternAnalysis[0]?.pattern}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Max Cluster</p>
                <p className="text-2xl font-bold text-purple-600">{Math.max(...clusterData.map(c => c.defects))}</p>
                <p className="text-xs text-gray-500">Highest density zone</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Defect Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Defect Distribution by Wafer</CardTitle>
            <CardDescription>Defect count and density analysis per wafer</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={defectSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="wafer" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'defects' ? `${value} defects` : `${value}% density`,
                    name === 'defects' ? 'Defect Count' : 'Defect Density'
                  ]}
                />
                <Bar dataKey="defects">
                  {defectSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPatternColor(entry.pattern)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enhanced Spatial Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Spatial Defect Distribution</CardTitle>
            <CardDescription>Defect locations with severity mapping</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={spatialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" domain={[0, 20]} />
                <YAxis dataKey="y" domain={[0, 20]} />
                <Tooltip 
                  formatter={(value, name, props) => [
                    name === 'x' ? `X: ${value}` : `Y: ${value}`,
                    `Wafer ${props.payload.wafer}${props.payload.severity ? `, Severity: ${props.payload.severity.toFixed(1)}` : ''}`
                  ]}
                />
                <Scatter dataKey="x" fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Pattern Analysis with Confidence */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Pattern Analysis</CardTitle>
          <CardDescription>Detected defect patterns with confidence scoring and descriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patternAnalysis.map((pattern, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium">{pattern.pattern}</h4>
                      <p className="text-sm text-gray-600">{pattern.count} defects ({pattern.percentage}%)</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{pattern.percentage}%</Badge>
                    <Badge className={getConfidenceColor(pattern.confidence)}>
                      {pattern.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={pattern.confidence} className="mb-2" />
                  <p className="text-sm text-gray-600 italic">{pattern.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Quadrant Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Quadrant Risk Analysis</CardTitle>
          <CardDescription>Defect clustering by wafer regions with risk assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {clusterData.map((cluster, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{cluster.quadrant}</h4>
                  <Badge 
                    style={{ 
                      backgroundColor: getRiskColor(cluster.riskLevel) + '20',
                      color: getRiskColor(cluster.riskLevel)
                    }}
                  >
                    {cluster.riskLevel} Risk
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">{cluster.defects} defects</p>
                  <p className="text-xs text-gray-500">Density: {cluster.density}/k units²</p>
                </div>
              </div>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={clusterData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="quadrant" type="category" />
              <Tooltip formatter={(value, name) => [`${value} defects`, 'Count']} />
              <Bar dataKey="defects">
                {clusterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskLevel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Enhanced Wafer Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Wafer Analysis</CardTitle>
          <CardDescription>Comprehensive breakdown by individual wafer with density metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {defectSummary.map((wafer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">{wafer.wafer}</span>
                  <span className="text-sm text-gray-600">{wafer.defects} defects</span>
                  <span className="text-sm text-gray-600">{wafer.defectRate}% rate</span>
                  <span className="text-sm text-gray-500">{wafer.density}% density</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPatternBadge(wafer.pattern)}>
                    {wafer.pattern} Risk
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
