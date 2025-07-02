import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, BarChart, Bar, ScatterChart, Scatter } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, TrendingUp, BarChart3, Activity, Bell, Target, Zap } from "lucide-react";

interface AdvancedSPCProps {
  data?: any;
}

interface ControlRule {
  name: string;
  description: string;
  violations: number[];
  severity: 'high' | 'medium' | 'low';
}

interface ProcessCapabilityExtended {
  cp: number;
  cpk: number;
  cpu: number;
  cpl: number;
  pp: number;
  ppk: number;
  ppu: number;
  ppl: number;
  sigma: number;
  actualStdDev: number;
  sigmaLevel: number;
  dpmo: number;
}

export const AdvancedSPC = ({ data }: AdvancedSPCProps) => {
  const [chartType, setChartType] = useState<'xbar-r' | 'i-mr' | 'xbar-s' | 'p-chart' | 'c-chart'>('i-mr');
  const [controlLimitsType, setControlLimitsType] = useState<'calculated' | 'specification'>('calculated');
  const [showViolations, setShowViolations] = useState(true);

  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  
  let spcData, controlLimits, processCapability: ProcessCapabilityExtended, controlRules: ControlRule[];
  let movingRangeData, subgroupData, trendsData;
  
  if (hasEdsData) {
    const waferMaps = data.edsData.waferMaps;
    
    // Generate comprehensive SPC data
    spcData = waferMaps.map((wafer: any, index: number) => ({
      sample: index + 1,
      waferId: wafer.header.waferId,
      yield: wafer.header.yield,
      passDies: wafer.header.passDie,
      totalDies: wafer.header.totalTestDie,
      defectRate: ((wafer.header.totalTestDie - wafer.header.passDie) / wafer.header.totalTestDie) * 100,
      dpmo: ((wafer.header.totalTestDie - wafer.header.passDie) / wafer.header.totalTestDie) * 1000000,
      timestamp: new Date(Date.now() - (waferMaps.length - index) * 86400000) // Mock timestamps
    }));
    
    // Advanced control limits calculation
    const yields = spcData.map((d: any) => d.yield);
    const n = yields.length;
    const mean = yields.reduce((sum: number, val: number) => sum + val, 0) / n;
    
    // Calculate moving ranges for I-MR chart
    const movingRanges = yields.slice(1).map((val: number, i: number) => Math.abs(val - yields[i]));
    const averageMovingRange = movingRanges.reduce((sum: number, val: number) => sum + val, 0) / movingRanges.length;
    
    // Constants for different chart types
    const constants = {
      d2: 1.128, // for n=1 (individual charts)
      D3: 0,     // for moving range LCL
      D4: 3.267, // for moving range UCL
      A2: 2.659  // for Xbar charts with n=2
    };
    
    const sigma = averageMovingRange / constants.d2;
    const actualStdDev = Math.sqrt(yields.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / (n - 1));
    
    controlLimits = {
      mean,
      ucl: mean + (3 * sigma),
      lcl: Math.max(0, mean - (3 * sigma)),
      usl: 95, // Upper Spec Limit
      lsl: 80, // Lower Spec Limit
      sigma,
      actualStdDev,
      // Moving Range limits
      mRmean: averageMovingRange,
      mRucl: constants.D4 * averageMovingRange,
      mRlcl: constants.D3 * averageMovingRange
    };
    
    // Enhanced process capability with Six Sigma calculations
    const cp = (controlLimits.usl - controlLimits.lsl) / (6 * actualStdDev);
    const cpu = (controlLimits.usl - mean) / (3 * actualStdDev);
    const cpl = (mean - controlLimits.lsl) / (3 * actualStdDev);
    const cpk = Math.min(cpu, cpl);
    
    // Performance indices (using actual std dev)
    const pp = (controlLimits.usl - controlLimits.lsl) / (6 * actualStdDev);
    const ppu = (controlLimits.usl - mean) / (3 * actualStdDev);
    const ppl = (mean - controlLimits.lsl) / (3 * actualStdDev);
    const ppk = Math.min(ppu, ppl);
    
    // Six Sigma level calculation
    const sigmaLevel = Math.min(6, cpk * 3);
    const dpmo = Math.max(1, Math.round(1000000 * (1 - cpk / 2))); // Simplified DPMO calculation
    
    processCapability = { 
      cp, cpk, cpu, cpl, pp, ppk, ppu, ppl, 
      sigma, actualStdDev, sigmaLevel, dpmo 
    };
    
    // Advanced control rules (Western Electric Rules)
    controlRules = [
      {
        name: 'Rule 1: Beyond Control Limits',
        description: 'Points beyond 3-sigma control limits',
        violations: spcData.map((point: any, i: number) => 
          point.yield > controlLimits.ucl || point.yield < controlLimits.lcl ? i : -1
        ).filter((i: number) => i >= 0),
        severity: 'high' as const
      },
      {
        name: 'Rule 2: 9 Points Same Side',
        description: 'Nine consecutive points on same side of centerline',
        violations: [],
        severity: 'medium' as const
      },
      {
        name: 'Rule 3: 6 Points Trending',
        description: 'Six consecutive points steadily increasing or decreasing',
        violations: [],
        severity: 'medium' as const
      },
      {
        name: 'Rule 4: 14 Points Alternating',
        description: 'Fourteen consecutive points alternating up and down',
        violations: [],
        severity: 'low' as const
      },
      {
        name: 'Rule 5: 2 of 3 Beyond 2-Sigma',
        description: 'Two out of three consecutive points beyond 2-sigma',
        violations: [],
        severity: 'medium' as const
      },
      {
        name: 'Rule 6: 4 of 5 Beyond 1-Sigma',
        description: 'Four out of five consecutive points beyond 1-sigma',
        violations: [],
        severity: 'low' as const
      }
    ];
    
    // Implement rule detection algorithms
    const twoSigmaUpper = mean + (2 * sigma);
    const twoSigmaLower = mean - (2 * sigma);
    const oneSigmaUpper = mean + sigma;
    const oneSigmaLower = mean - sigma;
    
    // Rule 2: 9 consecutive points same side
    let consecutiveSameSide = 0;
    let lastSide = null;
    for (let i = 0; i < yields.length; i++) {
      const currentSide = yields[i] > mean ? 'above' : 'below';
      if (currentSide === lastSide) {
        consecutiveSameSide++;
        if (consecutiveSameSide >= 8) { // 9 points including current
          controlRules[1].violations.push(i);
        }
      } else {
        consecutiveSameSide = 0;
      }
      lastSide = currentSide;
    }
    
    // Rule 3: 6 consecutive trending points
    let trendCount = 0;
    let trendDirection = null;
    for (let i = 1; i < yields.length; i++) {
      const currentDirection = yields[i] > yields[i-1] ? 'up' : 'down';
      if (currentDirection === trendDirection) {
        trendCount++;
        if (trendCount >= 5) { // 6 points including current
          controlRules[2].violations.push(i);
        }
      } else {
        trendCount = 0;
      }
      trendDirection = currentDirection;
    }
    
    // Rule 5: 2 of 3 beyond 2-sigma
    for (let i = 2; i < yields.length; i++) {
      const last3 = yields.slice(i-2, i+1);
      const beyond2Sigma = last3.filter(val => val > twoSigmaUpper || val < twoSigmaLower).length;
      if (beyond2Sigma >= 2) {
        controlRules[4].violations.push(i);
      }
    }
    
    // Generate moving range data
    movingRangeData = movingRanges.map((range, index) => ({
      sample: index + 2,
      movingRange: range,
      yield1: yields[index],
      yield2: yields[index + 1]
    }));
    
    // Generate subgroup data for Xbar-R charts
    const subgroupSize = 5;
    subgroupData = [];
    for (let i = 0; i < yields.length - subgroupSize + 1; i += subgroupSize) {
      const subgroup = yields.slice(i, i + subgroupSize);
      const subgroupMean = subgroup.reduce((sum, val) => sum + val, 0) / subgroupSize;
      const subgroupRange = Math.max(...subgroup) - Math.min(...subgroup);
      
      subgroupData.push({
        subgroup: Math.floor(i / subgroupSize) + 1,
        mean: subgroupMean,
        range: subgroupRange,
        samples: subgroup
      });
    }
    
  } else {
    // Mock advanced SPC data for demonstration
    const mockYields = [];
    const baseMean = 87.5;
    const baseSigma = 2.1;
    
    for (let i = 0; i < 30; i++) {
      let yieldValue = baseMean + (Math.random() - 0.5) * baseSigma * 2;
      
      // Add systematic patterns for demonstration
      if (i > 10 && i < 20) {
        yieldValue += (i - 15) * 0.3; // Trend
      }
      if (i > 20 && i < 25) {
        yieldValue += Math.sin(i) * 2; // Cycling
      }
      if (Math.random() < 0.05) {
        yieldValue += (Math.random() - 0.5) * baseSigma * 6; // Special cause
      }
      
      mockYields.push(Math.max(75, Math.min(95, yieldValue)));
    }
    
    spcData = mockYields.map((yieldValue, i) => ({
      sample: i + 1,
      waferId: `W${i + 1}`,
      yield: yieldValue,
      passDies: Math.floor(1400 + Math.random() * 200),
      totalDies: 1668,
      defectRate: (100 - yieldValue),
      dpmo: Math.floor(((100 - yieldValue) / 100) * 1000000),
      timestamp: new Date(Date.now() - (30 - i) * 86400000)
    }));
    
    controlLimits = {
      mean: baseMean,
      ucl: baseMean + (3 * baseSigma),
      lcl: Math.max(0, baseMean - (3 * baseSigma)),
      usl: 95,
      lsl: 80,
      sigma: baseSigma,
      actualStdDev: 2.3,
      mRmean: 2.4,
      mRucl: 7.8,
      mRlcl: 0
    };
    
    processCapability = {
      cp: 1.19, cpk: 1.08, cpu: 1.25, cpl: 0.92,
      pp: 1.15, ppk: 1.02, ppu: 1.18, ppl: 0.87,
      sigma: baseSigma, actualStdDev: 2.3, sigmaLevel: 3.24, dpmo: 66810
    };
    
    controlRules = [
      { name: 'Rule 1: Beyond Control Limits', description: 'Points beyond control limits', violations: [15, 23], severity: 'high' as const },
      { name: 'Rule 2: 9 Points Same Side', description: 'Nine consecutive points same side', violations: [18], severity: 'medium' as const },
      { name: 'Rule 3: 6 Points Trending', description: 'Six consecutive trending points', violations: [16], severity: 'medium' as const },
      { name: 'Rule 4: 14 Points Alternating', description: 'Fourteen alternating points', violations: [], severity: 'low' as const },
      { name: 'Rule 5: 2 of 3 Beyond 2-Sigma', description: 'Two of three beyond 2-sigma', violations: [14, 17], severity: 'medium' as const },
      { name: 'Rule 6: 4 of 5 Beyond 1-Sigma', description: 'Four of five beyond 1-sigma', violations: [], severity: 'low' as const }
    ];
    
    movingRangeData = spcData.slice(1).map((point, i) => ({
      sample: i + 2,
      movingRange: Math.abs(point.yield - spcData[i].yield),
      yield1: spcData[i].yield,
      yield2: point.yield
    }));
    
    subgroupData = [];
    for (let i = 0; i < 25; i += 5) {
      const subgroup = mockYields.slice(i, i + 5);
      subgroupData.push({
        subgroup: Math.floor(i / 5) + 1,
        mean: subgroup.reduce((sum, val) => sum + val, 0) / 5,
        range: Math.max(...subgroup) - Math.min(...subgroup),
        samples: subgroup
      });
    }
  }

  const totalViolations = controlRules.reduce((sum, rule) => sum + rule.violations.length, 0);
  
  const getSigmaLevelColor = (level: number) => {
    if (level >= 6) return 'text-green-600';
    if (level >= 4) return 'text-blue-600';
    if (level >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSigmaLevelBadge = (level: number) => {
    if (level >= 6) return 'bg-green-100 text-green-800';
    if (level >= 4) return 'bg-blue-100 text-blue-800';
    if (level >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const chartConfig = {
    yield: { label: "Yield %", color: "hsl(var(--chart-1))" },
    movingRange: { label: "Moving Range", color: "hsl(var(--chart-2))" },
    mean: { label: "Subgroup Mean", color: "hsl(var(--chart-3))" },
    range: { label: "Subgroup Range", color: "hsl(var(--chart-4))" }
  };

  return (
    <div className="space-y-6">
      {/* Advanced Process Capability Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sigma Level</p>
                <p className={`text-xl font-bold ${getSigmaLevelColor(processCapability.sigmaLevel)}`}>
                  {processCapability.sigmaLevel.toFixed(2)}σ
                </p>
              </div>
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">DPMO</p>
                <p className="text-xl font-bold text-red-600">
                  {processCapability.dpmo.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cpk</p>
                <p className="text-xl font-bold text-green-600">
                  {processCapability.cpk.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ppk</p>
                <p className="text-xl font-bold text-purple-600">
                  {processCapability.ppk.toFixed(2)}
                </p>
              </div>
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Violations</p>
                <p className="text-xl font-bold text-orange-600">
                  {totalViolations}
                </p>
              </div>
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chart Type</p>
                <Badge className={getSigmaLevelBadge(processCapability.sigmaLevel)}>
                  {chartType.toUpperCase()}
                </Badge>
              </div>
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="i-mr">Individual & MR</SelectItem>
              <SelectItem value="xbar-r">X-bar & R</SelectItem>
              <SelectItem value="xbar-s">X-bar & S</SelectItem>
              <SelectItem value="p-chart">P Chart</SelectItem>
              <SelectItem value="c-chart">C Chart</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={controlLimitsType} onValueChange={(value: any) => setControlLimitsType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calculated">Calculated</SelectItem>
              <SelectItem value="specification">Spec Limits</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant={showViolations ? "default" : "outline"}
          size="sm"
          onClick={() => setShowViolations(!showViolations)}
        >
          {showViolations ? "Hide" : "Show"} Violations
        </Button>
      </div>

      {/* Main Control Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {chartType === 'i-mr' ? 'Individual & Moving Range Chart' :
             chartType === 'xbar-r' ? 'X-bar & R Chart' :
             chartType === 'xbar-s' ? 'X-bar & S Chart' :
             chartType === 'p-chart' ? 'P Chart (Proportion)' : 'C Chart (Count)'}
          </CardTitle>
          <CardDescription>
            Statistical process control with advanced rule detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Chart */}
            <div>
              <h4 className="font-medium mb-4">
                {chartType === 'i-mr' ? 'Individual Values' : 
                 chartType.includes('xbar') ? 'Subgroup Means' : 'Process Metric'}
              </h4>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartType.includes('xbar') ? subgroupData : spcData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey={chartType.includes('xbar') ? "subgroup" : "sample"}
                      label={{ value: chartType.includes('xbar') ? 'Subgroup' : 'Sample', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      domain={[controlLimits.lcl - 2, controlLimits.ucl + 2]}
                      label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    
                    {/* Control Limits */}
                    <ReferenceLine y={controlLimits.ucl} stroke="#ef4444" strokeDasharray="5 5" label="UCL" />
                    <ReferenceLine y={controlLimits.mean} stroke="#22c55e" strokeDasharray="8 8" label="Mean" />
                    <ReferenceLine y={controlLimits.lcl} stroke="#ef4444" strokeDasharray="5 5" label="LCL" />
                    
                    {/* Specification Limits */}
                    {controlLimitsType === 'specification' && (
                      <>
                        <ReferenceLine y={controlLimits.usl} stroke="#f59e0b" strokeDasharray="10 5" label="USL" />
                        <ReferenceLine y={controlLimits.lsl} stroke="#f59e0b" strokeDasharray="10 5" label="LSL" />
                      </>
                    )}
                    
                    <Line 
                      type="monotone" 
                      dataKey={chartType.includes('xbar') ? "mean" : "yield"}
                      stroke="var(--color-yield)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--color-yield)', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Secondary Chart (Range or Moving Range) */}
            <div>
              <h4 className="font-medium mb-4">
                {chartType === 'i-mr' ? 'Moving Range' :
                 chartType === 'xbar-r' ? 'Range' :
                 chartType === 'xbar-s' ? 'Standard Deviation' : 'Secondary Metric'}
              </h4>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartType === 'i-mr' ? movingRangeData : subgroupData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chartType === 'i-mr' ? "sample" : "subgroup"} />
                    <YAxis domain={[0, controlLimits.mRucl + 1]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    
                    <ReferenceLine y={controlLimits.mRucl} stroke="#ef4444" strokeDasharray="5 5" label="UCL" />
                    <ReferenceLine y={controlLimits.mRmean} stroke="#22c55e" strokeDasharray="8 8" label="Mean" />
                    <ReferenceLine y={controlLimits.mRlcl} stroke="#ef4444" strokeDasharray="5 5" label="LCL" />
                    
                    <Line 
                      type="monotone" 
                      dataKey={chartType === 'i-mr' ? "movingRange" : "range"}
                      stroke="var(--color-movingRange)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--color-movingRange)', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Rules Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Control Rules Analysis (Western Electric Rules)</CardTitle>
          <CardDescription>Automated detection of special cause variation patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {controlRules.map((rule, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                rule.violations.length > 0 ? 
                  rule.severity === 'high' ? 'bg-red-50 border-red-200' :
                  rule.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-orange-50 border-orange-200'
                : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{rule.name}</h4>
                  {rule.violations.length > 0 ? (
                    <Badge variant="destructive">{rule.violations.length}</Badge>
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-2">{rule.description}</p>
                {rule.violations.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium">Violations at samples: </span>
                    {rule.violations.slice(0, 5).map(v => v + 1).join(', ')}
                    {rule.violations.length > 5 && '...'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Process Capability Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Process Capability Analysis</CardTitle>
            <CardDescription>Comprehensive capability and performance indices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800">Cp = {processCapability.cp.toFixed(3)}</p>
                  <p className="text-xs text-blue-600">Process Potential</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-semibold text-green-800">Cpk = {processCapability.cpk.toFixed(3)}</p>
                  <p className="text-xs text-green-600">Process Performance</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-semibold text-purple-800">Pp = {processCapability.pp.toFixed(3)}</p>
                  <p className="text-xs text-purple-600">Overall Potential</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm font-semibold text-orange-800">Ppk = {processCapability.ppk.toFixed(3)}</p>
                  <p className="text-xs text-orange-600">Overall Performance</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-800">CPU = {processCapability.cpu.toFixed(3)}</p>
                  <p className="text-xs text-gray-600">Upper Capability</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-800">CPL = {processCapability.cpl.toFixed(3)}</p>
                  <p className="text-xs text-gray-600">Lower Capability</p>
                </div>
              </div>
              
              <div className="p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-800">Six Sigma Level</span>
                  <Badge className={getSigmaLevelBadge(processCapability.sigmaLevel)}>
                    {processCapability.sigmaLevel.toFixed(2)}σ
                  </Badge>
                </div>
                <p className="text-xs text-indigo-600 mt-1">
                  DPMO: {processCapability.dpmo.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Process Performance Trends</CardTitle>
            <CardDescription>Capability trends over time (last 10 samples)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spcData.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sample" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="yield" fill="var(--color-yield)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};