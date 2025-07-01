
import React, { useEffect, useRef } from 'react';
import { WaferMapData } from '@/utils/edsMapParser';
import { SecondFoundryMapData } from '@/utils/secondFoundryParser';

interface WaferMapCanvasProps {
  waferData: WaferMapData | SecondFoundryMapData;
  width?: number;
  height?: number;
  dataType?: 'eds' | 'second-foundry';
}

export const WaferMapCanvas = ({ waferData, width = 400, height = 400, dataType = 'eds' }: WaferMapCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waferData.coordinateMap.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const rows = waferData.coordinateMap.length;
    const cols = waferData.coordinateMap[0]?.length || 0;
    
    if (rows === 0 || cols === 0) return;

    // Calculate cell size
    const cellWidth = (width - 20) / cols;
    const cellHeight = (height - 20) / rows;
    const cellSize = Math.min(cellWidth, cellHeight);

    // Center the map
    const startX = (width - cols * cellSize) / 2;
    const startY = (height - rows * cellSize) / 2;

    // Color mapping for different bins
    const getColor = (value: string) => {
      switch (value) {
        case '1': return '#22c55e'; // Green for pass/good
        case 'X': return '#ef4444'; // Red for fail
        case '.': return '#f3f4f6'; // Light gray for no die
        case 'T': return '#f59e0b'; // Amber for test dies
        default: return '#94a3b8'; // Gray for unknown
      }
    };

    // Draw the wafer map
    waferData.coordinateMap.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = startX + colIndex * cellSize;
        const y = startY + rowIndex * cellSize;

        ctx.fillStyle = getColor(cell);
        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);

        // Add border for better visibility
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
      });
    });

    // Draw wafer outline (circular)
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

  }, [waferData, width, height, dataType]);

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg"
      />
      <div className="flex justify-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>{dataType === 'eds' ? 'Pass (BIN1)' : 'Good'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Fail</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <span>No Die</span>
        </div>
        {dataType === 'second-foundry' && (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span>Test</span>
          </div>
        )}
      </div>
    </div>
  );
};
