import ConverterForm from "@/components/ConverterForm";
import heroBackground from "@/assets/hero-bg.jpg";

const Index = () => {
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
          <ConverterForm />
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
