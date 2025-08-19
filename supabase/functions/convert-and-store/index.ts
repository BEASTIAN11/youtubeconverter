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
    let youtubeUrl = '';
    let requestedFileName = '';

    // Support both POST JSON and GET query params for E2 compatibility
    if (req.method === 'GET') {
      const url = new URL(req.url);
      youtubeUrl = url.searchParams.get('youtubelink') || url.searchParams.get('youtubeUrl') || '';
    } else {
      const body = await req.json().catch(() => ({}));
      youtubeUrl = body.youtubeUrl || body.youtubelink || '';
      requestedFileName = body.fileName || '';
    }

    if (!youtubeUrl) {
      return new Response(JSON.stringify({ error: 1, message: 'Missing youtubeUrl/youtubelink parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract video ID and get actual title
    const videoId = extractYouTubeId(youtubeUrl) || `audio-${Date.now()}`;
    const fileName = requestedFileName || `${videoId}.mp3`;

    console.log('Converting YouTube URL:', youtubeUrl);
    console.log('Target file name:', fileName);

    // Get the actual video title and convert to MP3
    const videoTitle = await getYouTubeTitle(youtubeUrl, videoId);

    // Actually convert YouTube video to MP3
    const mp3Data = await convertYouTubeToMP3(youtubeUrl, videoId);

    // Upload to GitHub and get a RAW URL (best for GMod streaming)
    const githubRawUrl = await uploadToGitHub(fileName, mp3Data);

    const title = videoTitle;

    console.log('Conversion completed successfully:');
    console.log('- GitHub RAW URL:', githubRawUrl);
    console.log('- Video Title:', title);
    console.log('- File Name:', fileName);

    // Return response in the exact format expected by the E2 chip
    const response = {
      // E2 expected fields
      error: 0,
      file: githubRawUrl,
      title,
      // Redundant fields for E2 compatibility
      url: githubRawUrl,
      streamLink: githubRawUrl,
      name: title,
      videoTitle: title,
      // Backward compatibility for existing frontend
      success: true,
      downloadUrl: githubRawUrl,
      fileName,
    };

    console.log('Final response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in convert-and-store function:', error);
    return new Response(JSON.stringify({ 
      error: 1,
      message: error.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Extract YouTube video ID from common URL formats
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '') || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function convertYouTubeToMP3(youtubeUrl: string, videoId: string): Promise<Uint8Array> {
  console.log(`Converting YouTube video ${videoId} to MP3...`);
  
  try {
    // Use the working RapidAPI endpoint with exact headers
    const apiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY') || '';
    
    try {
      console.log(`Converting using RapidAPI: ${apiUrl}`);
      console.log(`Using API Key: ${rapidApiKey ? 'Present' : 'Missing'}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey
        }
      });

      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Raw API Response:', responseText);
        
        try {
          const data = JSON.parse(responseText);
          console.log('Parsed API Response:', data);
          
          // Extract download URL from the API response
          let downloadUrl = data.link || data.url || data.download_url || data.audio_url || data.dlink;
          
          if (downloadUrl) {
            console.log(`Downloading MP3 from: ${downloadUrl}`);
            const mp3Response = await fetch(downloadUrl);
            console.log(`MP3 download response status: ${mp3Response.status}`);
            
            if (mp3Response.ok) {
              const contentType = mp3Response.headers.get('content-type') || '';
              const arrayBuffer = await mp3Response.arrayBuffer();
              const byteLength = arrayBuffer.byteLength;
              
              console.log(`Downloaded ${byteLength} bytes with content-type: ${contentType}`);
              
              // Validate that we actually got audio and not HTML or a tiny placeholder
              if (byteLength >= 10_000) { // Lower threshold for testing
                console.log(`Successfully converted ${byteLength} bytes`);
                return new Uint8Array(arrayBuffer);
              } else {
                console.warn(`Downloaded file too small (${byteLength} bytes) - likely invalid`);
              }
            } else {
              console.warn(`MP3 download failed with status ${mp3Response.status}`);
            }
          } else {
            console.error('No download URL found in API response. Available fields:', Object.keys(data));
          }
        } catch (parseError) {
          console.error('Failed to parse API response as JSON:', parseError);
          console.log('Response was:', responseText);
        }
      } else {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}:`, errorText);
      }
    } catch (fetchError) {
      console.error('API request failed:', fetchError);
    }
    
    // If conversion failed, throw error instead of returning placeholder
    throw new Error('YouTube conversion failed - API did not provide valid audio file');
    
  } catch (error) {
    console.error('YouTube to MP3 conversion failed:', error);
    // Fail loudly so clients don't attempt to play silence
    throw new Error('YouTube conversion failed - no valid audio produced');
  }
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
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Validate MP3 bytes to avoid uploading silence/placeholders
  if (!mp3Data || mp3Data.length < 50_000) {
    throw new Error(`MP3 content too small (${mp3Data?.length ?? 0} bytes) - conversion likely failed`);
  }

  // Safe base64 conversion for arbitrary-size Uint8Array
  const base64Content = toBase64(mp3Data);

  const branchesToTry = ['main', 'master'];
  let lastErrorText = '';

  for (const branch of branchesToTry) {
    try {
      // Check if file exists to get the SHA (required for updates)
      let existingSha: string | undefined = undefined;
      const getRes = await fetch(`${baseUrl}?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'YouTube-MP3-Converter'
        }
      });

      if (getRes.ok) {
        const json = await getRes.json();
        existingSha = json.sha;
        console.log(`Existing file found on ${branch}, sha=${existingSha}`);
      } else if (getRes.status === 404) {
        console.log(`File does not exist on ${branch}, will create new file`);
      } else {
        const txt = await getRes.text();
        console.warn(`Unable to check existing file on ${branch}: ${txt}`);
      }

      const uploadData: Record<string, unknown> = {
        message: `${existingSha ? 'Update' : 'Add'} MP3 file: ${fileName}`,
        content: base64Content,
        branch,
      };
      if (existingSha) uploadData.sha = existingSha;

      console.log(`Uploading to GitHub: ${owner}/${repo}/${path} on branch ${branch}`);
      const putRes = await fetch(baseUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'YouTube-MP3-Converter'
        },
        body: JSON.stringify(uploadData)
      });

      if (putRes.ok) {
        // Return the GitHub URL format expected by E2 chip
        return `https://github.com/${owner}/${repo}/blob/${branch}/${path}?raw=true`;
      }

      lastErrorText = await putRes.text();
      console.error(`GitHub upload error on ${branch}:`, lastErrorText);
    } catch (e) {
      lastErrorText = (e as Error)?.message || String(e);
      console.error(`GitHub upload exception on ${branch}:`, lastErrorText);
    }
  }

  throw new Error(`GitHub upload failed: ${lastErrorText || 'Unknown error'}`);
}

async function getYouTubeTitle(url: string, videoId: string): Promise<string> {
  try {
    // Try to fetch the YouTube page and extract the title
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      // Extract title from the page HTML
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        let title = titleMatch[1].replace(' - YouTube', '').trim();
        // Clean up any unwanted characters for filename safety
        title = title.replace(/[<>:"/\\|?*]/g, '').substring(0, 100);
        return title || `${videoId} - Converted Audio`;
      }
    }
  } catch (error) {
    console.log('Failed to fetch YouTube title:', error);
  }
  
  // Fallback to video ID if title extraction fails
  return `${videoId} - Converted Audio`;
}

function toBase64(data: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks to avoid call stack limits
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  // deno-lint-ignore no-deprecated-deno-api
  return btoa(binary);
}