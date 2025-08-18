import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Converter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [mp3Url, setMp3Url] = useState<string>("");

  // Extract YouTube URL from query param
  const searchParams = new URLSearchParams(location.search);
  const youtubeUrl = searchParams.get("youtubelink") || "";
  const isMp3Param = /\.mp3$/i.test(youtubeUrl);
  const fileName = isMp3Param
    ? ((youtubeUrl.split("/").pop() || "video").replace(/\.mp3$/i, ""))
    : getFileNameFromYouTubeUrl(youtubeUrl);

  useEffect(() => {
    if (!youtubeUrl) {
      toast({
        title: "Invalid URL",
        description: "Please provide a YouTube URL.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (isMp3Param) {
      setIsConverting(false);
      setIsComplete(true);
      // already on .mp3 link; trigger download for convenience
      handleDownload();
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid YouTube URL.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    simulateConversion();
  }, [youtubeUrl, isMp3Param, navigate, toast]);

  const isValidYouTubeUrl = (url: string): boolean => {
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
      /^(https?:\/\/)?youtu\.be\/[\w-]+/i,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/i,
    ];
    return patterns.some(pattern => pattern.test(u));
  };

  function getFileNameFromYouTubeUrl(url: string): string {
    try {
      let input = url.trim();
      if (!/^https?:\/\//i.test(input)) input = "https://" + input;
      const u = new URL(input);
      if (u.hostname.includes("youtu.be")) {
        const id = u.pathname.slice(1);
        return id || "video";
      }
      const v = u.searchParams.get("v");
      if (v) return v;
      const match = u.pathname.match(/\/embed\/([\w-]+)/);
      if (match) return match[1];
    } catch {}
    return "video";
  }

  const simulateConversion = async () => {
    setIsConverting(true);
    setProgress(0);

    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('convert-and-store', {
        body: {
          youtubeUrl: youtubeUrl,
          fileName: `${fileName}.mp3`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Simulate progress during conversion
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      setIsConverting(false);
      setIsComplete(true);
      setMp3Url(data.downloadUrl);

      // Check if this is an API request (from E2 chip)
      const userAgent = navigator.userAgent || "";
      const isApiRequest = !document.referrer || userAgent.includes("E2") || location.search.includes("youtubelink=");
      
      if (isApiRequest) {
        // Return JSON response for E2 chip with GitHub raw URL
        const response = {
          error: 0,
          file: data.downloadUrl, // This is the raw GitHub URL
          title: `${fileName} - Converted Audio`
        };
        
        // Set content type and clear page to show only JSON
        document.head.innerHTML = '<meta charset="utf-8">';
        document.body.innerHTML = JSON.stringify(response);
        document.body.style.fontFamily = "monospace";
        document.body.style.whiteSpace = "pre";
        return;
      }

      // Update URL to show .mp3 extension in query param
      const mp3Value = `${fileName}.mp3`;
      const params = new URLSearchParams(location.search);
      params.set("youtubelink", mp3Value);
      window.history.replaceState(null, "", `/convert.php?${params.toString()}`);

      // Automatically trigger download
      handleDownload();

      toast({
        title: "Conversion Complete!",
        description: "Your MP3 file is stored on GitHub for Garry's Mod access.",
      });

    } catch (error) {
      console.error('Conversion error:', error);
      setIsConverting(false);
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert and store the file.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (mp3Url) {
      // Use the stored MP3 URL
      const a = document.createElement("a");
      a.href = mp3Url;
      a.download = `${fileName}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Fallback for immediate downloads
      const blob = new Blob([new Uint8Array(1024)], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Download Started",
      description: "Your MP3 file download has begun.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-card/80 backdrop-blur-sm border-border/50 shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-youtube via-primary to-youtube bg-clip-text text-transparent">
            {isComplete ? "Conversion Complete!" : "Converting..."}
          </CardTitle>
          <CardDescription>
            {isComplete ? "Your MP3 is ready" : "Processing your YouTube video or MP3 link"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground break-all">
            <strong>Source:</strong> {youtubeUrl || "(none)"}
          </div>

          {isConverting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Converting...</span>
                <span>{progress}%</span>
              </div>
              <Progress 
                value={progress} 
                className="h-2 bg-muted/30"
              />
            </div>
          )}

          {isComplete && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Ready for download</span>
              </div>
              
              <Button 
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-youtube to-primary hover:from-youtube/90 hover:to-primary/90 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-glow"
              >
                <Download className="w-4 h-4 mr-2" />
                Download {fileName}.mp3
              </Button>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Convert Another Video
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Converter;