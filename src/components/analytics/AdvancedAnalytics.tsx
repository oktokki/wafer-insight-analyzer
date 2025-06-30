
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Zap } from "lucide-react";

interface AnalyticsResult {
  type: 'pattern' | 'anomaly' | 'prediction' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface AdvancedAnalyticsProps {
  data?: any;
}

export const AdvancedAnalytics = ({ data }: AdvancedAnalyticsProps) => {
  const [analysisType, setAnalysisType] = useState<'defect-pattern' | 'yield-prediction' | 'anomaly-detection' | 'process-optimization'>('defect-pattern');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalyticsResult[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const hasData = data?.edsData?.waferMaps?.length > 0;

  const runAnalysis = async () => {
    if (!hasData) {
      toast({
        title: "No data available",
        description: "Please upload wafer data before running analysis",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setResults([]);

    // Simulate ML analysis progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock results based on analysis type
    const mockResults = generateMockResults(analysisType, data);
    setResults(mockResults);
    setIsAnalyzing(false);
    setProgress(100);

    toast({
      title: "Analysis complete",
      description: `${mockResults.length} insights generated`,
    });
  };

  const generateMockResults = (type: string, data: any): AnalyticsResult[] => {
    const waferCount = data?.edsData?.waferMaps?.length || 0;
    const avgYield = data?.edsData?.waferMaps?.reduce((sum: number, w: any) => sum + w.header.yield, 0) / waferCount || 0;

    switch (type) {
      case 'defect-pattern':
        return [
          {
            type: 'pattern',
            title: 'Edge Effect Pattern Detected',
            description: 'Consistent failure pattern detected at wafer edges across 70% of wafers',
            confidence: 87,
            impact: 'high',
            recommendations: [
              'Review edge bead removal process',
              'Check wafer handling procedures',
              'Optimize plasma etch parameters'
            ]
          },
          {
            type: 'pattern',
            title: 'Center Die Clustering',
            description: 'Higher yield observed in center dies with radial gradient pattern',
            confidence: 92,
            impact: 'medium',
            recommendations: [
              'Analyze temperature uniformity',
              'Review deposition profile',
              'Consider process centering adjustments'
            ]
          }
        ];

      case 'yield-prediction':
        return [
          {
            type: 'prediction',
            title: 'Yield Forecast',
            description: `Predicted yield for next lot: ${(avgYield + Math.random() * 10 - 5).toFixed(1)}%`,
            confidence: 78,
            impact: 'medium',
            recommendations: [
              'Monitor process parameters closely',
              'Implement preventive maintenance',
              'Review incoming material quality'
            ]
          }
        ];

      case 'anomaly-detection':
        return [
          {
            type: 'anomaly',
            title: 'Process Drift Detected',
            description: 'Unusual variation in die performance detected in recent wafers',
            confidence: 85,
            impact: 'high',
            recommendations: [
              'Investigate tool calibration',
              'Review process control charts',
              'Check environmental conditions'
            ]
          }
        ];

      case 'process-optimization':
        return [
          {
            type: 'optimization',
            title: 'Parameter Optimization',
            description: 'Potential 5-8% yield improvement identified through parameter tuning',
            confidence: 73,
            impact: 'high',
            recommendations: [
              'Adjust exposure time by +15%',
              'Reduce development temperature by 2°C',
              'Optimize bake duration'
            ]
          }
        ];

      default:
        return [];
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'prediction': return <Brain className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>Advanced Analytics</span>
        </CardTitle>
        <CardDescription>
          AI-powered pattern recognition and yield optimization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Analysis Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Analysis Type</label>
            <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defect-pattern">Defect Pattern Recognition</SelectItem>
                <SelectItem value="yield-prediction">Yield Prediction</SelectItem>
                <SelectItem value="anomaly-detection">Anomaly Detection</SelectItem>
                <SelectItem value="process-optimization">Process Optimization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Run Analysis Button */}
          <Button 
            onClick={runAnalysis} 
            disabled={!hasData || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing ML Models</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Analysis Results</h4>
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getResultIcon(result.type)}
                      <h5 className="font-medium">{result.title}</h5>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getImpactColor(result.impact)}>
                        {result.impact.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {result.confidence}% confident
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">{result.description}</p>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Recommendations:</p>
                    <ul className="text-sm space-y-1">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasData && (
            <div className="text-center py-8">
              <p className="text-gray-500">Upload wafer data to enable advanced analytics</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
