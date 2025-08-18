import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Download, Youtube, Music, Check, AlertCircle } from "lucide-react";

interface ConversionState {
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  downloadUrl?: string;
  filename?: string;
}

const ConverterForm = () => {
  const [url, setUrl] = useState("");
  const [conversion, setConversion] = useState<ConversionState>({
    status: 'idle',
    progress: 0
  });

  const isValidYouTubeUrl = (url: string) => {
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const simulateConversion = async () => {
    setConversion({ status: 'converting', progress: 0 });
    
    // Simulate conversion progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setConversion(prev => ({ ...prev, progress: i }));
    }
    
    // Simulate completion
    setConversion({
      status: 'completed',
      progress: 100,
      downloadUrl: '#',
      filename: 'converted-audio.mp3'
    });
    
    toast({
      title: "Conversion Complete!",
      description: "Your MP3 file is ready for download.",
    });
  };

  const handleConvert = async () => {
    if (!url.trim()) {
      toast({
        variant: "destructive",
        title: "URL Required",
        description: "Please enter a YouTube URL to convert.",
      });
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL.",
      });
      return;
    }

    try {
      await simulateConversion();
    } catch (error) {
      setConversion({ status: 'error', progress: 0 });
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const handleReset = () => {
    setUrl("");
    setConversion({ status: 'idle', progress: 0 });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Main Converter Card */}
      <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Youtube className="h-8 w-8 text-youtube" />
              <span className="text-2xl font-bold">→</span>
              <Music className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">YouTube to MP3 Converter</h2>
            <p className="text-muted-foreground">
              Convert YouTube videos to high-quality MP3 files instantly
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="youtube-url" className="text-sm font-medium">
                YouTube URL
              </label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={conversion.status === 'converting'}
                className="h-12 text-base"
              />
            </div>

            {conversion.status === 'idle' && (
              <Button 
                onClick={handleConvert}
                size="lg"
                className="w-full h-12 bg-convert-gradient hover:bg-convert-gradient-hover text-white font-semibold shadow-glow-primary transition-all duration-300 hover:shadow-glow-primary hover:scale-[1.02]"
              >
                Convert to MP3
              </Button>
            )}

            {conversion.status === 'converting' && (
              <div className="space-y-4">
                <Button 
                  disabled
                  size="lg"
                  className="w-full h-12 bg-convert-gradient animate-pulse"
                >
                  Converting... {conversion.progress}%
                </Button>
                <Progress value={conversion.progress} className="h-2" />
              </div>
            )}

            {conversion.status === 'completed' && (
              <div className="space-y-4 animate-bounce-in">
                <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
                  <Check className="h-5 w-5" />
                  Conversion Completed!
                </div>
                <div className="flex gap-3">
                  <Button 
                    asChild
                    size="lg"
                    className="flex-1 h-12 bg-success-gradient hover:bg-success-gradient text-white font-semibold shadow-glow-success"
                  >
                    <a href={conversion.downloadUrl} download={conversion.filename}>
                      <Download className="mr-2 h-4 w-4" />
                      Download MP3
                    </a>
                  </Button>
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="h-12 px-6"
                  >
                    New Conversion
                  </Button>
                </div>
              </div>
            )}

            {conversion.status === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-destructive font-medium">
                  <AlertCircle className="h-5 w-5" />
                  Conversion Failed
                </div>
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="w-full h-12"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Music className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold">High Quality</h3>
          <p className="text-sm text-muted-foreground">320kbps MP3 output</p>
        </div>
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold">Fast Download</h3>
          <p className="text-sm text-muted-foreground">Quick conversion process</p>
        </div>
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold">Free & Safe</h3>
          <p className="text-sm text-muted-foreground">No registration required</p>
        </div>
      </div>
    </div>
  );
};

export default ConverterForm;