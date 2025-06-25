import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WaferMapViewerProps {
  data?: any;
}

export const WaferMapViewer = ({ data }: WaferMapViewerProps) => {
  const waferMapData = useMemo(() => {
    // Check if we have real EDS data
    if (data?.edsData?.waferMaps?.length > 0) {
      const edsData = data.edsData;
      const firstWafer = edsData.waferMaps[0];
      
      // Convert EDS coordinate map to our display format
      const map: any[][] = [];
      const bins = { 1: 0, 2: 0, 3: 0, 4: 0 };
      
      firstWafer.coordinateMap.forEach((row, y) => {
        const mapRow: any[] = [];
        row.forEach((char, x) => {
          let bin = 0;
          if (char === '1') {
            bin = 1; // Pass
            bins[1]++;
          } else if (char === 'X') {
            bin = 2; // Fail
            bins[2]++;
          } else {
            bin = 0; // Empty/untested
          }
          
          mapRow.push({ bin, tested: bin > 0 });
        });
        map.push(mapRow);
      });
      
      const totalDies = bins[1] + bins[2];
      const yieldPercentage = totalDies > 0 ? (bins[1] / totalDies) * 100 : 0;
      
      return {
        id: firstWafer.header.waferId,
        size: Math.max(firstWafer.coordinateMap.length, firstWafer.coordinateMap[0]?.length || 0),
        map,
        bins,
        totalDies,
        yieldPercentage,
        isRealData: true,
        lotNo: firstWafer.header.lotNo,
        device: firstWafer.header.device
      };
    }
    
    // Fallback to mock data
    return generateMockWaferMap();
  }, [data]);

  const renderDie = (die: any, x: number, y: number) => {
    const getColor = () => {
      switch (die.bin) {
        case 1: return "#22c55e"; // Pass - Green
        case 2: return "#ef4444"; // Fail - Red
        case 3: return "#f59e0b"; // Marginal - Orange
        case 4: return "#6b7280"; // No Test - Gray
        default: return "#e5e7eb";
      }
    };

    return (
      <div
        key={`${x}-${y}`}
        className="w-3 h-3 border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
        style={{ backgroundColor: getColor() }}
        title={`Die (${x},${y}) - Bin ${die.bin}`}
      />
    );
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Wafer Map Viewer</CardTitle>
        <CardDescription>
          {waferMapData.isRealData ? 'Real EDS wafer map data' : 'Mock wafer map data'} - Interactive die-level test results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-800">
              Pass: {waferMapData.bins[1]} dies
            </Badge>
            <Badge className="bg-red-100 text-red-800">
              Fail: {waferMapData.bins[2]} dies
            </Badge>
            {waferMapData.bins[3] > 0 && (
              <Badge className="bg-orange-100 text-orange-800">
                Marginal: {waferMapData.bins[3]} dies
              </Badge>
            )}
            {waferMapData.bins[4] > 0 && (
              <Badge className="bg-gray-100 text-gray-800">
                No Test: {waferMapData.bins[4]} dies
              </Badge>
            )}
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50">
            <div 
              className="grid gap-0.5 mx-auto"
              style={{ 
                gridTemplateColumns: `repeat(${waferMapData.size}, 1fr)`,
                width: 'fit-content'
              }}
            >
              {waferMapData.map.map((row: any[], y: number) =>
                row.map((die, x) => renderDie(die, x, y))
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Wafer ID:</span> {waferMapData.id}
            </div>
            <div>
              <span className="font-medium">Yield:</span> {waferMapData.yieldPercentage.toFixed(2)}%
            </div>
            <div>
              <span className="font-medium">Total Dies:</span> {waferMapData.totalDies}
            </div>
            <div>
              <span className="font-medium">Good Dies:</span> {waferMapData.bins[1]}
            </div>
            {waferMapData.device && (
              <div>
                <span className="font-medium">Device:</span> {waferMapData.device}
              </div>
            )}
            {waferMapData.lotNo && (
              <div>
                <span className="font-medium">Lot:</span> {waferMapData.lotNo}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function generateMockWaferMap() {
  const size = 20;
  const center = size / 2;
  const radius = size / 2.2;
  const map: any[][] = [];
  const bins = { 1: 0, 2: 0, 3: 0, 4: 0 };
  
  for (let y = 0; y < size; y++) {
    const row: any[] = [];
    for (let x = 0; x < size; x++) {
      const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      
      if (distance > radius) {
        row.push({ bin: 0, tested: false });
        continue;
      }
      
      // Edge effect simulation
      const edgeDistance = radius - distance;
      let bin = 1; // Default pass
      
      if (edgeDistance < 2) {
        // Edge dies more likely to fail
        bin = Math.random() < 0.4 ? 2 : (Math.random() < 0.7 ? 3 : 1);
      } else if (Math.random() < 0.05) {
        // Random fails
        bin = 2;
      } else if (Math.random() < 0.02) {
        // Marginal
        bin = 3;
      }
      
      bins[bin as keyof typeof bins]++;
      row.push({ bin, tested: true });
    }
    map.push(row);
  }
  
  const totalDies = bins[1] + bins[2] + bins[3] + bins[4];
  const yieldPercentage = (bins[1] / totalDies) * 100;
  
  return {
    id: "W001_LOT_240624",
    size,
    map,
    bins,
    totalDies,
    yieldPercentage
  };
}
