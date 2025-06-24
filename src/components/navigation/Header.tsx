
import { Upload, Settings, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  uploadedData: any;
}

export const Header = ({ uploadedData }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KGD Analytics System</h1>
              <p className="text-sm text-gray-500">Knowledge-based Quality Diagnostics Platform</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            Status: {uploadedData ? (
              <span className="text-green-600 font-medium">Data Loaded</span>
            ) : (
              <span className="text-orange-600 font-medium">No Data</span>
            )}
          </div>
          
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
};
