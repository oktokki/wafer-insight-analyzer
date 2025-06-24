
import { cn } from "@/lib/utils";
import { 
  Upload, 
  Layout, 
  Circle, 
  ChartBar, 
  Search, 
  FileText,
  Database
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Layout },
  { id: "upload", label: "Data Upload", icon: Upload },
  { id: "wafer-map", label: "Wafer Map", icon: Circle },
  { id: "yield-analysis", label: "Yield Analysis", icon: ChartBar },
  { id: "spc", label: "SPC Charts", icon: ChartBar },
  { id: "defect-patterns", label: "Defect Patterns", icon: Search },
  { id: "reports", label: "Reports", icon: FileText },
];

export const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6 text-blue-400" />
          <span className="font-semibold">KAS</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                    currentView === item.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-400">
          <div>Version 1.0.0</div>
          <div>Semiconductor Analytics</div>
        </div>
      </div>
    </div>
  );
};
