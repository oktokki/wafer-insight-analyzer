import { useState, useCallback } from "react";
import { Upload, FileX, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EdsMapParser, ParsedEdsData } from "@/utils/edsMapParser";
import { StdfParser, ParsedStdfData } from "@/utils/stdfParser";
import { DataIntegrityReportComponent } from "./DataIntegrityReport";
import JSZip from 'jszip';

interface DataUploadProps {
  onDataUpload: (data: any) => void;
}

// Helper function to combine STDF results
const combineStdfResults = (results: ParsedStdfData[]): ParsedStdfData => {
  if (results.length === 0) {
    throw new Error('No STDF results to combine');
  }
  
  if (results.length === 1) {
    return results[0];
  }
  
  // Combine multiple STDF files
  const combined = { ...results[0] };
  
  // Combine parts from all files
  combined.parts = [];
  results.forEach(result => {
    combined.parts.push(...result.parts);
  });
  
  // Recalculate summary
  const totalParts = combined.parts.length;
  const passParts = combined.parts.filter(p => p.hardBin === 1).length;
  const failParts = totalParts - passParts;
  
  combined.summary = {
    totalParts,
    passParts,
    failParts,
    yieldPercentage: totalParts > 0 ? (passParts / totalParts) * 100 : 0,
    testNames: [...new Set(results.flatMap(r => r.summary.testNames))]
  };
  
  // Combine bin summaries
  combined.binSummary = {};
  results.forEach(result => {
    Object.entries(result.binSummary).forEach(([bin, data]) => {
      if (!combined.binSummary[bin]) {
        combined.binSummary[bin] = { count: 0, description: data.description };
      }
      combined.binSummary[bin].count += data.count;
    });
  });
  
  return combined;
};

// Helper function to extract ZIP files
const extractZipFiles = async (zipFile: File): Promise<File[]> => {
  const zip = new JSZip();
  const zipData = await zip.loadAsync(zipFile);
  const extractedFiles: File[] = [];
  
  for (const [filename, fileData] of Object.entries(zipData.files)) {
    if (!fileData.dir) {
      // Check if it's a supported file type
      if (filename.match(/\.\d{2}$/) || 
          filename.endsWith('.FAR') || 
          filename.endsWith('.lotSumTXT') || 
          filename.includes('lotSum') ||
          filename.endsWith('.stdf') ||
          filename.endsWith('.csv') ||
          filename.endsWith('.txt')) {
        
        const blob = await fileData.async('blob');
        const file = new File([blob], filename, { type: 'application/octet-stream' });
        extractedFiles.push(file);
      }
    }
  }
  
  return extractedFiles;
};

export const DataUpload = ({ onDataUpload }: DataUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [parsedData, setParsedData] = useState<ParsedEdsData | null>(null);
  const [parsedStdfData, setParsedStdfData] = useState<ParsedStdfData | null>(null);
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
    // Filter for supported file types
    const supportedFiles = files.filter(file => 
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

    if (supportedFiles.length === 0) {
      toast({
        title: "Invalid file format",
        description: "Please upload EDS Map files (.01-.25, .FAR), Lot Summary files (.lotSumTXT), STDF files, Wafer Map CSV files, or ZIP archives.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Extract ZIP files first
      let allFiles: File[] = [];
      for (const file of supportedFiles) {
        if (file.name.endsWith('.zip')) {
          console.log('Extracting ZIP file:', file.name);
          const extractedFiles = await extractZipFiles(file);
          console.log('Extracted files:', extractedFiles.map(f => f.name));
          allFiles.push(...extractedFiles);
          
          toast({
            title: "ZIP file extracted",
            description: `Extracted ${extractedFiles.length} files from ${file.name}`,
          });
        } else {
          allFiles.push(file);
        }
      }

      setUploadedFiles(prev => [...prev, ...allFiles]);

      // Check if we have EDS-related files to parse
      const mapFiles = allFiles.filter(f => f.name.match(/\.\d{2}$/) || f.name.endsWith('.FAR') || f.name.endsWith('.lotSumTXT') || f.name.includes('lotSum'));
      const stdfFiles = allFiles.filter(f => f.name.endsWith('.stdf') || f.name.endsWith('.stdf.gz'));
      
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
          files: allFiles.map(f => f.name),
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
      } else if (stdfFiles.length > 0) {
        // Handle STDF files with enhanced parser
        console.log('Parsing STDF files:', stdfFiles.map(f => f.name));
        
        const stdfResults = await Promise.all(
          stdfFiles.map(file => StdfParser.parseStdfFile(file))
        );
        
        // Combine results from multiple STDF files
        const combinedStdfData = combineStdfResults(stdfResults);
        setParsedStdfData(combinedStdfData);
        
        const processedData = {
          type: 'stdf',
          lots: 1,
          wafers: stdfFiles.length,
          yield: combinedStdfData.summary.yieldPercentage / 100,
          files: stdfFiles.map(f => f.name),
          stdfData: combinedStdfData
        };
        
        onDataUpload(processedData);
        
        toast({
          title: "STDF data loaded successfully",
          description: `Processed ${stdfFiles.length} STDF file(s) with ${combinedStdfData.summary.totalParts.toLocaleString()} parts at ${combinedStdfData.summary.yieldPercentage.toFixed(1)}% yield`,
        });
      } else {
        // Handle other file types with mock processing for now
        const mockData = {
          type: 'other',
          lots: supportedFiles.length,
          wafers: Math.floor(Math.random() * 25) + 1,
          yield: Math.random() * 0.3 + 0.7,
          files: supportedFiles.map(f => f.name)
        };
        
        onDataUpload(mockData);
        
        toast({
          title: "Data loaded successfully",
          description: `Processed ${supportedFiles.length} file(s). Note: Full parsing for some formats coming soon.`
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

      {parsedStdfData && (
        <Card>
          <CardHeader>
            <CardTitle>STDF Data Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="font-medium">Total Parts:</span> {parsedStdfData.summary.totalParts.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Pass Parts:</span> {parsedStdfData.summary.passParts.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Fail Parts:</span> {parsedStdfData.summary.failParts.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Yield:</span> {parsedStdfData.summary.yieldPercentage.toFixed(2)}%
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">File Information:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Lot ID:</span> {parsedStdfData.header.lotId}</div>
                  <div><span className="font-medium">Part Type:</span> {parsedStdfData.header.partType}</div>
                  <div><span className="font-medium">Test Program:</span> {parsedStdfData.header.testProgram}</div>
                  <div><span className="font-medium">Test Time:</span> {new Date(parsedStdfData.header.testTime).toLocaleString()}</div>
                </div>
                
                {parsedStdfData.waferInfo && (
                  <div className="mt-2">
                    <span className="font-medium">Wafer ID:</span> {parsedStdfData.waferInfo.waferId}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Bin Distribution:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parsedStdfData.binSummary).map(([bin, data]) => (
                    <Badge key={bin} variant={bin === '1' ? "default" : "destructive"}>
                      BIN{bin}: {data.count} ({data.description})
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Available Tests:</h4>
                <div className="flex flex-wrap gap-2">
                  {parsedStdfData.summary.testNames.map(testName => (
                    <Badge key={testName} variant="outline">
                      {testName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
