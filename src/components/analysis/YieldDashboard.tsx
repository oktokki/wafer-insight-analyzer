
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart } from "recharts";
import { TrendingUp, TrendingDown, Target, Zap, AlertTriangle, CheckCircle, Activity, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface YieldDashboardProps {
  data?: any;
}

interface YieldMetrics {
  avgYield: number;
  totalWafers: number;
  totalDies: number;
  totalPass: number;
  yieldStability: string;
  trendDirection: string;
  processCapability: number;
  defectRate: number;
}

interface YieldTrend {
  wafer: number;
  yield: number;
  cumulative: number;
  target: number;
  upperLimit: number;
  lowerLimit: number;
}

export const YieldDashboard = ({ data }: YieldDashboardProps) => {
  // Check if we have real EDS data
  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  
  let yieldData, binData, trendData: YieldTrend[], kpiData: YieldMetrics;
  let performanceData, yieldDistribution, timeSeriesData;
  
  if (hasEdsData) {
    const waferMaps = data.edsData.waferMaps;
    
    // Generate enhanced yield data with performance metrics
    yieldData = waferMaps.map((wafer, index) => ({
      wafer: `W${wafer.header.slotNo}`,
      waferId: wafer.header.waferId,
      yield: wafer.header.yield,
      passDies: wafer.header.passDie,
      totalDies: wafer.header.totalTestDie,
      defectRate: ((wafer.header.totalTestDie - wafer.header.passDie) / wafer.header.totalTestDie * 100).toFixed(2),
      efficiency: (wafer.header.passDie / wafer.header.totalTestDie * 100).toFixed(1),
      performanceGrade: wafer.header.yield >= 90 ? 'Excellent' : wafer.header.yield >= 80 ? 'Good' : 'Needs Improvement'
    }));
    
    // Enhanced bin distribution with additional categories
    const totalBins = { '1': 0, 'X': 0, '.': 0, 'R': 0 };
    waferMaps.forEach(wafer => {
      Object.entries(wafer.binCounts).forEach(([bin, count]) => {
        if (totalBins[bin] !== undefined) {
          totalBins[bin] += Number(count);
        }
      });
    });
    
    binData = [
      { name: 'Pass (BIN1)', value: totalBins['1'], color: '#22c55e', percentage: ((totalBins['1'] / (totalBins['1'] + totalBins['X'] + totalBins['.'])) * 100).toFixed(1) },
      { name: 'Hard Fail', value: totalBins['X'], color: '#ef4444', percentage: ((totalBins['X'] / (totalBins['1'] + totalBins['X'] + totalBins['.'])) * 100).toFixed(1) },
      { name: 'No Die', value: totalBins['.'], color: '#94a3b8', percentage: ((totalBins['.'] / (totalBins['1'] + totalBins['X'] + totalBins['.'])) * 100).toFixed(1) },
      { name: 'Retest', value: totalBins['R'] || 0, color: '#f59e0b', percentage: '0.0' }
    ];
    
    // Advanced trend analysis with control limits
    const yields = waferMaps.map(w => w.header.yield);
    const avgYield = yields.reduce((sum, y) => sum + y, 0) / yields.length;
    const stdDev = Math.sqrt(yields.reduce((sum, y) => sum + Math.pow(y - avgYield, 2), 0) / yields.length);
    
    trendData = waferMaps.map((wafer, index) => ({
      wafer: wafer.header.slotNo,
      yield: wafer.header.yield,
      cumulative: waferMaps.slice(0, index + 1).reduce((sum, w) => sum + w.header.yield, 0) / (index + 1),
      target: 85, // Target yield
      upperLimit: avgYield + (2 * stdDev),
      lowerLimit: Math.max(0, avgYield - (2 * stdDev))
    }));
    
    // Performance distribution analysis
    performanceData = [
      { grade: 'Excellent (≥90%)', count: yieldData.filter(w => w.yield >= 90).length, color: '#22c55e' },
      { grade: 'Good (80-89%)', count: yieldData.filter(w => w.yield >= 80 && w.yield < 90).length, color: '#3b82f6' },
      { grade: 'Fair (70-79%)', count: yieldData.filter(w => w.yield >= 70 && w.yield < 80).length, color: '#f59e0b' },
      { grade: 'Poor (<70%)', count: yieldData.filter(w => w.yield < 70).length, color: '#ef4444' }
    ];
    
    // Yield distribution histogram
    const yieldRanges = [
      { range: '60-65%', count: 0, min: 60, max: 65 },
      { range: '65-70%', count: 0, min: 65, max: 70 },
      { range: '70-75%', count: 0, min: 70, max: 75 },
      { range: '75-80%', count: 0, min: 75, max: 80 },
      { range: '80-85%', count: 0, min: 80, max: 85 },
      { range: '85-90%', count: 0, min: 85, max: 90 },
      { range: '90-95%', count: 0, min: 90, max: 95 },
      { range: '95-100%', count: 0, min: 95, max: 100 }
    ];
    
    yields.forEach(yield => {
      const range = yieldRanges.find(r => yield >= r.min && yield < r.max);
      if (range) range.count++;
    });
    
    yieldDistribution = yieldRanges.filter(r => r.count > 0);
    
    // Calculate enhanced KPIs
    const totalDies = waferMaps.reduce((sum, w) => sum + w.header.totalTestDie, 0);
    const totalPass = waferMaps.reduce((sum, w) => sum + w.header.passDie, 0);
    const yieldVariation = (stdDev / avgYield * 100).toFixed(1);
    const trendDirection = yields[yields.length - 1] > yields[0] ? 'Improving' : 'Declining';
    
    kpiData = {
      avgYield,
      totalWafers: waferMaps.length,
      totalDies,
      totalPass,
      yieldStability: parseFloat(yieldVariation) < 5 ? 'Stable' : 'Variable',
      trendDirection,
      processCapability: (avgYield / 85).toFixed(2) as any, // Capability vs target
      defectRate: ((totalDies - totalPass) / totalDies * 1000000).toFixed(0) as any // DPMO
    };
    
    // Time series data for advanced analytics
    timeSeriesData = waferMaps.map((wafer, index) => ({
      sequence: index + 1,
      yield: wafer.header.yield,
      movingAverage: index >= 2 ? 
        waferMaps.slice(Math.max(0, index - 2), index + 1)
          .reduce((sum, w) => sum + w.header.yield, 0) / Math.min(3, index + 1) : wafer.header.yield,
      trend: index > 0 ? wafer.header.yield - waferMaps[index - 1].header.yield : 0
    }));
    
  } else {
    // Enhanced mock data with realistic patterns
    yieldData = [
      { wafer: "W1", waferId: "WF001", yield: 85.2, passDies: 1420, totalDies: 1668, defectRate: "14.9", efficiency: "85.2", performanceGrade: "Good" },
      { wafer: "W2", waferId: "WF002", yield: 87.1, passDies: 1453, totalDies: 1668, defectRate: "12.9", efficiency: "87.1", performanceGrade: "Good" },
      { wafer: "W3", waferId: "WF003", yield: 83.7, passDies: 1395, totalDies: 1668, defectRate: "16.4", efficiency: "83.7", performanceGrade: "Good" },
      { wafer: "W4", waferId: "WF004", yield: 89.3, passDies: 1489, totalDies: 1668, defectRate: "10.7", efficiency: "89.3", performanceGrade: "Good" },
      { wafer: "W5", waferId: "WF005", yield: 91.2, passDies: 1521, totalDies: 1668, defectRate: "8.8", efficiency: "91.2", performanceGrade: "Excellent" }
    ];
    
    binData = [
      { name: "Pass (BIN1)", value: 7278, color: "#22c55e", percentage: "87.3" },
      { name: "Hard Fail", value: 1062, color: "#ef4444", percentage: "12.7" },
      { name: "No Die", value: 0, color: "#94a3b8", percentage: "0.0" },
      { name: "Retest", value: 0, color: "#f59e0b", percentage: "0.0" }
    ];
    
    trendData = [
      { wafer: 1, yield: 85.2, cumulative: 85.2, target: 85, upperLimit: 92, lowerLimit: 78 },
      { wafer: 2, yield: 87.1, cumulative: 86.1, target: 85, upperLimit: 92, lowerLimit: 78 },
      { wafer: 3, yield: 83.7, cumulative: 85.3, target: 85, upperLimit: 92, lowerLimit: 78 },
      { wafer: 4, yield: 89.3, cumulative: 86.3, target: 85, upperLimit: 92, lowerLimit: 78 },
      { wafer: 5, yield: 91.2, cumulative: 87.3, target: 85, upperLimit: 92, lowerLimit: 78 }
    ];
    
    performanceData = [
      { grade: 'Excellent (≥90%)', count: 1, color: '#22c55e' },
      { grade: 'Good (80-89%)', count: 4, color: '#3b82f6' },
      { grade: 'Fair (70-79%)', count: 0, color: '#f59e0b' },
      { grade: 'Poor (<70%)', count: 0, color: '#ef4444' }
    ];
    
    yieldDistribution = [
      { range: '80-85%', count: 2 },
      { range: '85-90%', count: 2 },
      { range: '90-95%', count: 1 }
    ];
    
    timeSeriesData = [
      { sequence: 1, yield: 85.2, movingAverage: 85.2, trend: 0 },
      { sequence: 2, yield: 87.1, movingAverage: 86.1, trend: 1.9 },
      { sequence: 3, yield: 83.7, movingAverage: 85.3, trend: -3.4 },
      { sequence: 4, yield: 89.3, movingAverage: 86.7, trend: 5.6 },
      { sequence: 5, yield: 91.2, movingAverage: 88.1, trend: 1.9 }
    ];
    
    kpiData = {
      avgYield: 87.3,
      totalWafers: 5,
      totalDies: 8340,
      totalPass: 7278,
      yieldStability: 'Stable',
      trendDirection: 'Improving',
      processCapability: 1.03,
      defectRate: 127300
    };
  }

  const getPerformanceColor = (grade: string) => {
    if (grade === 'Excellent') return 'bg-green-100 text-green-800';
    if (grade === 'Good') return 'bg-blue-100 text-blue-800';
    if (grade === 'Fair') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStabilityIcon = (stability: string) => {
    return stability === 'Stable' ? CheckCircle : AlertTriangle;
  };

  const StabilityIcon = getStabilityIcon(kpiData.yieldStability);

  return (
    <div className="space-y-6">
      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Yield</p>
                <p className="text-2xl font-bold text-blue-600">{kpiData.avgYield.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Target: 85%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Process Status</p>
                <Badge className={kpiData.yieldStability === 'Stable' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {kpiData.yieldStability}
                </Badge>
                <p className="text-xs text-gray-500">{kpiData.trendDirection}</p>
              </div>
              <StabilityIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Defect Rate</p>
                <p className="text-2xl font-bold text-red-600">{parseInt(kpiData.defectRate as any).toLocaleString()}</p>
                <p className="text-xs text-gray-500">DPMO</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Capability</p>
                <p className="text-2xl font-bold text-purple-600">{kpiData.processCapability}</p>
                <p className="text-xs text-gray-500">vs Target</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Wafer Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Wafer Performance Analysis</CardTitle>
            <CardDescription>Individual wafer yields with performance grading</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="wafer" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'yield' ? `${value}%` : value,
                    name === 'yield' ? 'Yield' : 'Target'
                  ]}
                />
                <Bar dataKey="yield" fill="#3b82f6" />
                <Line type="monotone" dataKey={() => 85} stroke="#ef4444" strokeDasharray="5 5" name="Target" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Grade Distribution</CardTitle>
            <CardDescription>Wafer count by performance category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="grade" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count">
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Statistical Process Control</CardTitle>
          <CardDescription>Yield trends with control limits and moving averages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="wafer" />
              <YAxis domain={[70, 100]} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Value']} />
              
              {/* Control limits */}
              <Line type="monotone" dataKey="upperLimit" stroke="#ef4444" strokeDasharray="5 5" name="Upper Limit" />
              <Line type="monotone" dataKey="lowerLimit" stroke="#ef4444" strokeDasharray="5 5" name="Lower Limit" />
              <Line type="monotone" dataKey="target" stroke="#22c55e" strokeDasharray="8 8" name="Target" />
              
              {/* Actual data */}
              <Line type="monotone" dataKey="yield" stroke="#3b82f6" strokeWidth={3} name="Individual Yield" />
              <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} name="Cumulative Average" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Bin Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Die Classification Distribution</CardTitle>
            <CardDescription>Detailed breakdown of die categories with percentages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={binData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {binData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${Number(value).toLocaleString()} dies`, name]} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 gap-2">
                {binData.map((bin, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bin.color }}></div>
                    <span className="text-sm font-medium">{bin.name}</span>
                    <span className="text-xs text-gray-600">{bin.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yield Distribution Histogram */}
        <Card>
          <CardHeader>
            <CardTitle>Yield Distribution Analysis</CardTitle>
            <CardDescription>Frequency distribution of wafer yields</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yieldDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} wafers`, 'Count']} />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Wafer Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Wafer Analysis</CardTitle>
          <CardDescription>Individual wafer performance metrics and grading</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {yieldData.map((wafer, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">{wafer.wafer}</span>
                  <span className="text-sm text-gray-600">{wafer.waferId}</span>
                  <span className="text-sm font-medium">{wafer.yield}% yield</span>
                  <span className="text-xs text-gray-500">{wafer.defectRate}% defect rate</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getPerformanceColor(wafer.performanceGrade)}>
                    {wafer.performanceGrade}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">{wafer.passDies.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">pass dies</p>
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
