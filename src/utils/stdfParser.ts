export interface StdfHeader {
  fileVersion: string;
  lotId: string;
  sublotId?: string;
  waferId?: string;
  partType: string;
  nodeName: string;
  testerType: string;
  jobName: string;
  operatorName?: string;
  startTime: Date;
  endTime?: Date;
}

export interface TestResult {
  testNumber: number;
  testName: string;
  testType: string;
  units?: string;
  lowLimit?: number;
  highLimit?: number;
  result: number;
  passFail: 'P' | 'F';
}

export interface PartResult {
  partId: number;
  xCoordinate?: number;
  yCoordinate?: number;
  hardBin: number;
  softBin: number;
  testResults: TestResult[];
  testTime: number;
}

export interface ParsedStdfData {
  header: StdfHeader;
  parts: PartResult[];
  testSummary: {
    totalParts: number;
    passParts: number;
    failParts: number;
    yieldPercentage: number;
    testNames: string[];
  };
  binSummary: {
    hardBins: { [bin: number]: number };
    softBins: { [bin: number]: number };
  };
}

export class StdfParser {
  static async parseStdfFile(file: File): Promise<ParsedStdfData> {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    
    // Initialize parsing state
    let offset = 0;
    const header: Partial<StdfHeader> = {};
    const parts: PartResult[] = [];
    const testNames: string[] = [];
    const hardBins: { [bin: number]: number } = {};
    const softBins: { [bin: number]: number } = {};
    
    try {
      // Parse STDF records
      while (offset < buffer.byteLength - 4) {
        const recordLength = view.getUint16(offset, true);
        const recordType = view.getUint8(offset + 2);
        const recordSubType = view.getUint8(offset + 3);
        
        offset += 4;
        
        if (offset + recordLength > buffer.byteLength) break;
        
        // Parse different record types
        switch (recordType) {
          case 0: // File Information Records
            if (recordSubType === 10) { // FAR - File Attributes Record
              header.fileVersion = this.readString(view, offset, 2);
            }
            break;
            
          case 1: // Master Information Records
            if (recordSubType === 10) { // MIR - Master Information Record
              offset = this.parseMasterInfo(view, offset, header);
              continue;
            } else if (recordSubType === 20) { // MRR - Master Results Record
              header.endTime = this.readDateTime(view, offset);
            }
            break;
            
          case 2: // Part Information Records
            if (recordSubType === 10) { // PIR - Part Information Record
              // Skip PIR for now
            } else if (recordSubType === 20) { // PRR - Part Results Record
              const partResult = this.parsePartResult(view, offset);
              parts.push(partResult);
              
              // Update bin counts
              hardBins[partResult.hardBin] = (hardBins[partResult.hardBin] || 0) + 1;
              softBins[partResult.softBin] = (softBins[partResult.softBin] || 0) + 1;
            }
            break;
            
          case 15: // Test Synopsis Records
            if (recordSubType === 10) { // TSR - Test Synopsis Record
              const testName = this.readString(view, offset + 4, 40);
              if (testName && !testNames.includes(testName)) {
                testNames.push(testName);
              }
            }
            break;
        }
        
        offset += recordLength;
      }
    } catch (error) {
      console.error('Error parsing STDF file:', error);
      // Continue with partial data
    }
    
    // Calculate summary statistics
    const totalParts = parts.length;
    const passParts = parts.filter(p => p.hardBin === 1).length;
    const failParts = totalParts - passParts;
    const yieldPercentage = totalParts > 0 ? (passParts / totalParts) * 100 : 0;
    
    return {
      header: {
        fileVersion: header.fileVersion || '4.0',
        lotId: header.lotId || 'Unknown',
        sublotId: header.sublotId,
        waferId: header.waferId,
        partType: header.partType || 'Unknown',
        nodeName: header.nodeName || 'Unknown',
        testerType: header.testerType || 'Unknown',
        jobName: header.jobName || 'Unknown',
        operatorName: header.operatorName,
        startTime: header.startTime || new Date(),
        endTime: header.endTime
      },
      parts,
      testSummary: {
        totalParts,
        passParts,
        failParts,
        yieldPercentage,
        testNames
      },
      binSummary: {
        hardBins,
        softBins
      }
    };
  }
  
  private static parseMasterInfo(view: DataView, offset: number, header: Partial<StdfHeader>): number {
    let pos = offset;
    
    // Skip setup time
    pos += 4;
    
    // Start time
    header.startTime = this.readDateTime(view, pos);
    pos += 4;
    
    // Station number
    pos += 1;
    
    // Mode code
    pos += 1;
    
    // Retry code
    pos += 1;
    
    // Protection code
    pos += 1;
    
    // Burn-in time
    pos += 2;
    
    // Command mode code
    pos += 1;
    
    // Lot ID
    const lotIdLength = view.getUint8(pos);
    pos += 1;
    header.lotId = this.readString(view, pos, lotIdLength);
    pos += lotIdLength;
    
    // Part type
    const partTypeLength = view.getUint8(pos);
    pos += 1;
    header.partType = this.readString(view, pos, partTypeLength);
    pos += partTypeLength;
    
    return pos;
  }
  
  private static parsePartResult(view: DataView, offset: number): PartResult {
    let pos = offset;
    
    // Head number
    pos += 1;
    
    // Site number
    pos += 1;
    
    // Part flag
    pos += 1;
    
    // Number of tests
    const numTests = view.getUint16(pos, true);
    pos += 2;
    
    // Hard bin
    const hardBin = view.getUint16(pos, true);
    pos += 2;
    
    // Soft bin
    const softBin = view.getUint16(pos, true);
    pos += 2;
    
    // X coordinate
    const xCoordinate = view.getInt16(pos, true);
    pos += 2;
    
    // Y coordinate  
    const yCoordinate = view.getInt16(pos, true);
    pos += 2;
    
    // Test time
    const testTime = view.getUint32(pos, true);
    pos += 4;
    
    // Part ID
    const partIdLength = view.getUint8(pos);
    pos += 1;
    const partId = partIdLength > 0 ? parseInt(this.readString(view, pos, partIdLength)) || 0 : 0;
    
    return {
      partId,
      xCoordinate: xCoordinate !== -32768 ? xCoordinate : undefined,
      yCoordinate: yCoordinate !== -32768 ? yCoordinate : undefined,
      hardBin,
      softBin,
      testResults: [], // Simplified - would need PTR records for full test results
      testTime
    };
  }
  
  private static readString(view: DataView, offset: number, length: number): string {
    const bytes = new Uint8Array(view.buffer, offset, length);
    return new TextDecoder().decode(bytes).replace(/\0/g, '').trim();
  }
  
  private static readDateTime(view: DataView, offset: number): Date {
    const timestamp = view.getUint32(offset, true);
    return new Date(timestamp * 1000);
  }
}
