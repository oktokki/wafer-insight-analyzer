
import { useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FileUploadZoneProps {
  onFilesDrop: (files: File[]) => void;
  isProcessing: boolean;
  isDragging: boolean;
  onDragStateChange: (isDragging: boolean) => void;
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const FileUploadZone = ({ onFilesDrop, isProcessing, isDragging, onDragStateChange }: FileUploadZoneProps) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDragStateChange(true);
  }, [onDragStateChange]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDragStateChange(false);
  }, [onDragStateChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDragStateChange(false);
    
    const files = Array.from(e.dataTransfer.files);
    onFilesDrop(files);
  }, [onFilesDrop, onDragStateChange]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFilesDrop(files);
    }
  }, [onFilesDrop]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Upload</CardTitle>
        <CardDescription>
          Upload EDS Map files (.01-.25, .FAR), Second Foundry files (.f01-.f25), Lot Summary files (.lotSumTXT), STDF files, Wafer Map CSV files, or ZIP archives
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
            Supports: EDS Maps (.01-.25, .FAR), Second Foundry (.f01-.f25), Lot Summary (.lotSumTXT), STDF (.stdf, .gz), CSV, TXT, ZIP files
          </p>
          <input
            type="file"
            multiple
            accept=".01,.02,.03,.04,.05,.06,.07,.08,.09,.10,.11,.12,.13,.14,.15,.16,.17,.18,.19,.20,.21,.22,.23,.24,.25,.FAR,.f01,.f02,.f03,.f04,.f05,.f06,.f07,.f08,.f09,.f10,.f11,.f12,.f13,.f14,.f15,.f16,.f17,.f18,.f19,.f20,.f21,.f22,.f23,.f24,.f25,.stdf,.gz,.csv,.txt,.lotSumTXT,.zip"
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
  );
};
