import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Link, RefreshCw, CheckCircle, XCircle, Zap } from "lucide-react";

interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: Date | null;
}

interface APIIntegrationProps {
  onDataReceived: (data: any, source: string) => void;
}

export const APIIntegration = ({ onDataReceived }: APIIntegrationProps) => {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([
    {
      id: '1',
      name: 'Wafer Test System',
      url: 'https://api.wafertest.com/v1/data',
      method: 'GET',
      status: 'disconnected',
      lastSync: null
    },
    {
      id: '2',
      name: 'Process Control Database',
      url: 'https://process-db.company.com/api/wafers',
      method: 'POST',
      status: 'disconnected',
      lastSync: null
    }
  ]);
  
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    url: '',
    method: 'GET' as const
  });
  
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  const testConnection = async (endpointId: string) => {
    setIsConnecting(endpointId);
    
    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEndpoints(prev => prev.map(ep => 
        ep.id === endpointId 
          ? { ...ep, status: 'connected' as const, lastSync: new Date() }
          : ep
      ));
      
      toast({
        title: "Connection successful",
        description: "API endpoint is now connected",
      });
      
    } catch (error) {
      setEndpoints(prev => prev.map(ep => 
        ep.id === endpointId 
          ? { ...ep, status: 'error' as const }
          : ep
      ));
      
      toast({
        title: "Connection failed",
        description: "Unable to connect to API endpoint",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(null);
    }
  };

  const syncData = async (endpointId: string) => {
    setIsSyncing(endpointId);
    const endpoint = endpoints.find(ep => ep.id === endpointId);
    
    if (!endpoint) return;
    
    try {
      // Simulate data sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock data from external API
      const mockData = {
        source: endpoint.name,
        timestamp: new Date(),
        wafers: Array.from({ length: 5 }, (_, i) => ({
          id: `EXT_${Date.now()}_${i}`,
          yield: Math.random() * 100,
          totalDie: Math.floor(Math.random() * 1000) + 500,
          slot: i + 1
        }))
      };
      
      onDataReceived(mockData, endpoint.name);
      
      setEndpoints(prev => prev.map(ep => 
        ep.id === endpointId 
          ? { ...ep, lastSync: new Date() }
          : ep
      ));
      
      toast({
        title: "Data synchronized",
        description: `Received ${mockData.wafers.length} wafer records from ${endpoint.name}`,
      });
      
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Unable to synchronize data from API",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(null);
    }
  };

  const addEndpoint = () => {
    if (!newEndpoint.name || !newEndpoint.url) {
      toast({
        title: "Missing information",
        description: "Please provide both name and URL",
        variant: "destructive"
      });
      return;
    }

    const endpoint: APIEndpoint = {
      id: Date.now().toString(),
      name: newEndpoint.name,
      url: newEndpoint.url,
      method: newEndpoint.method,
      status: 'disconnected',
      lastSync: null
    };

    setEndpoints(prev => [...prev, endpoint]);
    setNewEndpoint({ name: '', url: '', method: 'GET' });
    
    toast({
      title: "Endpoint added",
      description: "New API endpoint has been configured",
    });
  };

  const removeEndpoint = (endpointId: string) => {
    setEndpoints(prev => prev.filter(ep => ep.id !== endpointId));
    toast({
      title: "Endpoint removed",
      description: "API endpoint has been removed",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Link className="h-5 w-5" />
          <span>API Integration</span>
        </CardTitle>
        <CardDescription>
          Connect to external wafer testing systems and databases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Add New Endpoint */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Add New API Endpoint</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Endpoint name..."
                value={newEndpoint.name}
                onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="API URL..."
                value={newEndpoint.url}
                onChange={(e) => setNewEndpoint(prev => ({ ...prev, url: e.target.value }))}
              />
              <Select value={newEndpoint.method} onValueChange={(value: any) => setNewEndpoint(prev => ({ ...prev, method: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addEndpoint}>
              <Settings className="h-4 w-4 mr-2" />
              Add Endpoint
            </Button>
          </div>

          {/* Existing Endpoints */}
          <div className="space-y-4">
            <h4 className="font-medium">Configured Endpoints</h4>
            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(endpoint.status)}
                    <div>
                      <h5 className="font-medium">{endpoint.name}</h5>
                      <p className="text-sm text-gray-500">{endpoint.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{endpoint.method}</Badge>
                    {getStatusBadge(endpoint.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {endpoint.lastSync ? (
                      <span>Last sync: {endpoint.lastSync.toLocaleString()}</span>
                    ) : (
                      <span>Never synchronized</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(endpoint.id)}
                      disabled={isConnecting === endpoint.id}
                    >
                      {isConnecting === endpoint.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Test
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => syncData(endpoint.id)}
                      disabled={endpoint.status !== 'connected' || isSyncing === endpoint.id}
                    >
                      {isSyncing === endpoint.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Sync
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEndpoint(endpoint.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {endpoints.length === 0 && (
            <div className="text-center py-8">
              <Link className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No API endpoints configured</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
