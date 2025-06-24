
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Share, Calendar } from "lucide-react";

interface ReportSummaryProps {
  data?: any;
}

export const ReportSummary = ({ data }: ReportSummaryProps) => {
  const reportData = {
    lotId: "LOT_240624_001",
    analysis: {
      overallYield: 87.5,
      targetYield: 85.0,
      status: "PASS",
      waferCount: 25,
      defectPatterns: 3,
      recommendations: 2
    },
    summary: {
      keyFindings: [
        "Edge ring pattern detected in 60% of wafers",
        "Overall yield exceeds target by 2.5%",
        "Center cluster defects within acceptable range",
        "No critical process deviations found"
      ],
      recommendations: [
        "Monitor edge bead removal process parameters",
        "Implement additional particle contamination controls"
      ],
      nextActions: [
        "Schedule follow-up analysis for next lot",
        "Update process control limits",
        "Share findings with foundry partner"
      ]
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASS":
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case "FAIL":
        return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      case "WARNING":
        return <Badge className="bg-orange-100 text-orange-800">WARNING</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">UNKNOWN</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analysis Report Summary</CardTitle>
              <CardDescription>
                Comprehensive analysis results for {reportData.lotId}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">
                  {reportData.analysis.overallYield}%
                </div>
                <div className="text-sm text-blue-600">Overall Yield</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">
                  {reportData.analysis.waferCount}
                </div>
                <div className="text-sm text-green-600">Wafers Analyzed</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">
                  {reportData.analysis.defectPatterns}
                </div>
                <div className="text-sm text-orange-600">Defect Patterns</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">
                  {reportData.analysis.recommendations}
                </div>
                <div className="text-sm text-purple-600">Recommendations</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-gray-600" />
                <div>
                  <div className="font-medium">Analysis Status</div>
                  <div className="text-sm text-gray-500">Completed on {new Date().toLocaleDateString()}</div>
                </div>
              </div>
              {getStatusBadge(reportData.analysis.status)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {reportData.summary.keyFindings.map((finding, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{finding}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              {reportData.summary.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Next Actions:</h4>
              <ul className="space-y-1">
                {reportData.summary.nextActions.map((action, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Generation</CardTitle>
          <CardDescription>
            Generate detailed reports for different stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col space-y-2">
              <FileText className="h-6 w-6" />
              <span className="font-medium">Executive Summary</span>
              <span className="text-xs text-gray-500">High-level overview for management</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="font-medium">Technical Report</span>
              <span className="text-xs text-gray-500">Detailed analysis for engineers</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col space-y-2">
              <Share className="h-6 w-6" />
              <span className="font-medium">Customer Report</span>
              <span className="text-xs text-gray-500">Quality metrics for customers</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
