
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { EdsMapParser, ParsedEdsData } from "@/utils/edsMapParser";
import { SecondFoundryParser, SecondFoundryMapData } from "@/utils/secondFoundryParser";
import { StdfParser, ParsedStdfData } from "@/utils/stdfParser";
import { extractZipFiles } from "@/utils/zipExtractor";
import { combineStdfResults } from "@/utils/stdfCombiner";
import { FileUploadZone } from "./FileUploadZone";
import { UploadedFilesList } from "./UploadedFilesList";
import { EdsDataDisplay } from "./EdsDataDisplay";
import { SecondFoundryDataDisplay } from "./SecondFoundryDataDisplay";
import { StdfDataDisplay } from "./StdfDataDisplay";

interface DataUploadProps {
  onDataUpload: (data: any) => void;
}

export const DataUpload = ({ onDataUpload }: DataUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [parsedData, setParsedData] = useState<ParsedEdsData | null>(null);
  const [parsedSecondFoundryData, setParsedSecondFoundryData] = useState<SecondFoundryMapData[] | null>(null);
  const [parsedStdfData, setParsedStdfData] = useState<ParsedStdfData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFiles = async (files: File[]) => {
    // Filter for supported file types
    const supportedFiles = files.filter(file => 
      file.name.match(/\.\d{2}$/) || // .01, .02, etc.
      file.name.match(/\.f\d{2}$/) || // .f01, .f02, etc. (Second foundry)
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
        description: "Please upload EDS Map files (.01-.25, .FAR), Second Foundry files (.f01-.f25), Lot Summary files (.lotSumTXT), STDF files, Wafer Map CSV files, or ZIP archives.",
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

      // Categorize files by type
      const edsMapFiles = allFiles.filter(f => f.name.match(/\.\d{2}$/) || f.name.endsWith('.FAR') || f.name.endsWith('.lotSumTXT') || f.name.includes('lotSum'));
      const secondFoundryFiles = allFiles.filter(f => f.name.match(/\.f\d{2}$/));
      const stdfFiles = allFiles.filter(f => f.name.endsWith('.stdf') || f.name.endsWith('.stdf.gz'));
      
      if (secondFoundryFiles.length > 0) {
        console.log('Parsing Second Foundry files:', secondFoundryFiles.map(f => f.name));
        const parsed = await SecondFoundryParser.parseSecondFoundryFiles(secondFoundryFiles);
        setParsedSecondFoundryData(parsed);
        
        const totalGood = parsed.reduce((sum, wafer) => sum + wafer.header.good, 0);
        const totalFail = parsed.reduce((sum, wafer) => sum + wafer.header.fail, 0);
        const averageYield = parsed.length > 0 
          ? parsed.reduce((sum, wafer) => sum + wafer.yieldPercentage, 0) / parsed.length / 100
          : 0;
        
        const processedData = {
          type: 'second-foundry',
          lots: 1,
          wafers: parsed.length,
          yield: averageYield,
          files: secondFoundryFiles.map(f => f.name),
          secondFoundryData: parsed
        };
        
        onDataUpload(processedData);
        
        toast({
          title: "Second Foundry data loaded successfully",
          description: `Processed ${parsed.length} wafer maps with ${totalGood.toLocaleString()} good dies at ${(averageYield * 100).toFixed(1)}% average yield`,
        });
      } else if (edsMapFiles.length > 0) {
        console.log('Parsing EDS-related files:', edsMapFiles.map(f => f.name));
        const parsed = await EdsMapParser.parseEdsFiles(edsMapFiles);
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
      <FileUploadZone 
        onFilesDrop={handleFiles}
        isProcessing={isProcessing}
        isDragging={isDragging}
        onDragStateChange={setIsDragging}
      />

      <UploadedFilesList 
        files={uploadedFiles}
        onRemoveFile={removeFile}
      />

      {parsedData && <EdsDataDisplay parsedData={parsedData} />}

      {parsedSecondFoundryData && <SecondFoundryDataDisplay parsedData={parsedSecondFoundryData} />}

      {parsedStdfData && <StdfDataDisplay parsedStdfData={parsedStdfData} />}
    </div>
  );
};
