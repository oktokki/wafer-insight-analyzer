
import { ParsedStdfData } from './stdfParser';

export const combineStdfResults = (results: ParsedStdfData[]): ParsedStdfData => {
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
