import { useState, useCallback } from "react";
import { Upload, FileX, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EdsMapParser, ParsedEdsData } from "@/utils/edsMapParser";
import { DataIntegrityReportComponent } from "./DataIntegrityReport";

interface DataUploadProps {
  onDataUpload: (data: any) => void;
}

export const DataUpload = ({ onDataUpload }: DataUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [parsedData, setParsedData] = useState<ParsedEdsData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    // Filter for EDS Map files
    const edsFiles = files.filter(file => 
      file.name.match(/\.\d{2}$/) || // .01, .02, etc.
      file.name.endsWith('.FAR') ||
      file.name.endsWith('.stdf') || 
      file.name.endsWith('.stdf.gz') ||
      file.name.endsWith('.csv') || 
      file.name.endsWith('.txt') ||
      file.name.endsWith('.lotSumTXT') ||
      file.name.includes('lotSum') ||
      file.name.endsWith('.zip')
    );

    if (edsFiles.length === 0) {
      toast({
        title: "Invalid file format",
        description: "Please upload EDS Map files (.01-.25, .FAR), Lot Summary files (.lotSumTXT), STDF files, Wafer Map CSV files, or ZIP archives.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFiles(prev => [...prev, ...edsFiles]);
    setIsProcessing(true);

    try {
      // Check if we have EDS-related files to parse
      const mapFiles = edsFiles.filter(f => f.name.match(/\.\d{2}$/) || f.name.endsWith('.FAR') || f.name.endsWith('.lotSumTXT') || f.name.includes('lotSum'));
      
      if (mapFiles.length > 0) {
        console.log('Parsing EDS-related files:', mapFiles.map(f => f.name));
        const parsed = await EdsMapParser.parseEdsFiles(mapFiles);
        setParsedData(parsed);
        
        // Convert to format expected by existing components
        const processedData = {
          type: 'eds-maps',
          lots: 1,
          wafers: parsed.waferMaps.length,
          yield: parsed.waferMaps.length > 0 
            ? parsed.waferMaps.reduce((sum, w) => sum + w.header.yield, 0) / parsed.waferMaps.length / 100
            : (parsed.lotSummary?.overallStats.overallYield || 0) / 100,
          files: edsFiles.map(f => f.name),
          edsData: parsed
        };
        
        onDataUpload(processedData);
        
        const hasLotSummary = parsed.lotSummary ? 'with Lot Summary' : '';
        const validationStatus = parsed.integrityReport.overallStatus;
        
        toast({
          title: "EDS data loaded successfully",
          description: `Processed ${parsed.waferMaps.length} wafer maps ${hasLotSummary} - integrity check: ${validationStatus}`,
          variant: validationStatus === 'fail' ? "destructive" : "default"
        });
      } else {
        // Handle other file types with mock processing for now
        const mockData = {
          type: 'other',
          lots: edsFiles.length,
          wafers: Math.floor(Math.random() * 25) + 1,
          yield: Math.random() * 0.3 + 0.7,
          files: edsFiles.map(f => f.name)
        };
        
        onDataUpload(mockData);
        
        toast({
          title: "Data loaded successfully",
          description: `Processed ${edsFiles.length} file(s). Note: Full parsing for STDF/other formats coming soon.`
        });
      }
    } catch (error) {
      console.error('Error parsing files:', error);
      toast({
        title: "Error processing files",
        description: "Failed to parse uploaded files. Please check file format and content.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Upload</CardTitle>
          <CardDescription>
            Upload EDS Map files (.01-.25, .FAR), Lot Summary files (.lotSumTXT), STDF files, Wafer Map CSV files, or ZIP archives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-gray-500 mb-4">
              Supports: EDS Maps (.01-.25, .FAR), Lot Summary (.lotSumTXT), STDF (.stdf, .gz), CSV, TXT, ZIP files
            </p>
            <input
              type="file"
              multiple
              accept=".01,.02,.03,.04,.05,.06,.07,.08,.09,.10,.11,.12,.13,.14,.15,.16,.17,.18,.19,.20,.21,.22,.23,.24,.25,.FAR,.stdf,.gz,.csv,.txt,.lotSumTXT,.zip"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild disabled={isProcessing}>
              <label htmlFor="file-upload" className="cursor-pointer">
                {isProcessing ? "Processing..." : "Select Files"}
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                    <FileX className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {parsedData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>EDS Data Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Wafer Count:</span> {parsedData.waferMaps.length}
                  </div>
                  <div>
                    <span className="font-medium">Average Yield:</span> {' '}
                    {parsedData.waferMaps.length > 0 
                      ? (parsedData.waferMaps.reduce((sum, w) => sum + w.header.yield, 0) / parsedData.waferMaps.length).toFixed(2)
                      : parsedData.lotSummary?.overallStats.overallYield.toFixed(2) || 0}%
                  </div>
                </div>
                
                {parsedData.lotSummary && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Lot Summary Information:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Lot:</span> {parsedData.lotSummary.header.lotNumber}</div>
                      <div><span className="font-medium">Device:</span> {parsedData.lotSummary.header.device}</div>
                      <div><span className="font-medium">Total Dies:</span> {parsedData.lotSummary.overallStats.totalDies.toLocaleString()}</div>
                      <div><span className="font-medium">Pass Dies:</span> {parsedData.lotSummary.overallStats.totalPass.toLocaleString()}</div>
                    </div>
                    {parsedData.lotSummary.testModes.length > 0 && (
                      <div>
                        <span className="font-medium">Test Modes:</span> {parsedData.lotSummary.testModes.join(', ')}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-medium">Quick Validation Results:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={parsedData.validationResults.waferCountMatch ? "default" : "destructive"}>
                      Wafer Count: {parsedData.validationResults.waferCountMatch ? "✓" : "✗"}
                    </Badge>
                    <Badge variant={parsedData.validationResults.bin1CountMatch ? "default" : "destructive"}>
                      BIN1 Count: {parsedData.validationResults.bin1CountMatch ? "✓" : "✗"}
                    </Badge>
                    {parsedData.lotSummary && (
                      <Badge variant={parsedData.validationResults.lotSummaryMatch ? "default" : "destructive"}>
                        Lot Summary: {parsedData.validationResults.lotSummaryMatch ? "✓" : "✗"}
                      </Badge>
                    )}
                  </div>
                  
                  {parsedData.validationResults.issues.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Quick Validation Issues:</span>
                      </div>
                      <ul className="text-sm text-amber-700 mt-1 ml-6">
                        {parsedData.validationResults.issues.slice(0, 3).map((issue, idx) => (
                          <li key={idx}>• {issue}</li>
                        ))}
                        {parsedData.validationResults.issues.length > 3 && (
                          <li>• ...and {parsedData.validationResults.issues.length - 3} more issues</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Integrity Report */}
          <DataIntegrityReportComponent report={parsedData.integrityReport} />
        </>
      )}
    </div>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
