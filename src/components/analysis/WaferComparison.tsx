import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WaferMapCanvas } from "./WaferMapCanvas";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from "recharts";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from "lucide-react";

interface WaferComparisonProps {
  data?: any;
}

interface ComparisonMetric {
  metric: string;
  wafer1: number;
  wafer2: number;
  difference: number;
  percentChange: number;
  status: 'better' | 'worse' | 'similar';
}

export const WaferComparison = ({ data }: WaferComparisonProps) => {
  const [wafer1Index, setWafer1Index] = useState(0);
  const [wafer2Index, setWafer2Index] = useState(1);
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay' | 'difference'>('side-by-side');

  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  const hasSecondFoundryData = data?.secondFoundryData?.length > 0;
  
  const waferMaps = hasEdsData ? data.edsData.waferMaps : 
                   hasSecondFoundryData ? data.secondFoundryData : [];
  const dataType = hasEdsData ? 'eds' : hasSecondFoundryData ? 'second-foundry' : null;

  if (waferMaps.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wafer-to-Wafer Comparison</CardTitle>
          <CardDescription>Compare multiple wafers for yield and defect analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">
              Need at least 2 wafers to perform comparison analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const wafer1 = waferMaps[wafer1Index];
  const wafer2 = waferMaps[wafer2Index];

  // Calculate comprehensive comparison metrics
  const calculateMetrics = (): ComparisonMetric[] => {
    const getYield = (wafer: any) => dataType === 'eds' ? wafer.header.yield : wafer.yieldPercentage;
    const getPassDie = (wafer: any) => dataType === 'eds' ? wafer.header.passDie : wafer.header.good;
    const getFailDie = (wafer: any) => dataType === 'eds' ? wafer.header.failDie : wafer.header.fail;
    const getTotalDie = (wafer: any) => dataType === 'eds' ? wafer.header.totalTestDie : wafer.header.good + wafer.header.fail;

    const metrics = [
      {
        metric: 'Yield (%)',
        wafer1: getYield(wafer1),
        wafer2: getYield(wafer2)
      },
      {
        metric: 'Pass Dies',
        wafer1: getPassDie(wafer1),
        wafer2: getPassDie(wafer2)
      },
      {
        metric: 'Fail Dies',
        wafer1: getFailDie(wafer1),
        wafer2: getFailDie(wafer2)
      },
      {
        metric: 'Total Dies',
        wafer1: getTotalDie(wafer1),
        wafer2: getTotalDie(wafer2)
      },
      {
        metric: 'Defect Rate (%)',
        wafer1: (getFailDie(wafer1) / getTotalDie(wafer1)) * 100,
        wafer2: (getFailDie(wafer2) / getTotalDie(wafer2)) * 100
      }
    ];

    return metrics.map(m => {
      const difference = m.wafer2 - m.wafer1;
      const percentChange = m.wafer1 !== 0 ? (difference / m.wafer1) * 100 : 0;
      
      let status: 'better' | 'worse' | 'similar' = 'similar';
      if (m.metric.includes('Yield') || m.metric.includes('Pass')) {
        status = difference > 0 ? 'better' : difference < 0 ? 'worse' : 'similar';
      } else if (m.metric.includes('Fail') || m.metric.includes('Defect')) {
        status = difference < 0 ? 'better' : difference > 0 ? 'worse' : 'similar';
      }

      return {
        ...m,
        difference,
        percentChange,
        status
      };
    });
  };

  const comparisonMetrics = calculateMetrics();

  // Spatial difference analysis
  const calculateSpatialDifference = () => {
    if (!wafer1.coordinateMap || !wafer2.coordinateMap) return [];

    const rows = Math.min(wafer1.coordinateMap.length, wafer2.coordinateMap.length);
    const differences = [];

    for (let row = 0; row < rows; row++) {
      const cols = Math.min(
        wafer1.coordinateMap[row]?.length || 0,
        wafer2.coordinateMap[row]?.length || 0
      );
      
      for (let col = 0; col < cols; col++) {
        const cell1 = wafer1.coordinateMap[row][col];
        const cell2 = wafer2.coordinateMap[row][col];
        
        if (cell1 !== cell2) {
          let changeType = 'unknown';
          if (cell1 === '1' && cell2 === 'X') changeType = 'pass-to-fail';
          else if (cell1 === 'X' && cell2 === '1') changeType = 'fail-to-pass';
          else if (cell1 === '.' && cell2 !== '.') changeType = 'inactive-to-active';
          else if (cell1 !== '.' && cell2 === '.') changeType = 'active-to-inactive';
          
          differences.push({
            x: col,
            y: row,
            from: cell1,
            to: cell2,
            changeType
          });
        }
      }
    }

    return differences;
  };

  const spatialDifferences = calculateSpatialDifference();

  const getMetricIcon = (status: string) => {
    switch (status) {
      case 'better': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'worse': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'better': return 'text-green-600';
      case 'worse': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getOverallAssessment = () => {
    const betterCount = comparisonMetrics.filter(m => m.status === 'better').length;
    const worseCount = comparisonMetrics.filter(m => m.status === 'worse').length;
    
    if (betterCount > worseCount) return 'improved';
    if (worseCount > betterCount) return 'declined';
    return 'similar';
  };

  const chartData = comparisonMetrics.map(metric => ({
    metric: metric.metric,
    wafer1: metric.wafer1,
    wafer2: metric.wafer2,
    difference: metric.difference
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Advanced Wafer Comparison</CardTitle>
            <CardDescription>
              Comprehensive analysis comparing wafer performance metrics
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="side-by-side">Side by Side</SelectItem>
                <SelectItem value="overlay">Overlay</SelectItem>
                <SelectItem value="difference">Difference Map</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Wafer Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Wafer 1 (Baseline)</label>
              <Select value={wafer1Index.toString()} onValueChange={(value) => setWafer1Index(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {waferMaps.map((wafer, index) => (
                    <SelectItem key={index} value={index.toString()} disabled={index === wafer2Index}>
                      {dataType === 'eds' 
                        ? (wafer.header.waferId || `W${wafer.header.slotNo}`)
                        : wafer.header.waferId
                      } - {dataType === 'eds' ? wafer.header.yield.toFixed(1) : wafer.yieldPercentage.toFixed(1)}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Wafer 2 (Comparison)</label>
              <Select value={wafer2Index.toString()} onValueChange={(value) => setWafer2Index(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {waferMaps.map((wafer, index) => (
                    <SelectItem key={index} value={index.toString()} disabled={index === wafer1Index}>
                      {dataType === 'eds' 
                        ? (wafer.header.waferId || `W${wafer.header.slotNo}`)
                        : wafer.header.waferId
                      } - {dataType === 'eds' ? wafer.header.yield.toFixed(1) : wafer.yieldPercentage.toFixed(1)}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overall Assessment */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Overall Assessment</h4>
                <p className="text-sm text-gray-600">
                  Wafer 2 compared to Wafer 1
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getOverallAssessment() === 'improved' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Badge className="bg-green-100 text-green-800">Improved</Badge>
                  </>
                ) : getOverallAssessment() === 'declined' ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <Badge className="bg-red-100 text-red-800">Declined</Badge>
                  </>
                ) : (
                  <>
                    <Minus className="h-5 w-5 text-gray-600" />
                    <Badge className="bg-gray-100 text-gray-800">Similar</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparisonMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            {metric.wafer1.toFixed(metric.metric.includes('%') ? 1 : 0)}
                          </span>
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {metric.wafer2.toFixed(metric.metric.includes('%') ? 1 : 0)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          {getMetricIcon(metric.status)}
                          <span className={`text-sm font-medium ${getMetricColor(metric.status)}`}>
                            {metric.difference > 0 ? '+' : ''}{metric.difference.toFixed(metric.metric.includes('%') ? 1 : 0)}
                          </span>
                        </div>
                        <span className={`text-xs ${getMetricColor(metric.status)}`}>
                          {Math.abs(metric.percentChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metrics Comparison Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="wafer1" fill="#3b82f6" name="Wafer 1" />
                    <Bar dataKey="wafer2" fill="#10b981" name="Wafer 2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Visual Comparison */}
          {comparisonMode === 'side-by-side' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="text-center">
                <h4 className="font-medium text-gray-700 mb-4">
                  Wafer 1: {dataType === 'eds' ? wafer1.header.waferId : wafer1.header.waferId}
                </h4>
                <WaferMapCanvas waferData={wafer1} width={300} height={300} dataType={dataType} />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-700 mb-4">
                  Wafer 2: {dataType === 'eds' ? wafer2.header.waferId : wafer2.header.waferId}
                </h4>
                <WaferMapCanvas waferData={wafer2} width={300} height={300} dataType={dataType} />
              </div>
            </div>
          )}

          {/* Spatial Analysis */}
          {spatialDifferences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spatial Difference Analysis</CardTitle>
                <CardDescription>
                  {spatialDifferences.length} location(s) with different results between wafers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Pass → Fail</p>
                    <p className="text-lg font-bold text-red-600">
                      {spatialDifferences.filter(d => d.changeType === 'pass-to-fail').length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Fail → Pass</p>
                    <p className="text-lg font-bold text-green-600">
                      {spatialDifferences.filter(d => d.changeType === 'fail-to-pass').length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Activated</p>
                    <p className="text-lg font-bold text-blue-600">
                      {spatialDifferences.filter(d => d.changeType === 'inactive-to-active').length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800">Deactivated</p>
                    <p className="text-lg font-bold text-gray-600">
                      {spatialDifferences.filter(d => d.changeType === 'active-to-inactive').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};