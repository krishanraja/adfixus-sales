import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScannerAuth } from '@/hooks/useScannerAuth';
import { useDomainScan } from '@/hooks/useDomainScan';
import { parseDomains, parseCSVFile, checkEdgeFunctionHealth } from '@/utils/scannerApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Search, 
  LogOut, 
  Globe, 
  TrendingUp, 
  Shield, 
  Zap,
  Sparkles,
  BarChart3,
  Brain,
  CheckCircle
} from 'lucide-react';
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
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'healthy' | 'unavailable'>('checking');

  // Check if edge functions are available on mount
  useEffect(() => {
    const checkHealth = async () => {
      console.log('[ScannerInput] Checking scanner service health...');
      const { healthy, error } = await checkEdgeFunctionHealth();
      if (healthy) {
        console.log('[ScannerInput] Scanner service is healthy');
        setServiceStatus('healthy');
      } else {
        console.error('[ScannerInput] Scanner service unavailable:', error);
        setServiceStatus('unavailable');
        toast({
          title: 'Scanner Service',
          description: 'Scanner is initializing. This may take a moment on first use.',
          variant: 'default',
        });
      }
    };
    checkHealth();
  }, [toast]);

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
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <Brain className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={adfixusLogo} alt="AdFixus" className="h-8 object-contain" />
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span className="font-semibold text-foreground hidden sm:inline">Domain Scanner</span>
            <Badge className="bg-primary/10 text-primary border-primary/30 hidden md:flex">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-6 py-2 px-4 bg-primary/10 text-primary border-primary/30">
            <BarChart3 className="h-4 w-4 mr-2" />
            Revenue Intelligence Platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            How Much Revenue Are You{' '}
            <span className="gradient-text">Leaving on the Table?</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            AI-powered domain analysis reveals hidden revenue opportunities, 
            identity infrastructure gaps, and strategic vulnerabilities.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-4 stagger-fade">
            <Card className="glass-card border-border/50 scanner-card group">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Safari Blindness</h3>
                <p className="text-sm text-muted-foreground">Detect 35-50% invisible inventory on Safari & Firefox</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50 scanner-card group">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-success" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Revenue Impact</h3>
                <p className="text-sm text-muted-foreground">Quantify dollar opportunity gaps with traffic data</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50 scanner-card group">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-warning" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Privacy Risk</h3>
                <p className="text-sm text-muted-foreground">Flag compliance issues and regulatory exposure</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Input Section */}
      <section className="relative py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Domain Input */}
            <Card className="lg:col-span-2 glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Domains to Scan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="example.com&#10;publisher.com&#10;news-site.org"
                    className="min-h-[200px] bg-secondary/30 border-border/50 text-foreground font-mono resize-none focus:border-primary focus:ring-primary/20"
                  />
                  {parsedDomains.length > 0 && (
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-success/20 text-success border-success/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {parsedDomains.length} domain{parsedDomains.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </div>
                
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
                    className="border-border/50 text-foreground hover:bg-secondary/50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Up to 20 domains per scan
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Publisher Context */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-foreground text-base flex items-center justify-between">
                  Publisher Context
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                    Optional
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Monthly Impressions</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000000"
                    value={context.monthlyImpressions || ''}
                    onChange={(e) => setContext(prev => ({
                      ...prev,
                      monthlyImpressions: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="bg-secondary/30 border-border/50 text-foreground focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Primary Vertical</Label>
                  <Select
                    value={context.publisherVertical}
                    onValueChange={(value: PublisherVertical) => setContext(prev => ({
                      ...prev,
                      publisherVertical: value
                    }))}
                  >
                    <SelectTrigger className="bg-secondary/30 border-border/50 text-foreground">
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
                  <Label className="text-sm text-muted-foreground">Owned Domains</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={context.ownedDomainsCount || ''}
                    onChange={(e) => setContext(prev => ({
                      ...prev,
                      ownedDomainsCount: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="bg-secondary/30 border-border/50 text-foreground focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Start Scan Button */}
          <div className="mt-10 text-center">
            <Button
              size="lg"
              onClick={handleStartScan}
              disabled={parsedDomains.length === 0 || scanLoading}
              className="btn-gradient px-12 py-7 text-lg font-semibold animate-glow-pulse"
            >
              {scanLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3" />
                  Initializing AI Scan...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Start Revenue Impact Scan
                </>
              )}
            </Button>
            
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Brain className="h-4 w-4 text-primary" />
                AI-Powered Analysis
              </span>
              <span className="text-border">•</span>
              <span>Results in 30 seconds</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
