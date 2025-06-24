
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, Info } from "lucide-react";

interface DefectPatternsProps {
  data?: any;
}

export const DefectPatterns = ({ data }: DefectPatternsProps) => {
  const patterns = [
    {
      id: 1,
      name: "Edge Ring",
      severity: "high",
      confidence: 94.2,
      description: "High failure concentration at wafer edges",
      recommendation: "Check edge bead removal process",
      affectedWafers: 15,
      trend: "increasing"
    },
    {
      id: 2,
      name: "Center Cluster",
      severity: "medium",
      confidence: 78.5,
      description: "Localized failures in center region",
      recommendation: "Investigate lithography alignment",
      affectedWafers: 8,
      trend: "stable"
    },
    {
      id: 3,
      name: "Random Defects",
      severity: "low",
      confidence: 65.3,
      description: "Scattered individual die failures",
      recommendation: "Monitor particle contamination",
      affectedWafers: 12,
      trend: "decreasing"
    }
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-orange-100 text-orange-800">Medium Priority</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "stable":
        return <Minus className="h-4 w-4 text-orange-500" />;
      case "decreasing":
        return <Info className="h-4 w-4 text-green-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defect Pattern Analysis</CardTitle>
        <CardDescription>
          AI-powered pattern recognition and root cause analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patterns.map((pattern) => (
            <div key={pattern.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h4 className="font-semibold">{pattern.name}</h4>
                  {getSeverityBadge(pattern.severity)}
                  {getTrendIcon(pattern.trend)}
                </div>
                <div className="text-sm text-gray-500">
                  {pattern.confidence}% confidence
                </div>
              </div>
              
              <p className="text-sm text-gray-600">{pattern.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Affected Wafers:</span> {pattern.affectedWafers}
                </div>
                <div>
                  <span className="font-medium">Trend:</span> {pattern.trend}
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-900 text-sm mb-1">Recommendation:</div>
                <div className="text-blue-700 text-sm">{pattern.recommendation}</div>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Pattern Detection Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Total Patterns Detected: <span className="font-medium">3</span></div>
              <div>High Priority Issues: <span className="font-medium text-red-600">1</span></div>
              <div>Analysis Confidence: <span className="font-medium">79.3%</span></div>
              <div>Recommended Actions: <span className="font-medium">3</span></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function Minus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}
