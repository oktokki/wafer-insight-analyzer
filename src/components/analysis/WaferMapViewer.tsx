
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { WaferMapCanvas } from "./WaferMapCanvas";
import { useState } from "react";

interface WaferMapViewerProps {
  data?: any;
}

export const WaferMapViewer = ({ data }: WaferMapViewerProps) => {
  const [selectedWaferIndex, setSelectedWaferIndex] = useState(0);

  // Check if we have EDS data or Second Foundry data
  const hasEdsData = data?.edsData?.waferMaps?.length > 0;
  const hasSecondFoundryData = data?.secondFoundryData?.length > 0;
  
  const waferMaps = hasEdsData ? data.edsData.waferMaps : 
                   hasSecondFoundryData ? data.secondFoundryData : [];
  const selectedWafer = waferMaps[selectedWaferIndex];
  const dataType = hasEdsData ? 'eds' : hasSecondFoundryData ? 'second-foundry' : null;

  if (!hasEdsData && !hasSecondFoundryData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wafer Map Viewer</CardTitle>
          <CardDescription>Visual representation of die-level test results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Upload EDS map files or Second Foundry files to view wafer maps</p>
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
            <CardTitle>Wafer Map Viewer</CardTitle>
            <CardDescription>
              Interactive wafer map visualization from {dataType === 'eds' ? 'EDS' : 'Second Foundry'} data
            </CardDescription>
          </div>
          {waferMaps.length > 1 && (
            <Select value={selectedWaferIndex.toString()} onValueChange={(value) => setSelectedWaferIndex(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select wafer" />
              </SelectTrigger>
              <SelectContent>
                {waferMaps.map((wafer, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {dataType === 'eds' 
                      ? (wafer.header.waferId || `Wafer ${wafer.header.slotNo}`)
                      : wafer.header.waferId
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedWafer && (
          <div className="space-y-6">
            {/* Wafer Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Wafer ID</p>
                <p className="text-lg font-semibold">{selectedWafer.header.waferId}</p>
              </div>
              {dataType === 'eds' && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Slot No</p>
                  <p className="text-lg font-semibold">{selectedWafer.header.slotNo}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Yield</p>
                <p className="text-lg font-semibold">
                  {dataType === 'eds' 
                    ? `${selectedWafer.header.yield.toFixed(2)}%`
                    : `${selectedWafer.yieldPercentage.toFixed(2)}%`
                  }
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Dies</p>
                <p className="text-lg font-semibold">
                  {dataType === 'eds' 
                    ? selectedWafer.header.totalTestDie.toLocaleString()
                    : (selectedWafer.header.good + selectedWafer.header.fail).toLocaleString()
                  }
                </p>
              </div>
            </div>

            {/* Die Statistics */}
            <div className="flex flex-wrap gap-2">
              {dataType === 'eds' ? (
                <>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Pass: {selectedWafer.header.passDie.toLocaleString()}
                  </Badge>
                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                    Fail: {selectedWafer.header.failDie.toLocaleString()}
                  </Badge>
                  {Object.entries(selectedWafer.binCounts).map(([bin, count]) => (
                    <Badge key={bin} variant="outline">
                      {bin === '1' ? 'BIN1' : bin === 'X' ? 'FAIL' : bin === '.' ? 'NO DIE' : `BIN${bin}`}: {Number(count)}
                    </Badge>
                  ))}
                </>
              ) : (
                <>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Good: {selectedWafer.header.good.toLocaleString()}
                  </Badge>
                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                    Fail: {selectedWafer.header.fail.toLocaleString()}
                  </Badge>
                  {Object.entries(selectedWafer.binCounts).map(([bin, count]) => (
                    <Badge key={bin} variant="outline">
                      {bin === '1' ? 'GOOD' : bin === 'X' ? 'FAIL' : bin === '.' ? 'NO DIE' : bin}: {Number(count)}
                    </Badge>
                  ))}
                </>
              )}
            </div>

            {/* Wafer Map Canvas */}
            <div className="flex justify-center">
              <WaferMapCanvas waferData={selectedWafer} width={500} height={500} dataType={dataType} />
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Device</p>
                <p>{selectedWafer.header.device}</p>
              </div>
              {dataType === 'eds' && (
                <div>
                  <p className="font-medium text-gray-600">Lot Number</p>
                  <p>{selectedWafer.header.lotNo}</p>
                </div>
              )}
              {dataType === 'eds' && selectedWafer.header.waferSize && (
                <div>
                  <p className="font-medium text-gray-600">Wafer Size</p>
                  <p>{selectedWafer.header.waferSize}</p>
                </div>
              )}
              {dataType === 'eds' && selectedWafer.header.flatDir && (
                <div>
                  <p className="font-medium text-gray-600">Flat Direction</p>
                  <p>{selectedWafer.header.flatDir}</p>
                </div>
              )}
              {dataType === 'second-foundry' && (
                <div>
                  <p className="font-medium text-gray-600">Map Size</p>
                  <p>{selectedWafer.header.x} × {selectedWafer.header.y}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
