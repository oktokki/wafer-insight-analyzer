
export interface LotSummaryHeader {
  lotNumber: string;
  device: string;
  testProgram: string;
  testerType: string;
  startTime: string;
  endTime: string;
  totalWafers: number;
  totalDies: number;
  yieldPercent: number;
}

export interface TestModeData {
  mode: string; // P1, R1, R2, etc.
  binData: { [key: string]: number };
  totalCount: number;
  yieldCount: number;
  yieldPercent: number;
}

export interface WaferSummary {
  waferNumber: number;
  waferId: string;
  totalDies: number;
  passDies: number;
  failDies: number;
  yieldPercent: number;
  testModes: TestModeData[];
}

export interface ParsedLotSummary {
  header: LotSummaryHeader;
  waferSummaries: WaferSummary[];
  overallStats: {
    totalWafers: number;
    totalDies: number;
    totalPass: number;
    totalFail: number;
    overallYield: number;
  };
  testModes: string[];
}

export class LotSummaryParser {
  static parseLotSummaryFile(content: string): ParsedLotSummary {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    const header: Partial<LotSummaryHeader> = {};
    const waferSummaries: WaferSummary[] = [];
    const testModes: string[] = [];
    
    let currentSection = 'header';
    let headerEndIndex = 0;
    
    // Parse header section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('Lot Number:') || line.includes('LOT_NO:')) {
        header.lotNumber = this.extractValue(line);
      } else if (line.includes('Device:') || line.includes('DEVICE:')) {
        header.device = this.extractValue(line);
      } else if (line.includes('Test Program:') || line.includes('PROGRAM:')) {
        header.testProgram = this.extractValue(line);
      } else if (line.includes('Tester:') || line.includes('TESTER:')) {
        header.testerType = this.extractValue(line);
      } else if (line.includes('Start Time:') || line.includes('START_TIME:')) {
        header.startTime = this.extractValue(line);
      } else if (line.includes('End Time:') || line.includes('END_TIME:')) {
        header.endTime = this.extractValue(line);
      } else if (line.includes('Total Wafers:') || line.includes('WAFER_COUNT:')) {
        header.totalWafers = parseInt(this.extractValue(line)) || 0;
      } else if (line.includes('WAFER') && line.includes('DIES') && line.includes('YIELD')) {
        // Found start of wafer data table
        headerEndIndex = i;
        currentSection = 'waferData';
        break;
      }
    }
    
    // Parse wafer data section
    if (currentSection === 'waferData') {
      for (let i = headerEndIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip separator lines and empty lines
        if (line.match(/^[-=\s]+$/) || !line) continue;
        
        // Stop at summary section
        if (line.includes('SUMMARY') || line.includes('Total:') || line.includes('Overall:')) {
          break;
        }
        
        // Parse wafer data line
        const waferData = this.parseWaferLine(line);
        if (waferData) {
          waferSummaries.push(waferData);
        }
      }
    }
    
    // Calculate overall statistics
    const overallStats = this.calculateOverallStats(waferSummaries);
    
    // Extract test modes from wafer data
    const uniqueTestModes = new Set<string>();
    waferSummaries.forEach(wafer => {
      wafer.testModes.forEach(mode => uniqueTestModes.add(mode.mode));
    });
    testModes.push(...Array.from(uniqueTestModes));
    
    return {
      header: header as LotSummaryHeader,
      waferSummaries,
      overallStats,
      testModes
    };
  }
  
  private static extractValue(line: string): string {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      return line.substring(colonIndex + 1).trim();
    }
    
    const spaceIndex = line.indexOf(' ');
    if (spaceIndex !== -1) {
      return line.substring(spaceIndex + 1).trim();
    }
    
    return '';
  }
  
  private static parseWaferLine(line: string): WaferSummary | null {
    // Handle different formats of wafer data lines
    const parts = line.split(/\s+/).filter(part => part);
    
    if (parts.length < 4) return null;
    
    try {
      const waferNumber = parseInt(parts[0]) || 0;
      const waferId = parts[1] || `W${waferNumber}`;
      const totalDies = parseInt(parts[2]) || 0;
      const passDies = parseInt(parts[3]) || 0;
      const failDies = totalDies - passDies;
      const yieldPercent = totalDies > 0 ? (passDies / totalDies) * 100 : 0;
      
      // Create default test mode data
      const testModes: TestModeData[] = [{
        mode: 'P1',
        binData: { '1': passDies, '2': failDies },
        totalCount: totalDies,
        yieldCount: passDies,
        yieldPercent
      }];
      
      return {
        waferNumber,
        waferId,
        totalDies,
        passDies,
        failDies,
        yieldPercent,
        testModes
      };
    } catch (error) {
      console.warn('Failed to parse wafer line:', line, error);
      return null;
    }
  }
  
  private static calculateOverallStats(waferSummaries: WaferSummary[]) {
    const totalWafers = waferSummaries.length;
    const totalDies = waferSummaries.reduce((sum, wafer) => sum + wafer.totalDies, 0);
    const totalPass = waferSummaries.reduce((sum, wafer) => sum + wafer.passDies, 0);
    const totalFail = waferSummaries.reduce((sum, wafer) => sum + wafer.failDies, 0);
    const overallYield = totalDies > 0 ? (totalPass / totalDies) * 100 : 0;
    
    return {
      totalWafers,
      totalDies,
      totalPass,
      totalFail,
      overallYield
    };
  }
}
