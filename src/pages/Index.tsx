import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlayCircle, Download, Zap, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroBackground from "@/assets/hero-bg.jpg";

const Index = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const isValidYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const handleConvert = () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube URL to convert.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    // Extract the part after https:// to create the path
    const urlPath = url.replace(/^https?:\/\//, "");
    navigate(`/${urlPath}`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-12 px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-youtube via-primary to-youtube bg-clip-text text-transparent">
            YT2MP3
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Convert YouTube videos to MP3 files with high quality audio output
          </p>
        </header>

        {/* Main Converter */}
        <main className="px-4 pb-12">
          <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50 shadow-elegant">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Convert YouTube to MP3</CardTitle>
              <CardDescription>
                Enter a YouTube URL and we'll convert it to MP3 format
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-4 pr-4 py-3 text-base bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && handleConvert()}
                  />
                </div>
                
                <Button 
                  onClick={handleConvert}
                  disabled={!url.trim()}
                  className="w-full bg-gradient-to-r from-youtube to-primary hover:from-youtube/90 hover:to-primary/90 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-glow"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Convert to MP3
                </Button>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-4 pt-8 border-t border-border/30">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-youtube/20 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">Quick conversion process</p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-youtube/20 rounded-full flex items-center justify-center mx-auto">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">High Quality</h3>
                  <p className="text-sm text-muted-foreground">320kbps MP3 audio</p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-youtube/20 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Safe & Secure</h3>
                  <p className="text-sm text-muted-foreground">No data stored</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 px-4 border-t border-border/30">
          <p className="text-sm text-muted-foreground">
            Fast, free, and secure YouTube to MP3 conversion
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
