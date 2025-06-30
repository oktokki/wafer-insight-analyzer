
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Eye, Settings, Plus, Trash2 } from "lucide-react";

interface ReportSection {
  id: string;
  type: 'summary' | 'chart' | 'table' | 'text' | 'image';
  title: string;
  content: any;
  enabled: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  createdAt: Date;
  lastModified: Date;
}

interface CustomReportBuilderProps {
  data?: any;
}

export const CustomReportBuilder = ({ data }: CustomReportBuilderProps) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([
    {
      id: '1',
      name: 'Standard Yield Report',
      description: 'Comprehensive yield analysis with charts and statistics',
      sections: [
        {
          id: '1',
          type: 'summary',
          title: 'Executive Summary',
          content: { includeMetrics: true, includeRecommendations: true },
          enabled: true
        },
        {
          id: '2',
          type: 'chart',
          title: 'Yield Trend Analysis',
          content: { chartType: 'line', dataSource: 'yield' },
          enabled: true
        },
        {
          id: '3',
          type: 'table',
          title: 'Wafer Details',
          content: { columns: ['waferId', 'yield', 'totalDie', 'passDie'] },
          enabled: true
        }
      ],
      createdAt: new Date('2024-01-15'),
      lastModified: new Date('2024-01-20')
    }
  ]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const { toast } = useToast();

  const sectionTypes = [
    { value: 'summary', label: 'Executive Summary' },
    { value: 'chart', label: 'Chart/Graph' },
    { value: 'table', label: 'Data Table' },
    { value: 'text', label: 'Text Block' },
    { value: 'image', label: 'Image/Diagram' }
  ];

  const createTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for the template",
        variant: "destructive"
      });
      return;
    }

    const template: ReportTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      sections: [],
      createdAt: new Date(),
      lastModified: new Date()
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({ name: '', description: '' });
    setSelectedTemplate(template.id);
    setEditingTemplate(template);
    setIsEditing(true);
    
    toast({
      title: "Template created",
      description: "New report template has been created",
    });
  };

  const editTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditingTemplate({ ...template });
      setIsEditing(true);
    }
  };

  const saveTemplate = () => {
    if (!editingTemplate) return;

    setTemplates(prev => prev.map(t => 
      t.id === editingTemplate.id 
        ? { ...editingTemplate, lastModified: new Date() }
        : t
    ));

    setIsEditing(false);
    setEditingTemplate(null);
    
    toast({
      title: "Template saved",
      description: "Report template has been updated",
    });
  };

  const addSection = () => {
    if (!editingTemplate) return;

    const newSection: ReportSection = {
      id: Date.now().toString(),
      type: 'summary',
      title: 'New Section',
      content: {},
      enabled: true
    };

    setEditingTemplate({
      ...editingTemplate,
      sections: [...editingTemplate.sections, newSection]
    });
  };

  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    if (!editingTemplate) return;

    setEditingTemplate({
      ...editingTemplate,
      sections: editingTemplate.sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      )
    });
  };

  const removeSection = (sectionId: string) => {
    if (!editingTemplate) return;

    setEditingTemplate({
      ...editingTemplate,
      sections: editingTemplate.sections.filter(s => s.id !== sectionId)
    });
  };

  const previewTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    toast({
      title: "Report preview",
      description: `Generating preview for "${template.name}"`,
    });
    
    // In a real implementation, this would open a preview modal or window
  };

  const generateReport = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (!data) {
      toast({
        title: "No data available",
        description: "Please upload wafer data before generating reports",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Report generated",
      description: `Report "${template.name}" has been generated successfully`,
    });
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    if (selectedTemplate === templateId) {
      setSelectedTemplate('');
    }
    
    toast({
      title: "Template deleted",
      description: "Report template has been removed",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Custom Report Builder</span>
        </CardTitle>
        <CardDescription>
          Create and customize report templates for different analysis needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Template Creation */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Create New Template</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Template name..."
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Description..."
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <Button onClick={createTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          {/* Template List */}
          <div className="space-y-4">
            <h4 className="font-medium">Report Templates</h4>
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium">{template.name}</h5>
                      <Badge variant="outline">{template.sections.length} sections</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Last modified: {template.lastModified.toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewTemplate(template.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editTemplate(template.id)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => generateReport(template.id)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Template Sections Preview */}
                <div className="flex flex-wrap gap-2">
                  {template.sections.map((section) => (
                    <Badge key={section.id} variant={section.enabled ? "default" : "secondary"}>
                      {section.title}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Template Editor */}
          {isEditing && editingTemplate && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Editing: {editingTemplate.name}</h4>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Sections Editor */}
              <div className="space-y-3">
                {editingTemplate.sections.map((section) => (
                  <div key={section.id} className="flex items-center space-x-4 p-3 bg-white rounded border">
                    <Checkbox
                      checked={section.enabled}
                      onCheckedChange={(checked) => updateSection(section.id, { enabled: checked as boolean })}
                    />
                    
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className="flex-1"
                    />
                    
                    <Select
                      value={section.type}
                      onValueChange={(value: any) => updateSection(section.id, { type: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button variant="outline" onClick={addSection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </div>
          )}

          {templates.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No report templates created yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
