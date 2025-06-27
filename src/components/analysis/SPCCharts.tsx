
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter } from "recharts";
import { AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SPCChartsProps {
  data?: any;
}

export const SPCCharts = ({ data }: SPCChartsProps) => {
  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  
  let spcData, controlLimits, processCapability;
  
  if (hasEdsData) {
    const waferMaps = data.edsData.waferMaps;
    
    // Generate SPC data from wafer yields
    spcData = waferMaps.map((wafer, index) => ({
      sample: index + 1,
      waferId: wafer.header.waferId,
      yield: wafer.header.yield,
      passDies: wafer.header.passDie,
      totalDies: wafer.header.totalTestDie,
      defectRate: ((wafer.header.totalTestDie - wafer.header.passDie) / wafer.header.totalTestDie) * 1000000 // DPMO
    }));
    
    // Calculate control limits
    const yields = spcData.map(d => d.yield);
    const mean = yields.reduce((sum, val) => sum + val, 0) / yields.length;
    const stdDev = Math.sqrt(yields.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / yields.length);
    
    controlLimits = {
      mean,
      ucl: mean + (3 * stdDev), // Upper Control Limit
      lcl: Math.max(0, mean - (3 * stdDev)), // Lower Control Limit
      usl: 95, // Upper Spec Limit (example)
      lsl: 80  // Lower Spec Limit (example)
    };
    
    // Calculate process capability
    const cp = (controlLimits.usl - controlLimits.lsl) / (6 * stdDev);
    const cpk = Math.min(
      (controlLimits.usl - mean) / (3 * stdDev),
      (mean - controlLimits.lsl) / (3 * stdDev)
    );
    
    processCapability = { cp, cpk, stdDev };
  } else {
    // Mock SPC data
    spcData = Array.from({ length: 25 }, (_, i) => ({
      sample: i + 1,
      waferId: `W${i + 1}`,
      yield: 85 + Math.random() * 10 + Math.sin(i * 0.5) * 3,
      passDies: Math.floor(1400 + Math.random() * 200),
      totalDies: 1668,
      defectRate: Math.floor(Math.random() * 5000 + 1000)
    }));
    
    controlLimits = {
      mean: 87.5,
      ucl: 93.2,
      lcl: 81.8,
      usl: 95,
      lsl: 80
    };
    
    processCapability = {
      cp: 1.33,
      cpk: 1.12,
      stdDev: 2.1
    };
  }

  const getProcessStatus = (cpk: number) => {
    if (cpk >= 1.33) return { status: 'Excellent', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (cpk >= 1.0) return { status: 'Good', color: 'bg-blue-100 text-blue-800', icon: TrendingUp };
    return { status: 'Needs Improvement', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
  };

  const processStatus = getProcessStatus(processCapability.cpk);
  const StatusIcon = processStatus.icon;

  return (
    <div className="space-y-6">
      {/* Process Capability Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Process Capability (Cp)</p>
                <p className="text-2xl font-bold">{processCapability.cp.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Process Capability (Cpk)</p>
                <p className="text-2xl font-bold">{processCapability.cpk.toFixed(2)}</p>
              </div>
              <StatusIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Process Status</p>
                <Badge className={processStatus.color}>{processStatus.status}</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Std Dev</p>
                <p className="text-lg font-semibold">{processCapability.stdDev.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Yield Control Chart</CardTitle>
          <CardDescription>Statistical process control chart with control limits</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={spcData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sample" />
              <YAxis domain={[Math.max(0, controlLimits.lcl - 5), controlLimits.ucl + 5]} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}${name === 'yield' ? '%' : ''}`, 
                  name === 'yield' ? 'Yield' : 'DPMO'
                ]}
                labelFormatter={(label) => `Sample ${label}`}
              />
              
              {/* Control Limits */}
              <ReferenceLine y={controlLimits.ucl} stroke="#ef4444" strokeDasharray="5 5" label="UCL" />
              <ReferenceLine y={controlLimits.mean} stroke="#22c55e" strokeDasharray="5 5" label="Mean" />
              <ReferenceLine y={controlLimits.lcl} stroke="#ef4444" strokeDasharray="5 5" label="LCL" />
              
              {/* Spec Limits */}
              <ReferenceLine y={controlLimits.usl} stroke="#f59e0b" strokeDasharray="10 5" label="USL" />
              <ReferenceLine y={controlLimits.lsl} stroke="#f59e0b" strokeDasharray="10 5" label="LSL" />
              
              <Line 
                type="monotone" 
                dataKey="yield" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Defect Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Defect Rate Trend (DPMO)</CardTitle>
          <CardDescription>Defects per million opportunities over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={spcData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sample" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value}`, 'DPMO']}
                labelFormatter={(label) => `Sample ${label}`}
              />
              <Scatter dataKey="defectRate" fill="#ef4444" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Process Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Process Statistics Summary</CardTitle>
          <CardDescription>Key statistical measures and control parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Mean</p>
              <p className="text-lg font-semibold">{controlLimits.mean.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Standard Deviation</p>
              <p className="text-lg font-semibold">{processCapability.stdDev.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">UCL</p>
              <p className="text-lg font-semibold">{controlLimits.ucl.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">LCL</p>
              <p className="text-lg font-semibold">{controlLimits.lcl.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
