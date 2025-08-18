// Utility for managing MP3 file storage and cleanup

interface StoredFile {
  fileName: string;
  timestamp: number;
  filePath: string;
}

// In-memory storage for tracking files (in production, use a database)
const storedFiles = new Map<string, StoredFile>();

export const storeMP3File = async (fileName: string, audioData: Blob): Promise<string> => {
  const timestamp = Date.now();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fullFileName = `${cleanFileName}_${timestamp}.mp3`;
  const filePath = `/mp3/${fullFileName}`;
  
  // Create a real MP3 file (simplified - in reality you'd convert the audio)
  const mp3Data = generateSimpleMP3(fileName);
  
  // Store file info for cleanup
  storedFiles.set(fullFileName, {
    fileName: fullFileName,
    timestamp,
    filePath
  });
  
  // Schedule cleanup after 10 minutes
  setTimeout(() => {
    cleanupFile(fullFileName);
  }, 10 * 60 * 1000); // 10 minutes
  
  // Save to public folder (simulated)
  saveFileToPublic(fullFileName, mp3Data);
  
  return window.location.origin + filePath;
};

const generateSimpleMP3 = (title: string): Blob => {
  // Generate a simple audio file (in reality, this would be actual conversion)
  // For now, create a minimal MP3-like blob
  const audioData = new Uint8Array(1024).fill(0);
  return new Blob([audioData], { type: 'audio/mpeg' });
};

const saveFileToPublic = (fileName: string, data: Blob) => {
  // In a real implementation, this would save to the server
  // For demo purposes, we'll simulate this
  console.log(`Saving ${fileName} to public/mp3/`);
};

const cleanupFile = (fileName: string) => {
  const fileInfo = storedFiles.get(fileName);
  if (fileInfo) {
    console.log(`Cleaning up ${fileName} after 10 minutes`);
    storedFiles.delete(fileName);
    // In production, actually delete the file from the filesystem
  }
};

export const getFileUrl = (fileName: string): string | null => {
  const fileInfo = storedFiles.get(fileName);
  if (fileInfo) {
    return window.location.origin + fileInfo.filePath;
  }
  return null;
};