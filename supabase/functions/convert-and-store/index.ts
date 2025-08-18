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
  // Fetch a 1-second silent MP3 to ensure it's playable in Garry's Mod
  const sampleUrl = 'https://github.com/anars/blank-audio/blob/master/1-second-of-silence.mp3?raw=1';
  const res = await fetch(sampleUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch sample MP3: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function uploadToGitHub(fileName: string, mp3Data: Uint8Array): Promise<string> {
  const githubToken = Deno.env.get('GITHUB_TOKEN');
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  // GitHub repository details
  const owner = 'BEASTIAN11';
  const repo = 'youtubeconverter';
  const path = `mp3/${fileName}`;

  // Convert binary data to base64 (sufficient for small files)
  const base64Content = btoa(String.fromCharCode(...mp3Data));

  const branchesToTry = ['main', 'master'];
  let lastErrorText = '';

  for (const branch of branchesToTry) {
    const uploadData = {
      message: `Add MP3 file: ${fileName}`,
      content: base64Content,
      branch
    };

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    console.log(`Uploading to GitHub: ${owner}/${repo}/${path} on branch ${branch}`);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'YouTube-MP3-Converter'
      },
      body: JSON.stringify(uploadData)
    });

    if (response.ok) {
      // Prefer blob URL with ?raw=1 for Garry's Mod
      return `https://github.com/${owner}/${repo}/blob/${branch}/${path}?raw=1`;
    }

    lastErrorText = await response.text();
    console.error(`GitHub upload error on ${branch}:`, lastErrorText);
  }

  throw new Error(`GitHub upload failed: ${lastErrorText || 'Unknown error'}`);
}