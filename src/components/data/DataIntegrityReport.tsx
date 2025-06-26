
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { DataIntegrityReport, ValidationResult } from "@/utils/dataValidator";

interface DataIntegrityReportProps {
  report: DataIntegrityReport;
}

export const DataIntegrityReportComponent = ({ report }: DataIntegrityReportProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Info</Badge>;
    }
  };

  const getSeverityIcon = (severity: ValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const renderValidationResult = (result: ValidationResult, title: string) => (
    <div className="flex items-start space-x-3 p-3 border rounded-lg">
      {getSeverityIcon(result.severity)}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{title}</h4>
          <Badge variant={result.isValid ? "default" : "destructive"}>
            {result.isValid ? "✓" : "✗"}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">{result.message}</p>
        {result.details && (
          <p className="text-xs text-gray-500 mt-1">{result.details}</p>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon(report.overallStatus)}
              <span>Data Integrity Report</span>
            </CardTitle>
            <CardDescription>
              Comprehensive validation and cross-reference analysis
            </CardDescription>
          </div>
          {getStatusBadge(report.overallStatus)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Core Validations */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Core Validations</h3>
            <div className="space-y-3">
              {renderValidationResult(report.waferCountValidation, "Wafer Count")}
              {renderValidationResult(report.bin1CountValidation, "BIN1 Count")}
              {renderValidationResult(report.lotSummaryValidation, "Lot Summary")}
            </div>
          </div>

          {/* Cross-File Validation */}
          {report.crossFileValidation.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-lg">Cross-File Validation</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {report.crossFileValidation.map((result, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                    {getSeverityIcon(result.severity)}
                    <div className="flex-1">
                      <p className="text-sm">{result.message}</p>
                      {result.details && (
                        <p className="text-xs text-gray-500">{result.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Wafer Validation */}
          {report.individualWaferValidation.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-lg">Individual Wafer Analysis</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {report.individualWaferValidation.map((result, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                    {getSeverityIcon(result.severity)}
                    <div className="flex-1">
                      <p className="text-sm">{result.message}</p>
                      {result.details && (
                        <p className="text-xs text-gray-500">{result.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-lg">Recommendations</h3>
              <div className="space-y-2">
                {report.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
