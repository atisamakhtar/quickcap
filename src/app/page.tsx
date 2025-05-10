
'use client';

import * as React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateImageCaption } from '@/ai/flows/generate-image-caption';
import type { GenerateImageCaptionOutput, CaptionWithTone } from '@/ai/flows/generate-image-caption';
import { UploadCloud, Copy, RefreshCcw, Sparkles, Twitter, Facebook, Linkedin, Instagram, Settings, List, Languages, Hash, SmilePlus, CalendarDays, Lightbulb } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";


const WRITING_TONES = ["Casual", "Professional", "Witty", "Fun", "Engaging", "Informative", "Persuasive", "Storytelling"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Hindi", "Japanese", "Chinese (Simplified)"];
const NUM_CAPTIONS_OPTIONS = [
  { value: 1, label: "1 Caption" },
  { value: 2, label: "2 Captions" },
  { value: 3, label: "3 Captions" },
];
const EVENT_TYPES = [
  "General",
  "Wedding Ceremony",
  "Birthday Party",
  "Family Walkout",
  "Graduation",
  "Vacation Trip",
  "Business Meeting",
  "Conference",
  "Product Launch",
  "Festival",
  "Concert",
  "Sports Event",
  "Casual Outing",
  "Food / Dining",
  "Nature / Scenery",
  "Selfie",
  "Pet Photo",
];


export default function InstaCaptionAIPage() {
  const [imageDataUri, setImageDataUri] = React.useState<string | null>(null);
  const [captionResult, setCaptionResult] = React.useState<GenerateImageCaptionOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pageLoaded, setPageLoaded] = React.useState(false);
  const resultsContainerRef = React.useRef<HTMLDivElement>(null);

  const [numberOfCaptions, setNumberOfCaptions] = React.useState<number>(1);
  const [writingTone, setWritingTone] = React.useState<string>('Casual');
  const [includeHashtags, setIncludeHashtags] = React.useState<boolean>(true);
  const [includeEmojis, setIncludeEmojis] = React.useState<boolean>(true);
  const [language, setLanguage] = React.useState<string>('English');
  const [eventType, setEventType] = React.useState<string>('General');
  const [customHint, setCustomHint] = React.useState<string>('');
  const [currentPageUrl, setCurrentPageUrl] = React.useState<string>('');


  React.useEffect(() => {
    setPageLoaded(true);
    if (typeof window !== 'undefined') {
      const deployedUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setCurrentPageUrl(deployedUrl);
    }
  }, []);

  React.useEffect(() => {
    if (imageDataUri && (isLoading || error || captionResult) && resultsContainerRef.current) {
      resultsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading, error, captionResult, imageDataUri]);

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setError('Invalid file type. Please upload an image (JPEG, PNG, WEBP, GIF).');
        setImageDataUri(null);
        setCaptionResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File is too large. Maximum size is 5MB.');
        setImageDataUri(null);
        setCaptionResult(null);
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImageDataUri(dataUri);
        setCaptionResult(null); 
        setError(null); 
      };
      reader.onerror = () => {
        setError('Failed to read the image file.');
        setIsLoading(false);
      }
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = () => {
    if (!imageDataUri) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setCaptionResult(null); 
    triggerCaptionGeneration(imageDataUri);
  }

  const triggerCaptionGeneration = async (dataUri: string) => {
    try {
      const result = await generateImageCaption({ 
        photoDataUri: dataUri,
        numberOfCaptions,
        writingTone,
        includeHashtags,
        includeEmojis,
        language,
        eventType: eventType === 'General' ? undefined : eventType, 
        customHint: customHint.trim() === '' ? undefined : customHint.trim(),
      });
      setCaptionResult(result);
    } catch (err) {
      console.error('Caption generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate captions. Please try again.');
      setCaptionResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCaption = (captionText: string, platform?: string) => {
    if (captionText) {
      navigator.clipboard.writeText(captionText)
        .then(() => {
          toast({ title: 'Success!', description: platform ? `Caption copied for ${platform}!` : 'Caption copied to clipboard.' });
        })
        .catch((err) => {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to copy caption.' });
          console.error('Failed to copy: ', err);
        });
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin', captionText: string) => {
    const encodedCaption = encodeURIComponent(captionText);
    const pageUrlToShare = currentPageUrl || (process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''));
    const encodedPageUrl = encodeURIComponent(pageUrlToShare);

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedPageUrl}`;
        break;
      case 'facebook':
        // Note: Facebook's sharer.php might not pre-fill the image if the URL isn't publicly accessible or if OG tags are not correctly set up on the shared URL.
        // For local development or non-public URLs, the image might not appear.
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedPageUrl}&quote=${encodedCaption}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedPageUrl}&title=${encodeURIComponent('Check out this AI-generated caption!')}&summary=${encodedCaption}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleUploadNew = () => {
    setImageDataUri(null);
    setCaptionResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
      fileInputRef.current.click(); 
    }
  };

  const mainContentClass = `transition-opacity duration-1000 ease-in-out ${pageLoaded ? 'opacity-100' : 'opacity-0'}`;

  const firstCaptionText = captionResult?.captions?.[0]?.text;
  const metaTitle = firstCaptionText 
    ? `Caption: ${firstCaptionText.substring(0, 60)}... | InstaCaptionAI` 
    : 'InstaCaptionAI - AI Social Media Caption Generator';
  const metaDescription = firstCaptionText
    ? firstCaptionText.substring(0, 155)
    : 'Generate engaging social media captions instantly with InstaCaptionAI! Upload an image and get customized captions for your posts.';
  
  const defaultOgImage = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || `https://picsum.photos/seed/instacaptionai-og/1200/630`;
  // Use imageDataUri for OG image only if it's a publicly accessible URL. Data URIs are too long for OG tags and not supported by all platforms.
  // For local development or when imageDataUri is a data URI, fall back to defaultOgImage.
  const metaImageUrl = (imageDataUri && (imageDataUri.startsWith('http://') || imageDataUri.startsWith('https://'))) 
    ? imageDataUri 
    : defaultOgImage;


  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentPageUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImageUrl} />
        <meta property="og:site_name" content="InstaCaptionAI" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={currentPageUrl} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={metaImageUrl} />
      </Head>

      <div className={`flex flex-col selection:bg-primary/20 selection:text-primary ${mainContentClass}`}>
        <section className={`relative w-full h-[30vh] sm:h-[40vh] md:h-[50vh] bg-primary/10 transform transition-all duration-700 ease-out ${pageLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-70"
            poster="https://picsum.photos/seed/videoposter/1600/900" 
            data-ai-hint="woman excited mobile"
          >
            <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-black/80 via-black/60 to-black/30">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-xl">InstaCaptionAI</h1>
              <p className="text-md sm:text-lg md:text-xl text-white/90 mt-2 sm:mt-3 drop-shadow-lg max-w-xl mx-auto">
                Generate engaging social media captions instantly with fine-tuned control!
              </p>
            </div>
          </div>
        </section>

        <div className={`w-full max-w-6xl mx-auto px-4 py-8 sm:py-12 flex-grow transform transition-all duration-700 ease-out delay-200 ${pageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="grid md:grid-cols-2 gap-8 md:items-stretch mb-8">
            <div className={`flex flex-col transition-all duration-500 ease-out ${pageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              {!imageDataUri ? (
                <Card className="shadow-xl rounded-xl overflow-hidden flex-grow flex flex-col animate-slideUpAndFadeIn">
                  <CardHeader>
                    <CardTitle className="text-2xl text-center flex items-center justify-center">
                      <UploadCloud className="w-7 h-7 mr-3 text-primary" />
                      Upload Your Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-grow flex flex-col justify-center">
                    <Label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer bg-card hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-12 h-12 text-primary mb-3" />
                        <p className="mb-2 text-sm text-card-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP (MAX. 5MB)</p>
                      </div>
                      <Input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        ref={fileInputRef}
                        disabled={isLoading}
                      />
                    </Label>
                  </CardContent>
                  {error && !isLoading && !imageDataUri && (
                    <CardFooter className="pt-4 border-t border-border">
                      <div className="w-full p-3 text-destructive bg-destructive/10 border border-destructive/30 rounded-md text-center text-sm">
                        <p>{error}</p>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              ) : (
                <Card className="shadow-xl rounded-xl overflow-hidden flex-grow flex flex-col sticky top-8">
                  <CardHeader>
                    <CardTitle className="text-xl text-center">Your Image</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-center justify-center">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted/20 group">
                      <Image
                        src={imageDataUri}
                        alt="Uploaded preview"
                        fill 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                        style={{ objectFit: 'contain' }} 
                        className="transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint="uploaded image"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-border">
                     <Button onClick={handleUploadNew} className="w-full" variant="outline">
                       <UploadCloud className="mr-2 h-4 w-4" /> Upload New Image
                     </Button>
                  </CardFooter>
                </Card>
              )}
            </div>

            <div className={`flex flex-col space-y-8 transition-all duration-500 ease-out delay-150 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <Card className="shadow-xl rounded-xl overflow-hidden flex-grow flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Settings className="w-6 h-6 mr-3 text-primary" />
                    Caption Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 flex-grow">
                  <div className="space-y-2">
                    <Label htmlFor="num-captions" className="flex items-center"><List className="mr-2 h-4 w-4 text-muted-foreground"/>Number of Captions</Label>
                    <Select value={String(numberOfCaptions)} onValueChange={(value) => setNumberOfCaptions(Number(value))}>
                      <SelectTrigger id="num-captions" className="w-full bg-card text-card-foreground border-input">
                        <SelectValue placeholder="Select number of captions" />
                      </SelectTrigger>
                      <SelectContent>
                        {NUM_CAPTIONS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="writing-tone" className="flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground"/>Writing Tone</Label>
                    <Select value={writingTone} onValueChange={setWritingTone}>
                      <SelectTrigger id="writing-tone" className="w-full bg-card text-card-foreground border-input">
                        <SelectValue placeholder="Select writing tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {WRITING_TONES.map(tone => (
                          <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event-type" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/>Event / Context (Optional)</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger id="event-type" className="w-full bg-card text-card-foreground border-input">
                        <SelectValue placeholder="Select event or context" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(event => (
                          <SelectItem key={event} value={event}>{event}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-hint" className="flex items-center"><Lightbulb className="mr-2 h-4 w-4 text-muted-foreground"/>Custom Hint (Optional)</Label>
                    <Input
                      id="custom-hint"
                      type="text"
                      value={customHint}
                      onChange={(e) => setCustomHint(e.target.value)}
                      placeholder="e.g., attending friend's wedding, walking in backyard"
                      className="w-full bg-card text-card-foreground border-input"
                    />
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground"/>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language" className="w-full bg-card text-card-foreground border-input">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(lang => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between space-x-2 pt-2">
                    <Label htmlFor="include-hashtags" className="flex items-center cursor-pointer"><Hash className="mr-2 h-4 w-4 text-muted-foreground"/>Include Hashtags</Label>
                    <Switch id="include-hashtags" checked={includeHashtags} onCheckedChange={setIncludeHashtags} />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="include-emojis" className="flex items-center cursor-pointer"><SmilePlus className="mr-2 h-4 w-4 text-muted-foreground"/>Include Emojis</Label>
                    <Switch id="include-emojis" checked={includeEmojis} onCheckedChange={setIncludeEmojis} />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border">
                  <Button 
                     onClick={handleGenerateClick} 
                     className="w-full"
                     disabled={!imageDataUri || isLoading} 
                   >
                     <RefreshCcw className="mr-2 h-4 w-4" /> 
                     { captionResult ? "Regenerate Captions" : "Generate Captions" }
                   </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          <div ref={resultsContainerRef} className="w-full">
            {isLoading && (
              <Card className="shadow-xl rounded-xl overflow-hidden animate-slideUpAndFadeIn">
                <CardHeader>
                  <CardTitle className="text-xl text-center flex items-center justify-center">
                    <Sparkles className="w-6 h-6 mr-2 text-primary animate-pulse" />
                    Generating Captions...
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {Array.from({ length: numberOfCaptions }).map((_, i) => (
                    <div key={i} className="space-y-2 p-4 border rounded-lg bg-secondary/30 animate-pulse">
                      <div className="h-6 w-24 bg-muted rounded-md"></div>
                      <div className="h-16 bg-muted rounded-md"></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {error && !isLoading && imageDataUri && ( 
              <Card className="shadow-xl rounded-xl overflow-hidden border-destructive bg-destructive/5 animate-slideUpAndFadeIn">
                 <CardHeader>
                  <CardTitle className="text-xl text-center text-destructive">Generation Failed</CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={handleGenerateClick} disabled={isLoading}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {captionResult?.captions && !isLoading && !error && (
              <Card className="shadow-xl rounded-xl overflow-hidden animate-slideUpAndFadeIn">
                <CardHeader>
                  <CardTitle className="text-xl text-center flex items-center justify-center">
                     <Sparkles className="w-6 h-6 mr-2 text-primary" />
                     Generated Captions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {captionResult.captions.map((cap: CaptionWithTone, index: number) => (
                    <div key={index} className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
                          {cap.tone}
                        </Badge>
                        <Button 
                          onClick={() => handleCopyCaption(cap.text)} 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Copy className="mr-2 h-4 w-4" /> Copy
                        </Button>
                      </div>
                      <Textarea
                        id={`caption-${index}`}
                        value={cap.text}
                        readOnly
                        rows={Math.max(3, Math.ceil(cap.text.length / 50))} 
                        className="bg-secondary/20 focus-visible:ring-primary text-sm resize-none text-card-foreground border-input"
                      />
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-end space-x-1">
                          <p className="text-xs text-muted-foreground mr-auto">Share:</p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleShare('twitter', cap.text)} aria-label="Share on Twitter">
                                  <Twitter className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Share on Twitter</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleShare('facebook', cap.text)} aria-label="Share on Facebook">
                                  <Facebook className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Share on Facebook</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleShare('linkedin', cap.text)} aria-label="Share on LinkedIn">
                                  <Linkedin className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Share on LinkedIn</p></TooltipContent>
                            </Tooltip>
                             <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleCopyCaption(cap.text, 'Instagram')} aria-label="Copy caption for Instagram">
                                  <Instagram className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Copy for Instagram</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <footer className={`w-full py-6 text-center text-muted-foreground text-sm border-t border-border bg-background/50 transition-opacity duration-1000 ease-in-out delay-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <p>Powered by Generative AI & Firebase Studio</p>
          <p className="text-xs mt-1">Video placeholder by <a href="https://peach.blender.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Blender Foundation</a> (For Bigger Joyrides)</p>
        </footer>
      </div>
    </>
  );
}

