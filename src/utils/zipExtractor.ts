
import JSZip from 'jszip';

export const extractZipFiles = async (zipFile: File): Promise<File[]> => {
  const zip = new JSZip();
  const zipData = await zip.loadAsync(zipFile);
  const extractedFiles: File[] = [];
  
  for (const [filename, fileData] of Object.entries(zipData.files)) {
    if (!fileData.dir) {
      // Check if it's a supported file type
      if (filename.match(/\.\d{2}$/) || 
          filename.match(/\.f\d{2}$/) || // Second foundry format
          filename.endsWith('.FAR') || 
          filename.endsWith('.lotSumTXT') || 
          filename.includes('lotSum') ||
          filename.endsWith('.stdf') ||
          filename.endsWith('.csv') ||
          filename.endsWith('.txt')) {
        
        const blob = await fileData.async('blob');
        const file = new File([blob], filename, { type: 'application/octet-stream' });
        extractedFiles.push(file);
      }
    }
  }
  
  return extractedFiles;
};
