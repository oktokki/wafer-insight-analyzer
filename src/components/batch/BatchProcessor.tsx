
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Play, Pause, Square, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface BatchJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalLots: number;
  processedLots: number;
  startTime?: Date;
  endTime?: Date;
  results?: {
    successCount: number;
    failedCount: number;
    totalWafers: number;
    averageYield: number;
  };
}

interface BatchProcessorProps {
  onBatchComplete: (results: any) => void;
}

export const BatchProcessor = ({ onBatchComplete }: BatchProcessorProps) => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [newJobName, setNewJobName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const createBatchJob = () => {
    if (!newJobName.trim()) {
      toast({
        title: "Job name required",
        description: "Please enter a name for the batch job",
        variant: "destructive"
      });
      return;
    }

    const newJob: BatchJob = {
      id: Date.now().toString(),
      name: newJobName,
      status: 'pending',
      progress: 0,
      totalLots: Math.floor(Math.random() * 10) + 5, // Mock: 5-15 lots
      processedLots: 0
    };

    setJobs(prev => [...prev, newJob]);
    setNewJobName('');
    
    toast({
      title: "Batch job created",
      description: `Job "${newJobName}" has been queued for processing`,
    });
  };

  const startBatchJob = async (jobId: string) => {
    setIsProcessing(true);
    
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'running' as const, startTime: new Date() }
        : job
    ));

    // Simulate batch processing
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    for (let i = 0; i <= job.totalLots; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const progress = (i / job.totalLots) * 100;
      
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, progress, processedLots: i }
          : j
      ));
    }

    // Complete the job
    const results = {
      successCount: job.totalLots - 1,
      failedCount: 1,
      totalWafers: job.totalLots * 25, // Assume 25 wafers per lot
      averageYield: 75 + Math.random() * 20 // 75-95% yield
    };

    setJobs(prev => prev.map(j => 
      j.id === jobId 
        ? { 
            ...j, 
            status: 'completed' as const, 
            endTime: new Date(),
            results
          }
        : j
    ));

    onBatchComplete(results);
    setIsProcessing(false);
    
    toast({
      title: "Batch job completed",
      description: `Processed ${job.totalLots} lots successfully`,
    });
  };

  const pauseBatchJob = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId && job.status === 'running'
        ? { ...job, status: 'pending' as const }
        : job
    ));
    setIsProcessing(false);
    
    toast({
      title: "Job paused",
      description: "Batch processing has been paused",
    });
  };

  const deleteBatchJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    toast({
      title: "Job deleted",
      description: "Batch job has been removed",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <Pause className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Batch Processing</span>
        </CardTitle>
        <CardDescription>
          Process multiple lots simultaneously with automated analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Create New Batch Job */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Create New Batch Job</h4>
            <div className="flex space-x-2">
              <Input
                placeholder="Batch job name..."
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createBatchJob}>
                <Package className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </div>
          </div>

          {/* Job Queue */}
          <div className="space-y-4">
            <h4 className="font-medium">Job Queue</h4>
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h5 className="font-medium">{job.name}</h5>
                          <p className="text-sm text-gray-500">
                            {job.processedLots} / {job.totalLots} lots processed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(job.status)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {job.status === 'running' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(job.progress)}%</span>
                        </div>
                        <Progress value={job.progress} className="w-full" />
                      </div>
                    )}

                    {/* Job Results */}
                    {job.status === 'completed' && job.results && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Success Rate</p>
                          <p className="text-lg font-semibold text-green-600">
                            {((job.results.successCount / job.totalLots) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Total Wafers</p>
                          <p className="text-lg font-semibold">{job.results.totalWafers}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Avg Yield</p>
                          <p className="text-lg font-semibold">{job.results.averageYield.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Duration</p>
                          <p className="text-lg font-semibold">
                            {job.startTime && job.endTime ? 
                              `${Math.round((job.endTime.getTime() - job.startTime.getTime()) / 1000)}s` : 
                              'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Job Controls */}
                    <div className="flex items-center space-x-2">
                      {job.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => startBatchJob(job.id)}
                          disabled={isProcessing}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}
                      
                      {job.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseBatchJob(job.id)}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      
                      {job.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteBatchJob(job.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={job.status === 'running'}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No batch jobs in queue</p>
              </div>
            )}
          </div>

          {/* Queue Summary */}
          {jobs.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Queue Summary</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Jobs</p>
                  <p className="font-semibold">{jobs.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Running</p>
                  <p className="font-semibold">{jobs.filter(j => j.status === 'running').length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Completed</p>
                  <p className="font-semibold">{jobs.filter(j => j.status === 'completed').length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Pending</p>
                  <p className="font-semibold">{jobs.filter(j => j.status === 'pending').length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
