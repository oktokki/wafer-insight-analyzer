
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, FolderOpen, Trash2, Clock } from "lucide-react";

interface SavedSession {
  id: string;
  name: string;
  timestamp: Date;
  data: any;
  filters: any;
  view: string;
}

interface DataPersistenceProps {
  currentData?: any;
  currentFilters?: any;
  currentView?: string;
  onLoadSession: (session: SavedSession) => void;
}

export const DataPersistence = ({ 
  currentData, 
  currentFilters, 
  currentView, 
  onLoadSession 
}: DataPersistenceProps) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const stored = localStorage.getItem('wafer_sessions');
    if (stored) {
      setSessions(JSON.parse(stored));
    }
  };

  const saveSession = () => {
    if (!sessionName.trim()) {
      toast({
        title: "Session name required",
        description: "Please enter a name for this session",
        variant: "destructive"
      });
      return;
    }

    if (!currentData) {
      toast({
        title: "No data to save",
        description: "Please upload data before saving a session",
        variant: "destructive"
      });
      return;
    }

    const newSession: SavedSession = {
      id: Date.now().toString(),
      name: sessionName,
      timestamp: new Date(),
      data: currentData,
      filters: currentFilters,
      view: currentView || 'dashboard'
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    localStorage.setItem('wafer_sessions', JSON.stringify(updatedSessions));
    setSessionName('');

    toast({
      title: "Session saved",
      description: `Session "${sessionName}" has been saved successfully`,
    });
  };

  const loadSession = () => {
    const session = sessions.find(s => s.id === selectedSession);
    if (session) {
      onLoadSession(session);
      toast({
        title: "Session loaded",
        description: `Session "${session.name}" has been loaded`,
      });
    }
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('wafer_sessions', JSON.stringify(updatedSessions));
    
    if (selectedSession === sessionId) {
      setSelectedSession('');
    }

    toast({
      title: "Session deleted",
      description: "Session has been removed",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Save className="h-5 w-5" />
          <span>Session Management</span>
        </CardTitle>
        <CardDescription>Save and load analysis sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Save Session */}
          <div className="space-y-4">
            <h4 className="font-medium">Save Current Session</h4>
            <div className="flex space-x-2">
              <Input
                placeholder="Session name..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveSession}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Load Session */}
          <div className="space-y-4">
            <h4 className="font-medium">Load Saved Session</h4>
            <div className="flex space-x-2">
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select session..." />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={loadSession} disabled={!selectedSession}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Load
              </Button>
            </div>
          </div>

          {/* Session List */}
          {sessions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Saved Sessions</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{session.name}</span>
                        <Badge variant="outline">{session.view}</Badge>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(session.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
