import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScannerAuth } from '@/hooks/useScannerAuth';
import { useDomainScan } from '@/hooks/useDomainScan';
import { parseDomains, parseCSVFile } from '@/utils/scannerApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Search, LogOut, Globe, TrendingUp, Shield, Zap } from 'lucide-react';
import type { PublisherContext, PublisherVertical } from '@/types/scanner';
import adfixusLogo from '@/assets/adfixus-logo-scanner.png';

export default function ScannerInput() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, logout } = useScannerAuth();
  const { startScan, isLoading: scanLoading } = useDomainScan();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [domainInput, setDomainInput] = useState('');
  const [context, setContext] = useState<PublisherContext>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const domains = await parseCSVFile(file);
      setDomainInput(domains.join('\n'));
      toast({
        title: 'CSV Loaded',
        description: `Found ${domains.length} domains`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse CSV file',
        variant: 'destructive',
      });
    }
  };

  const handleStartScan = async () => {
    const domains = parseDomains(domainInput);
    
    if (domains.length === 0) {
      toast({
        title: 'No domains',
        description: 'Please enter at least one domain to scan',
        variant: 'destructive',
      });
      return;
    }

    if (domains.length > 20) {
      toast({
        title: 'Too many domains',
        description: 'Maximum 20 domains per scan',
        variant: 'destructive',
      });
      return;
    }

    const scanId = await startScan(domains, context);
    
    if (scanId) {
      navigate(`/scanner/results/${scanId}`);
    } else {
      toast({
        title: 'Scan failed',
        description: 'Failed to start domain scan. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const parsedDomains = parseDomains(domainInput);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={adfixusLogo} alt="AdFixus" className="h-8 object-contain" />
            <span className="text-muted-foreground">|</span>
            <span className="font-semibold text-foreground">Domain Scanner</span>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How Much Revenue Are You{' '}
            <span className="text-primary">Leaving on the Table?</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Scan publisher domains to uncover hidden revenue opportunities, 
            identity infrastructure gaps, and strategic vulnerabilities for 2026.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6 text-center">
                <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Safari Blindness</h3>
                <p className="text-sm text-muted-foreground">Detect 35-50% invisible inventory</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Revenue Impact</h3>
                <p className="text-sm text-muted-foreground">Quantify $ opportunity gaps</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Privacy Risk</h3>
                <p className="text-sm text-muted-foreground">Flag compliance issues</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Input Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Domain Input */}
            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Domains to Scan
                </CardTitle>
                <CardDescription>
                  Enter up to 20 domains (one per line) or upload a CSV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="example.com&#10;publisher.com&#10;news-site.org"
                  className="min-h-[200px] bg-secondary border-border text-foreground font-mono"
                />
                
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-border text-foreground"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {parsedDomains.length > 0 && (
                      <>{parsedDomains.length} domain{parsedDomains.length !== 1 ? 's' : ''} detected</>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Publisher Context */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-base">
                  Publisher Context
                  <span className="text-muted-foreground font-normal text-sm ml-2">(optional)</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Enhance revenue calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Monthly Impressions</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000000"
                    value={context.monthlyImpressions || ''}
                    onChange={(e) => setContext(prev => ({
                      ...prev,
                      monthlyImpressions: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Primary Vertical</Label>
                  <Select
                    value={context.publisherVertical}
                    onValueChange={(value: PublisherVertical) => setContext(prev => ({
                      ...prev,
                      publisherVertical: value
                    }))}
                  >
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="Select vertical" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="auto">Automotive</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Owned Domains Count</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={context.ownedDomainsCount || ''}
                    onChange={(e) => setContext(prev => ({
                      ...prev,
                      ownedDomainsCount: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Start Scan Button */}
          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={handleStartScan}
              disabled={parsedDomains.length === 0 || scanLoading}
              className="btn-gradient px-12 py-6 text-lg"
            >
              {scanLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3" />
                  Starting Scan...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Start Revenue Impact Scan
                </>
              )}
            </Button>
            {parsedDomains.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Will analyze {parsedDomains.length} domain{parsedDomains.length !== 1 ? 's' : ''} for identity gaps
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
