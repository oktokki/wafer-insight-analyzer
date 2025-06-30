
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, LineChart, Line } from 'recharts';
import { Layers, TrendingUp, Map, BarChart3 } from "lucide-react";

interface AdvancedVisualizationsProps {
  data?: any;
}

export const AdvancedVisualizations = ({ data }: AdvancedVisualizationsProps) => {
  const [visualizationType, setVisualizationType] = useState<'heatmap' | 'trend' | 'correlation' | '3d-surface'>('heatmap');
  const [selectedWaferIndex, setSelectedWaferIndex] = useState(0);

  const hasData = data?.edsData?.waferMaps?.length > 0;
  const waferMaps = hasData ? data.edsData.waferMaps : [];
  const selectedWafer = waferMaps[selectedWaferIndex];

  // Generate mock data for advanced visualizations
  const generateHeatmapData = () => {
    if (!selectedWafer) return [];
    
    const data = [];
    const gridSize = 20;
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const distance = Math.sqrt(Math.pow(x - gridSize/2, 2) + Math.pow(y - gridSize/2, 2));
        const baseYield = 85;
        const edgeEffect = Math.max(0, (distance - 8) * -2);
        const randomVariation = (Math.random() - 0.5) * 10;
        
        data.push({
          x,
          y,
          yield: Math.max(0, Math.min(100, baseYield + edgeEffect + randomVariation))
        });
      }
    }
    
    return data;
  };

  const generateTrendData = () => {
    if (!hasData) return [];
    
    return waferMaps.map((wafer: any, index: number) => ({
      waferIndex: index + 1,
      yield: wafer.header.yield,
      passDie: wafer.header.passDie,
      failDie: wafer.header.failDie,
      efficiency: (wafer.header.passDie / wafer.header.totalTestDie) * 100
    }));
  };

  const generateCorrelationData = () => {
    if (!hasData) return [];
    
    return waferMaps.map((wafer: any) => ({
      yield: wafer.header.yield,
      totalDie: wafer.header.totalTestDie,
      passDie: wafer.header.passDie,
      name: wafer.header.waferId
    }));
  };

  const renderHeatmap = () => {
    const heatmapData = generateHeatmapData();
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Yield Heatmap</h4>
          <Badge variant="outline">{selectedWafer?.header.waferId}</Badge>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={heatmapData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" domain={[0, 20]} />
            <YAxis dataKey="y" type="number" domain={[0, 20]} />
            <Tooltip 
              formatter={(value, name) => [`${Number(value).toFixed(1)}%`, 'Yield']}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `Position: (${payload[0].payload.x}, ${payload[0].payload.y})`;
                }
                return '';
              }}
            />
            <Scatter dataKey="yield">
              {heatmapData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`hsl(${entry.yield * 1.2}, 70%, 60%)`}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        
        <div className="flex items-center justify-between text-sm">
          <span>Low Yield</span>
          <div className="flex space-x-1">
            {[0, 20, 40, 60, 80, 100].map((value) => (
              <div
                key={value}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: `hsl(${value * 1.2}, 70%, 60%)` }}
              />
            ))}
          </div>
          <span>High Yield</span>
        </div>
      </div>
    );
  };

  const renderTrendAnalysis = () => {
    const trendData = generateTrendData();
    
    return (
      <div className="space-y-4">
        <h4 className="font-medium">Yield Trend Analysis</h4>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="waferIndex" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="yield" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="efficiency" 
              stroke="#82ca9d" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Yield (%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Efficiency (%)</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCorrelationMatrix = () => {
    const correlationData = generateCorrelationData();
    
    return (
      <div className="space-y-4">
        <h4 className="font-medium">Yield vs Total Die Correlation</h4>
        
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={correlationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="totalDie" type="number" />
            <YAxis dataKey="yield" type="number" />
            <Tooltip 
              formatter={(value, name, props) => [
                name === 'yield' ? `${Number(value).toFixed(1)}%` : Number(value).toLocaleString(),
                name === 'yield' ? 'Yield' : 'Total Die'
              ]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `Wafer: ${payload[0].payload.name}`;
                }
                return '';
              }}
            />
            <Scatter dataKey="yield" fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const render3DSurface = () => {
    return (
      <div className="space-y-4">
        <h4 className="font-medium">3D Surface Visualization</h4>
        <div className="h-400 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">3D Surface visualization</p>
            <p className="text-sm text-gray-500 mt-2">Interactive 3D wafer surface would be rendered here</p>
          </div>
        </div>
      </div>
    );
  };

  const renderVisualization = () => {
    switch (visualizationType) {
      case 'heatmap':
        return renderHeatmap();
      case 'trend':
        return renderTrendAnalysis();
      case 'correlation':
        return renderCorrelationMatrix();
      case '3d-surface':
        return render3DSurface();
      default:
        return renderHeatmap();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Advanced Visualizations</span>
        </CardTitle>
        <CardDescription>
          Interactive and enhanced data visualization tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Visualization Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Visualization Type</label>
              <Select value={visualizationType} onValueChange={(value: any) => setVisualizationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heatmap">Yield Heatmap</SelectItem>
                  <SelectItem value="trend">Trend Analysis</SelectItem>
                  <SelectItem value="correlation">Correlation Matrix</SelectItem>
                  <SelectItem value="3d-surface">3D Surface</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {hasData && visualizationType === 'heatmap' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Wafer</label>
                <Select value={selectedWaferIndex.toString()} onValueChange={(value) => setSelectedWaferIndex(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {waferMaps.map((wafer: any, index: number) => (
                      <SelectItem key={index} value={index.toString()}>
                        {wafer.header.waferId || `Wafer ${wafer.header.slotNo}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Visualization Content */}
          {hasData ? (
            renderVisualization()
          ) : (
            <div className="text-center py-8">
              <Map className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Upload wafer data to enable advanced visualizations</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
