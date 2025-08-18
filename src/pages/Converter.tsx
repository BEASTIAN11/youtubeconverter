import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Converter = () => {
  const { "*": urlPath } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  // Extract YouTube URL from path
  const youtubeUrl = urlPath ? `https://${urlPath}` : "";
  const fileName = urlPath?.replace(/^(www\.)?youtube\.com\/watch\?v=/, "") || "video";

  useEffect(() => {
    if (!youtubeUrl || !isValidYouTubeUrl(youtubeUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid YouTube URL in the path.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    simulateConversion();
  }, [youtubeUrl, navigate, toast]);

  const isValidYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const simulateConversion = async () => {
    setIsConverting(true);
    setProgress(0);

    // Simulate conversion progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsConverting(false);
    setIsComplete(true);

    // Update URL to show .mp3 extension
    const mp3Path = `/${fileName}.mp3`;
    window.history.replaceState(null, "", mp3Path);

    toast({
      title: "Conversion Complete!",
      description: "Your MP3 file is ready for download.",
    });
  };

  const handleDownload = () => {
    // Create a dummy blob for download simulation
    const blob = new Blob([""], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

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
            {isComplete ? "Your MP3 is ready" : "Processing your YouTube video"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground break-all">
            <strong>Source:</strong> {youtubeUrl}
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