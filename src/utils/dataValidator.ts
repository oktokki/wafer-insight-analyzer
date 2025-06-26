
export interface ValidationResult {
  isValid: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export interface DataIntegrityReport {
  overallStatus: 'pass' | 'warning' | 'fail';
  waferCountValidation: ValidationResult;
  bin1CountValidation: ValidationResult;
  lotSummaryValidation: ValidationResult;
  crossFileValidation: ValidationResult[];
  individualWaferValidation: ValidationResult[];
  recommendations: string[];
}

export class DataValidator {
  static generateIntegrityReport(
    waferMaps: any[],
    farSummary?: any,
    lotSummary?: any
  ): DataIntegrityReport {
    const report: DataIntegrityReport = {
      overallStatus: 'pass',
      waferCountValidation: { isValid: true, severity: 'info', message: 'No validation performed' },
      bin1CountValidation: { isValid: true, severity: 'info', message: 'No validation performed' },
      lotSummaryValidation: { isValid: true, severity: 'info', message: 'No validation performed' },
      crossFileValidation: [],
      individualWaferValidation: [],
      recommendations: []
    };

    // Wafer count validation
    if (farSummary) {
      if (farSummary.totalWafer === waferMaps.length) {
        report.waferCountValidation = {
          isValid: true,
          severity: 'info',
          message: `Wafer count matches: ${waferMaps.length} wafers`
        };
      } else {
        report.waferCountValidation = {
          isValid: false,
          severity: 'error',
          message: `Wafer count mismatch: FAR reports ${farSummary.totalWafer}, found ${waferMaps.length} map files`,
          details: 'This indicates missing wafer map files or incorrect FAR data'
        };
        report.overallStatus = 'fail';
        report.recommendations.push('Check for missing wafer map files or verify FAR file accuracy');
      }
    }

    // BIN1 count validation
    if (farSummary && waferMaps.length > 0) {
      const totalFarBin1 = farSummary.waferMappings.reduce((sum: number, mapping: any) => sum + mapping.bin1Count, 0);
      const totalMapBin1 = waferMaps.reduce((sum, wafer) => sum + wafer.header.passDie, 0);
      
      if (totalFarBin1 === totalMapBin1) {
        report.bin1CountValidation = {
          isValid: true,
          severity: 'info',
          message: `BIN1 counts match: ${totalMapBin1} total pass dies`
        };
      } else {
        const variance = Math.abs(totalFarBin1 - totalMapBin1);
        const percentageVariance = (variance / Math.max(totalFarBin1, totalMapBin1)) * 100;
        
        report.bin1CountValidation = {
          isValid: false,
          severity: percentageVariance > 5 ? 'error' : 'warning',
          message: `BIN1 count mismatch: FAR total ${totalFarBin1}, Map total ${totalMapBin1} (${variance} difference)`,
          details: `Variance: ${percentageVariance.toFixed(2)}%`
        };
        
        if (percentageVariance > 5) {
          report.overallStatus = 'fail';
          report.recommendations.push('Significant BIN1 count variance detected - verify test data integrity');
        } else if (report.overallStatus === 'pass') {
          report.overallStatus = 'warning';
          report.recommendations.push('Minor BIN1 count variance - check for rounding differences');
        }
      }
    }

    // Lot Summary validation
    if (lotSummary && waferMaps.length > 0) {
      const mapTotalDies = waferMaps.reduce((sum, wafer) => sum + wafer.header.totalTestDie, 0);
      const mapTotalPass = waferMaps.reduce((sum, wafer) => sum + wafer.header.passDie, 0);
      
      const lotDiesMatch = Math.abs(lotSummary.overallStats.totalDies - mapTotalDies) <= 1;
      const lotPassMatch = Math.abs(lotSummary.overallStats.totalPass - mapTotalPass) <= 1;
      
      if (lotDiesMatch && lotPassMatch) {
        report.lotSummaryValidation = {
          isValid: true,
          severity: 'info',
          message: 'Lot Summary data matches wafer maps',
          details: `Dies: ${mapTotalDies}, Pass: ${mapTotalPass}`
        };
      } else {
        report.lotSummaryValidation = {
          isValid: false,
          severity: 'warning',
          message: 'Lot Summary data mismatch with wafer maps',
          details: `Map dies: ${mapTotalDies}, Lot dies: ${lotSummary.overallStats.totalDies}; Map pass: ${mapTotalPass}, Lot pass: ${lotSummary.overallStats.totalPass}`
        };
        
        if (report.overallStatus === 'pass') {
          report.overallStatus = 'warning';
        }
        report.recommendations.push('Check lot summary calculation methodology');
      }
    }

    // Cross-file validation
    if (farSummary && waferMaps.length > 0) {
      farSummary.waferMappings.forEach((mapping: any) => {
        const matchingWafer = waferMaps.find(w => w.header.waferId === mapping.waferId);
        
        if (!matchingWafer) {
          report.crossFileValidation.push({
            isValid: false,
            severity: 'error',
            message: `Wafer ${mapping.waferId} in FAR not found in map files`
          });
          report.overallStatus = 'fail';
        } else if (Math.abs(matchingWafer.header.passDie - mapping.bin1Count) > 0) {
          const variance = Math.abs(matchingWafer.header.passDie - mapping.bin1Count);
          report.crossFileValidation.push({
            isValid: false,
            severity: variance > 10 ? 'error' : 'warning',
            message: `BIN1 mismatch for ${mapping.waferId}`,
            details: `FAR: ${mapping.bin1Count}, Map: ${matchingWafer.header.passDie}`
          });
          
          if (variance > 10 && report.overallStatus !== 'fail') {
            report.overallStatus = 'fail';
          } else if (report.overallStatus === 'pass') {
            report.overallStatus = 'warning';
          }
        }
      });
    }

    // Individual wafer validation
    waferMaps.forEach((wafer, index) => {
      const calculatedYield = wafer.header.totalTestDie > 0 
        ? (wafer.header.passDie / wafer.header.totalTestDie) * 100 
        : 0;
      
      const yieldVariance = Math.abs(calculatedYield - wafer.header.yield);
      
      if (yieldVariance > 0.1) {
        report.individualWaferValidation.push({
          isValid: false,
          severity: yieldVariance > 1 ? 'warning' : 'info',
          message: `Yield calculation variance for ${wafer.header.waferId}`,
          details: `Reported: ${wafer.header.yield.toFixed(2)}%, Calculated: ${calculatedYield.toFixed(2)}%`
        });
      }
      
      // Check for suspicious patterns
      if (wafer.header.yield > 99.5) {
        report.individualWaferValidation.push({
          isValid: true,
          severity: 'info',
          message: `Excellent yield for ${wafer.header.waferId}: ${wafer.header.yield.toFixed(2)}%`
        });
      } else if (wafer.header.yield < 70) {
        report.individualWaferValidation.push({
          isValid: false,
          severity: 'warning',
          message: `Low yield detected for ${wafer.header.waferId}: ${wafer.header.yield.toFixed(2)}%`
        });
        
        if (report.overallStatus === 'pass') {
          report.overallStatus = 'warning';
        }
        report.recommendations.push(`Investigate low yield on wafer ${wafer.header.waferId}`);
      }
    });

    // Add general recommendations
    if (report.overallStatus === 'pass' && report.recommendations.length === 0) {
      report.recommendations.push('Data integrity validation passed - all files appear consistent');
    }

    return report;
  }
}
