import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface DataFiltersProps {
  data?: any;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  searchTerm: string;
  yieldRange: { min: number; max: number };
  deviceFilter: string;
  lotFilter: string;
}

export const DataFilters = ({ data, onFilterChange }: DataFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    yieldRange: { min: 0, max: 100 },
    deviceFilter: 'all',
    lotFilter: 'all'
  });

  const hasData = data?.edsData?.waferMaps?.length > 0;
  
  // Extract unique values for filter options with proper typing
  const devices = hasData 
    ? Array.from(new Set(
        data.edsData.waferMaps
          .map((w: any) => w.header.device)
          .filter((device: any): device is string => typeof device === 'string')
      ))
    : [] as string[];
  
  const lots = hasData 
    ? Array.from(new Set(
        data.edsData.waferMaps
          .map((w: any) => w.header.lotNo)
          .filter((lot: any): lot is string => typeof lot === 'string')
      ))
    : [] as string[];

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      searchTerm: '',
      yieldRange: { min: 0, max: 100 },
      deviceFilter: 'all',
      lotFilter: 'all'
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFiltersCount = [
    filters.searchTerm,
    filters.deviceFilter !== 'all',
    filters.lotFilter !== 'all',
    filters.yieldRange.min > 0 || filters.yieldRange.max < 100
  ].filter(Boolean).length;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Data Filters</span>
          </CardTitle>
          <CardDescription>Filter and search wafer data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">Upload data to enable filtering</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Data Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount}</Badge>
              )}
            </CardTitle>
            <CardDescription>Filter and search wafer data</CardDescription>
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search wafer ID..."
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Device Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Device</label>
            <Select value={filters.deviceFilter} onValueChange={(value) => updateFilters({ deviceFilter: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                {devices.map((device) => (
                  <SelectItem key={device} value={device}>
                    {device}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lot Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Lot</label>
            <Select value={filters.lotFilter} onValueChange={(value) => updateFilters({ lotFilter: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All lots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lots</SelectItem>
                {lots.map((lot) => (
                  <SelectItem key={lot} value={lot}>
                    {lot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Yield Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Yield Range (%)</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.yieldRange.min}
                onChange={(e) => updateFilters({ 
                  yieldRange: { ...filters.yieldRange, min: Number(e.target.value) }
                })}
                className="w-20"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.yieldRange.max}
                onChange={(e) => updateFilters({ 
                  yieldRange: { ...filters.yieldRange, max: Number(e.target.value) }
                })}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
