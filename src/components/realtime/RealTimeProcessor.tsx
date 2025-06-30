
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Activity, Play, Pause, Square, Wifi } from "lucide-react";

interface RealTimeData {
  timestamp: Date;
  waferId: string;
  yield: number;
  totalDie: number;
  passDie: number;
  failDie: number;
}

interface RealTimeProcessorProps {
  onDataReceived: (data: RealTimeData) => void;
}

export const RealTimeProcessor = ({ onDataReceived }: RealTimeProcessorProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [dataBuffer, setDataBuffer] = useState<RealTimeData[]>([]);
  const { toast } = useToast();

  // Simulate real-time data connection
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isProcessing && isConnected) {
      interval = setInterval(() => {
        // Simulate incoming wafer data
        const mockData: RealTimeData = {
          timestamp: new Date(),
          waferId: `W${Date.now().toString().slice(-6)}`,
          yield: Math.random() * 100,
          totalDie: Math.floor(Math.random() * 1000) + 500,
          passDie: 0,
          failDie: 0
        };
        
        mockData.passDie = Math.floor(mockData.totalDie * (mockData.yield / 100));
        mockData.failDie = mockData.totalDie - mockData.passDie;
        
        setDataBuffer(prev => [...prev.slice(-9), mockData]);
        onDataReceived(mockData);
        setProcessedCount(prev => prev + 1);
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, isConnected, onDataReceived]);

  const connect = async () => {
    setConnectionStatus('connecting');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsConnected(true);
    setConnectionStatus('connected');
    
    toast({
      title: "Connected",
      description: "Real-time data stream connected successfully",
    });
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsProcessing(false);
    setConnectionStatus('disconnected');
    setProcessedCount(0);
    setDataBuffer([]);
    
    toast({
      title: "Disconnected",
      description: "Real-time data stream disconnected",
    });
  };

  const startProcessing = () => {
    setIsProcessing(true);
    toast({
      title: "Processing started",
      description: "Real-time data processing is now active",
    });
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    toast({
      title: "Processing stopped",
      description: "Real-time data processing has been paused",
    });
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Real-Time Data Processing</span>
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        </CardTitle>
        <CardDescription>
          Live wafer data stream processing and monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Connection Controls */}
          <div className="flex items-center space-x-2">
            {!isConnected ? (
              <Button onClick={connect} disabled={connectionStatus === 'connecting'}>
                <Wifi className="h-4 w-4 mr-2" />
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </Button>
            ) : (
              <>
                <Button onClick={disconnect} variant="outline">
                  <Square className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
                {!isProcessing ? (
                  <Button onClick={startProcessing}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Processing
                  </Button>
                ) : (
                  <Button onClick={stopProcessing} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Processing
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Status Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Processed</p>
              <p className="text-lg font-semibold">{processedCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Buffer Size</p>
              <p className="text-lg font-semibold">{dataBuffer.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <Badge variant={isProcessing ? 'default' : 'secondary'}>
                {isProcessing ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* Data Buffer */}
          {dataBuffer.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Recent Data</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {dataBuffer.slice().reverse().map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-sm">{data.waferId}</span>
                      <span className="text-sm">{data.yield.toFixed(1)}%</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {data.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Rate</span>
                <span>~30 wafers/min</span>
              </div>
              <Progress value={75} className="w-full" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
