
export interface WaferMapHeader {
  device: string;
  lotNo: string;
  slotNo: number;
  waferId: string;
  waferSize?: string;
  flatDir?: string;
  totalTestDie: number;
  passDie: number;
  failDie: number;
  yield: number;
}

export interface WaferMapData {
  header: WaferMapHeader;
  coordinateMap: string[][];
  binCounts: { [key: string]: number };
}

export interface FarSummary {
  title: string;
  device: string;
  lotNo: string;
  totalWafer: number;
  waferMappings: Array<{
    mapping: string;
    waferId: string;
    bin1Count: number;
  }>;
}

export interface ParsedEdsData {
  waferMaps: WaferMapData[];
  farSummary?: FarSummary;
  validationResults: {
    waferCountMatch: boolean;
    bin1CountMatch: boolean;
    issues: string[];
  };
}

export class EdsMapParser {
  static parseWaferMapFile(filename: string, content: string): WaferMapData {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    // Parse header section
    const header: Partial<WaferMapHeader> = {};
    let bodyStartIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('Device')) {
        header.device = line.split(':')[1]?.trim() || '';
      } else if (line.includes('Lot NO')) {
        header.lotNo = line.split(':')[1]?.trim() || '';
      } else if (line.includes('Slot No')) {
        header.slotNo = parseInt(line.split(':')[1]?.trim() || '0');
      } else if (line.includes('Wafer ID')) {
        header.waferId = line.split(':')[1]?.trim() || '';
      } else if (line.includes('Wafer Size')) {
        header.waferSize = line.split(':')[1]?.trim() || '';
      } else if (line.includes('Flat Dir')) {
        header.flatDir = line.split(':')[1]?.trim() || '';
      } else if (line.includes('Total test die')) {
        header.totalTestDie = parseInt(line.split(':')[1]?.trim() || '0');
      } else if (line.includes('Pass Die')) {
        header.passDie = parseInt(line.split(':')[1]?.trim() || '0');
      } else if (line.includes('Fail Die')) {
        header.failDie = parseInt(line.split(':')[1]?.trim() || '0');
      } else if (line.includes('Yield')) {
        const yieldStr = line.split(':')[1]?.trim().replace('%', '') || '0';
        header.yield = parseFloat(yieldStr);
      } else if (line.match(/^[1X\.\s]+$/)) {
        // Found start of coordinate map
        bodyStartIndex = i;
        break;
      }
    }
    
    // Parse coordinate map body
    const coordinateMap: string[][] = [];
    const binCounts: { [key: string]: number } = { '1': 0, 'X': 0, '.': 0 };
    
    for (let i = bodyStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^[1X\.\s]+$/)) {
        const row = line.split('').filter(char => char !== ' ');
        coordinateMap.push(row);
        
        // Count bins
        row.forEach(char => {
          if (binCounts[char] !== undefined) {
            binCounts[char]++;
          }
        });
      }
    }
    
    return {
      header: header as WaferMapHeader,
      coordinateMap,
      binCounts
    };
  }
  
  static parseFarFile(content: string): FarSummary {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    const summary: Partial<FarSummary> = {
      waferMappings: []
    };
    
    let inTableSection = false;
    
    for (const line of lines) {
      if (line.includes('FARADAY')) {
        summary.title = 'FARADAY';
      } else if (line.includes('Device')) {
        summary.device = line.split(':')[1]?.trim() || '';
      } else if (line.includes('Lot NO')) {
        summary.lotNo = line.split(':')[1]?.trim() || '';
      } else if (line.includes('Total wafer')) {
        summary.totalWafer = parseInt(line.split(':')[1]?.trim() || '0');
      } else if (line.includes('MAPPING') && line.includes('WAFER_ID') && line.includes('BIN')) {
        inTableSection = true;
        continue;
      } else if (inTableSection && line.includes('\t')) {
        // Parse table row
        const parts = line.split('\t').map(p => p.trim());
        if (parts.length >= 3) {
          summary.waferMappings!.push({
            mapping: parts[0],
            waferId: parts[1],
            bin1Count: parseInt(parts[2]) || 0
          });
        }
      }
    }
    
    return summary as FarSummary;
  }
  
  static validateData(waferMaps: WaferMapData[], farSummary?: FarSummary): ParsedEdsData['validationResults'] {
    const issues: string[] = [];
    let waferCountMatch = true;
    let bin1CountMatch = true;
    
    if (farSummary) {
      // Check wafer count
      if (farSummary.totalWafer !== waferMaps.length) {
        waferCountMatch = false;
        issues.push(`Wafer count mismatch: FAR reports ${farSummary.totalWafer}, found ${waferMaps.length} map files`);
      }
      
      // Check BIN1 counts
      const totalFarBin1 = farSummary.waferMappings.reduce((sum, mapping) => sum + mapping.bin1Count, 0);
      const totalMapBin1 = waferMaps.reduce((sum, wafer) => sum + wafer.header.passDie, 0);
      
      if (totalFarBin1 !== totalMapBin1) {
        bin1CountMatch = false;
        issues.push(`BIN1 count mismatch: FAR total ${totalFarBin1}, Map total ${totalMapBin1}`);
      }
      
      // Check individual wafer IDs
      for (const mapping of farSummary.waferMappings) {
        const matchingWafer = waferMaps.find(w => w.header.waferId === mapping.waferId);
        if (!matchingWafer) {
          issues.push(`Wafer ID ${mapping.waferId} in FAR not found in map files`);
        } else if (matchingWafer.header.passDie !== mapping.bin1Count) {
          issues.push(`BIN1 mismatch for ${mapping.waferId}: FAR=${mapping.bin1Count}, Map=${matchingWafer.header.passDie}`);
        }
      }
    }
    
    return {
      waferCountMatch,
      bin1CountMatch,
      issues
    };
  }
  
  static async parseEdsFiles(files: File[]): Promise<ParsedEdsData> {
    const waferMaps: WaferMapData[] = [];
    let farSummary: FarSummary | undefined;
    
    for (const file of files) {
      const content = await file.text();
      
      if (file.name.endsWith('.FAR')) {
        farSummary = this.parseFarFile(content);
      } else if (file.name.match(/\.\d{2}$/)) {
        // Individual wafer map file (.01, .02, etc.)
        const waferData = this.parseWaferMapFile(file.name, content);
        waferMaps.push(waferData);
      }
    }
    
    // Sort wafer maps by slot number
    waferMaps.sort((a, b) => a.header.slotNo - b.header.slotNo);
    
    const validationResults = this.validateData(waferMaps, farSummary);
    
    return {
      waferMaps,
      farSummary,
      validationResults
    };
  }
}
