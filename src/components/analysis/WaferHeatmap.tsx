import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Activity, Target, TrendingUp } from "lucide-react";

interface HeatmapProps {
  data?: any;
}

interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  type: 'defect' | 'yield' | 'density';
  color: string;
  intensity: number;
}

export const WaferHeatmap = ({ data }: HeatmapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [heatmapType, setHeatmapType] = React.useState<'defect' | 'yield' | 'density'>('defect');
  const [selectedWaferIndex, setSelectedWaferIndex] = React.useState(0);

  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  const hasSecondFoundryData = data?.secondFoundryData?.length > 0;
  
  const waferMaps = hasEdsData ? data.edsData.waferMaps : 
                   hasSecondFoundryData ? data.secondFoundryData : [];
  const selectedWafer = waferMaps[selectedWaferIndex];
  const dataType = hasEdsData ? 'eds' : hasSecondFoundryData ? 'second-foundry' : null;

  // Generate heatmap data based on selected type
  const generateHeatmapData = (): HeatmapCell[] => {
    if (!selectedWafer?.coordinateMap?.length) return [];

    const cells: HeatmapCell[] = [];
    const gridSize = 20; // Higher resolution grid
    const rows = selectedWafer.coordinateMap.length;
    const cols = selectedWafer.coordinateMap[0]?.length || 0;

    // Create high-resolution grid
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const xStart = Math.floor((i * cols) / gridSize);
        const xEnd = Math.floor(((i + 1) * cols) / gridSize);
        const yStart = Math.floor((j * rows) / gridSize);
        const yEnd = Math.floor(((j + 1) * rows) / gridSize);
        
        let value = 0;
        let totalCells = 0;
        let defectCount = 0;
        let passCount = 0;

        // Sample the region
        for (let x = xStart; x < xEnd && x < cols; x++) {
          for (let y = yStart; y < yEnd && y < rows; y++) {
            if (selectedWafer.coordinateMap[y] && selectedWafer.coordinateMap[y][x]) {
              const cellValue = selectedWafer.coordinateMap[y][x];
              totalCells++;
              
              if (cellValue === 'X') defectCount++;
              else if (cellValue === '1') passCount++;
            }
          }
        }

        if (totalCells > 0) {
          switch (heatmapType) {
            case 'defect':
              value = (defectCount / totalCells) * 100;
              break;
            case 'yield':
              value = (passCount / totalCells) * 100;
              break;
            case 'density':
              value = totalCells;
              break;
          }
        }

        const intensity = Math.min(1, value / (heatmapType === 'density' ? 100 : 100));
        const color = getHeatmapColor(heatmapType, intensity);

        cells.push({
          x: i,
          y: j,
          value,
          type: heatmapType,
          color,
          intensity
        });
      }
    }

    return cells;
  };

  const getHeatmapColor = (type: string, intensity: number): string => {
    const alpha = Math.max(0.1, intensity);
    
    switch (type) {
      case 'defect':
        return `rgba(239, 68, 68, ${alpha})`; // Red gradient
      case 'yield':
        return `rgba(34, 197, 94, ${alpha})`; // Green gradient
      case 'density':
        return `rgba(59, 130, 246, ${alpha})`; // Blue gradient
      default:
        return `rgba(156, 163, 175, ${alpha})`;
    }
  };

  const heatmapData = generateHeatmapData();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = Math.min(width, height) / 20;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw wafer outline
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.clip();

    // Draw heatmap cells
    heatmapData.forEach(cell => {
      const x = (cell.x * cellSize) + (width - 20 * cellSize) / 2;
      const y = (cell.y * cellSize) + (height - 20 * cellSize) / 2;
      
      ctx.fillStyle = cell.color;
      ctx.fillRect(x, y, cellSize, cellSize);
    });

    ctx.restore();

    // Draw wafer outline
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Add flat indicator
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY + radius - 5);
    ctx.lineTo(centerX + 10, centerY + radius - 5);
    ctx.stroke();

  }, [heatmapData, heatmapType]);

  const getMaxValue = () => {
    return Math.max(...heatmapData.map(cell => cell.value));
  };

  const getAvgValue = () => {
    const sum = heatmapData.reduce((acc, cell) => acc + cell.value, 0);
    return sum / heatmapData.length;
  };

  const getHotspots = () => {
    const threshold = getMaxValue() * 0.8;
    return heatmapData.filter(cell => cell.value >= threshold).length;
  };

  if (!hasEdsData && !hasSecondFoundryData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wafer Heatmap Analysis</CardTitle>
          <CardDescription>Advanced spatial analysis with density mapping</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Upload wafer map data to view heatmap analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Advanced Wafer Heatmap</CardTitle>
            <CardDescription>
              High-resolution spatial analysis with customizable metrics
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select value={heatmapType} onValueChange={(value: any) => setHeatmapType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defect">Defect Density</SelectItem>
                <SelectItem value="yield">Yield Map</SelectItem>
                <SelectItem value="density">Die Density</SelectItem>
              </SelectContent>
            </Select>
            {waferMaps.length > 1 && (
              <Select value={selectedWaferIndex.toString()} onValueChange={(value) => setSelectedWaferIndex(parseInt(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {waferMaps.map((wafer, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {dataType === 'eds' 
                        ? (wafer.header.waferId || `W${wafer.header.slotNo}`)
                        : wafer.header.waferId
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Heatmap Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Thermometer className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-gray-600">Max Value</span>
              </div>
              <p className="text-lg font-bold text-red-600">
                {getMaxValue().toFixed(1)}{heatmapType === 'density' ? '' : '%'}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Average</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {getAvgValue().toFixed(1)}{heatmapType === 'density' ? '' : '%'}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Hotspots</span>
              </div>
              <p className="text-lg font-bold text-orange-600">{getHotspots()}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Resolution</span>
              </div>
              <p className="text-lg font-bold text-green-600">20×20</p>
            </div>
          </div>

          {/* Heatmap Canvas */}
          <div className="flex justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="border border-gray-200 rounded-lg shadow-sm"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-white">
                  {heatmapType === 'defect' ? 'Defect %' : 
                   heatmapType === 'yield' ? 'Yield %' : 'Density'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Color Scale Legend */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Intensity Scale:</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">Low</span>
                <div className="w-20 h-3 rounded" 
                     style={{
                       background: `linear-gradient(to right, ${getHeatmapColor(heatmapType, 0.1)}, ${getHeatmapColor(heatmapType, 1.0)})`
                     }}>
                </div>
                <span className="text-xs text-gray-500">High</span>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Spatial Analysis Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• {heatmapType === 'defect' ? 'Defect concentration' : 
                     heatmapType === 'yield' ? 'Yield distribution' : 'Die density'} 
                 analysis at 20×20 resolution</p>
              <p>• {getHotspots()} high-intensity regions detected above 80% threshold</p>
              <p>• Average {heatmapType} value: {getAvgValue().toFixed(1)}
                 {heatmapType === 'density' ? ' dies/region' : '%'}</p>
              {heatmapType === 'defect' && getMaxValue() > 50 && (
                <p className="text-red-700">⚠ High defect concentration detected in some regions</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};