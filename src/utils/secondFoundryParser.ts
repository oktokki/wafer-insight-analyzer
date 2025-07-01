
export interface SecondFoundryHeader {
  device: string;
  waferId: string;
  x: number;
  y: number;
  good: number;
  fail: number;
  flat?: number;
}

export interface SecondFoundryMapData {
  header: SecondFoundryHeader;
  coordinateMap: string[][];
  binCounts: { [key: string]: number };
  yield: number;
}

export class SecondFoundryParser {
  static parseSecondFoundryFile(filename: string, content: string): SecondFoundryMapData {
    const lines = content.split('\n').map(line => line.trim());
    
    // Parse header section
    const header: Partial<SecondFoundryHeader> = {};
    let mapStartIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(part => part.trim());
        
        switch (key.toUpperCase()) {
          case 'DEVICE':
            header.device = value;
            break;
          case 'WAFERID':
            header.waferId = value;
            break;
          case 'X':
            header.x = parseInt(value);
            break;
          case 'Y':
            header.y = parseInt(value);
            break;
          case 'GOOD':
            header.good = parseInt(value);
            break;
          case 'FAIL':
            header.fail = parseInt(value);
            break;
          case 'FLAT':
            header.flat = parseInt(value);
            break;
        }
      } else if (line.match(/^[1X\.\sT]+$/)) {
        // Found start of map body
        mapStartIndex = i;
        break;
      }
    }
    
    // Parse map body
    const coordinateMap: string[][] = [];
    const binCounts: { [key: string]: number } = { '1': 0, 'X': 0, '.': 0 };
    
    for (let i = mapStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 0 && line.match(/^[1X\.\sT]+$/)) {
        const row = line.split('').filter(char => char !== ' ');
        coordinateMap.push(row);
        
        // Count bins
        row.forEach(char => {
          if (binCounts[char] !== undefined) {
            binCounts[char]++;
          } else if (char !== ' ') {
            binCounts[char] = (binCounts[char] || 0) + 1;
          }
        });
      }
    }
    
    // Validate data integrity
    const actualGood = binCounts['1'] || 0;
    const actualFail = binCounts['X'] || 0;
    
    if (actualGood !== header.good) {
      console.warn(`GOOD count mismatch: Header=${header.good}, Actual=${actualGood}`);
    }
    
    if (actualFail !== header.fail) {
      console.warn(`FAIL count mismatch: Header=${header.fail}, Actual=${actualFail}`);
    }
    
    // Calculate yield
    const totalDies = (header.good || 0) + (header.fail || 0);
    const yield = totalDies > 0 ? ((header.good || 0) / totalDies) * 100 : 0;
    
    return {
      header: header as SecondFoundryHeader,
      coordinateMap,
      binCounts,
      yield
    };
  }
  
  static async parseSecondFoundryFiles(files: File[]): Promise<SecondFoundryMapData[]> {
    const results: SecondFoundryMapData[] = [];
    
    for (const file of files) {
      const content = await file.text();
      const waferData = this.parseSecondFoundryFile(file.name, content);
      results.push(waferData);
    }
    
    // Sort by file extension number (.f01, .f02, etc.)
    results.sort((a, b) => {
      const aNum = parseInt(a.header.waferId.split('-').pop() || '0');
      const bNum = parseInt(b.header.waferId.split('-').pop() || '0');
      return aNum - bNum;
    });
    
    return results;
  }
}
