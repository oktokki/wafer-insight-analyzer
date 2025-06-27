
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Target, Zap } from "lucide-react";

interface YieldDashboardProps {
  data?: any;
}

export const YieldDashboard = ({ data }: YieldDashboardProps) => {
  // Check if we have real EDS data
  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  
  let yieldData, binData, trendData, kpiData;
  
  if (hasEdsData) {
    const waferMaps = data.edsData.waferMaps;
    
    // Generate yield data by wafer
    yieldData = waferMaps.map((wafer, index) => ({
      wafer: `W${wafer.header.slotNo}`,
      yield: wafer.header.yield,
      passDies: wafer.header.passDie,
      totalDies: wafer.header.totalTestDie
    }));
    
    // Generate bin distribution data
    const totalBins = { '1': 0, 'X': 0, '.': 0 };
    waferMaps.forEach(wafer => {
      Object.entries(wafer.binCounts).forEach(([bin, count]) => {
        if (totalBins[bin] !== undefined) {
          totalBins[bin] += Number(count);
        }
      });
    });
    
    binData = [
      { name: 'Pass (BIN1)', value: totalBins['1'], color: '#22c55e' },
      { name: 'Fail', value: totalBins['X'], color: '#ef4444' },
      { name: 'No Die', value: totalBins['.'], color: '#94a3b8' }
    ];
    
    // Generate trend data
    trendData = waferMaps.map((wafer, index) => ({
      wafer: wafer.header.slotNo,
      yield: wafer.header.yield,
      cumulative: waferMaps.slice(0, index + 1).reduce((sum, w) => sum + w.header.yield, 0) / (index + 1)
    }));
    
    // Calculate KPIs
    const avgYield = waferMaps.reduce((sum, w) => sum + w.header.yield, 0) / waferMaps.length;
    const totalDies = waferMaps.reduce((sum, w) => sum + w.header.totalTestDie, 0);
    const totalPass = waferMaps.reduce((sum, w) => sum + w.header.passDie, 0);
    
    kpiData = {
      avgYield,
      totalWafers: waferMaps.length,
      totalDies,
      totalPass
    };
  } else {
    // Mock data for demo
    yieldData = [
      { wafer: "W1", yield: 85.2, passDies: 1420, totalDies: 1668 },
      { wafer: "W2", yield: 87.1, passDies: 1453, totalDies: 1668 },
      { wafer: "W3", yield: 83.7, passDies: 1395, totalDies: 1668 },
      { wafer: "W4", yield: 89.3, passDies: 1489, totalDies: 1668 },
      { wafer: "W5", yield: 86.8, passDies: 1447, totalDies: 1668 }
    ];
    
    binData = [
      { name: "Pass (BIN1)", value: 7204, color: "#22c55e" },
      { name: "Fail", value: 1136, color: "#ef4444" },
      { name: "No Die", value: 200, color: "#94a3b8" }
    ];
    
    trendData = [
      { wafer: 1, yield: 85.2, cumulative: 85.2 },
      { wafer: 2, yield: 87.1, cumulative: 86.1 },
      { wafer: 3, yield: 83.7, cumulative: 85.3 },
      { wafer: 4, yield: 89.3, cumulative: 86.3 },
      { wafer: 5, yield: 86.8, cumulative: 86.4 }
    ];
    
    kpiData = {
      avgYield: 86.4,
      totalWafers: 5,
      totalDies: 8340,
      totalPass: 7204
    };
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Average Yield</p>
                <p className="text-2xl font-bold text-blue-600">{kpiData.avgYield.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Wafers</p>
                <p className="text-2xl font-bold text-green-600">{kpiData.totalWafers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dies</p>
                <p className="text-2xl font-bold text-purple-600">{kpiData.totalDies.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Dies</p>
                <p className="text-2xl font-bold text-orange-600">{kpiData.totalPass.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wafer Yield Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Wafer Yield Distribution</CardTitle>
            <CardDescription>Yield percentage by wafer</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="wafer" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Yield']} />
                <Bar dataKey="yield" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bin Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Die Distribution</CardTitle>
            <CardDescription>Distribution of pass/fail dies</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={binData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {binData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Yield Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Yield Trend Analysis</CardTitle>
          <CardDescription>Individual and cumulative yield trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="wafer" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Yield']} />
              <Line 
                type="monotone" 
                dataKey="yield" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Individual Yield"
              />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Cumulative Average"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
