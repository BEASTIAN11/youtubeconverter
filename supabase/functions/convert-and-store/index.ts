import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConvertRequest {
  youtubeUrl: string;
  fileName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { youtubeUrl, fileName }: ConvertRequest = await req.json();
    
    console.log('Converting YouTube URL:', youtubeUrl);
    console.log('File name:', fileName);

    // Simulate MP3 conversion process
    const mp3Data = await simulateMP3Conversion(fileName);
    
    // Upload to GitHub
    const githubUrl = await uploadToGitHub(fileName, mp3Data);
    
    return new Response(JSON.stringify({ 
      success: true, 
      downloadUrl: githubUrl,
      fileName: fileName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in convert-and-store function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function simulateMP3Conversion(title: string): Promise<Uint8Array> {
  // Simulate conversion delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create a simple MP3-like file (just dummy data for simulation)
  const dummyMP3Header = new Uint8Array([
    0xFF, 0xFB, 0x90, 0x00, // MP3 header
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  
  // Add some dummy audio data
  const audioData = new Uint8Array(1024 * 50); // 50KB of dummy data
  for (let i = 0; i < audioData.length; i++) {
    audioData[i] = Math.floor(Math.random() * 256);
  }
  
  // Combine header and data
  const mp3File = new Uint8Array(dummyMP3Header.length + audioData.length);
  mp3File.set(dummyMP3Header);
  mp3File.set(audioData, dummyMP3Header.length);
  
  return mp3File;
}

async function uploadToGitHub(fileName: string, mp3Data: Uint8Array): Promise<string> {
  const githubToken = Deno.env.get('GITHUB_TOKEN');
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  // GitHub repository details (you can modify these)
  const owner = 'your-username'; // Replace with actual GitHub username
  const repo = 'youtube-mp3-storage'; // Replace with actual repo name
  const path = `mp3/${fileName}`;

  // Convert binary data to base64
  const base64Content = btoa(String.fromCharCode(...mp3Data));

  const uploadData = {
    message: `Add MP3 file: ${fileName}`,
    content: base64Content,
    branch: 'main'
  };

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'YouTube-MP3-Converter'
      },
      body: JSON.stringify(uploadData)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('GitHub upload error:', error);
    throw new Error(`GitHub upload failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  
  // Return the raw GitHub URL that Garry's Mod can access
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
}