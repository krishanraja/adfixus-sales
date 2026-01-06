import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScannerAuth } from '@/hooks/useScannerAuth';
import { useDomainScan } from '@/hooks/useDomainScan';
import { parseDomains, parseCSVFile, checkEdgeFunctionHealth, diagnoseConfiguration, type DiagnosticResult } from '@/utils/scannerApi';
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
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const { error: scanError } = useDomainScan();

  // Run comprehensive diagnostics
  const runDiagnostics = useCallback(async () => {
    setIsRunningDiagnostics(true);
    console.log('[ScannerInput] Running configuration diagnostics...');
    
    try {
      const result = await diagnoseConfiguration();
      setDiagnostics(result);
      
      // Show specific error based on diagnostics
      if (!result.envVarSet) {
        toast({
          title: 'Configuration Error',
          description: 'VITE_SUPABASE_URL is not set. Please configure it in Vercel Dashboard → Project Settings → Environment Variables.',
          variant: 'destructive',
        });
      } else if (result.envVarFormat === 'invalid') {
        toast({
          title: 'Configuration Error',
          description: `VITE_SUPABASE_URL format is invalid. ${result.recommendations[0] || 'Check the URL format.'}`,
          variant: 'destructive',
        });
      } else if (!result.dnsResolves) {
        toast({
          title: 'DNS Resolution Failed',
          description: 'Cannot resolve Supabase domain. Check if the project exists in Supabase Dashboard.',
          variant: 'destructive',
        });
      } else if (!result.urlAccessible) {
        toast({
          title: 'Connection Issue',
          description: 'Supabase URL is not accessible. Check network connectivity or project status.',
          variant: 'destructive',
        });
      } else if (!result.edgeFunctionDeployed) {
        toast({
          title: 'Edge Function Not Deployed',
          description: 'The scan-domain edge function is not deployed. Deploy it in Supabase Dashboard → Edge Functions.',
          variant: 'destructive',
        });
      } else if (!result.edgeFunctionCorsWorking) {
        toast({
          title: 'CORS Configuration Issue',
          description: 'Edge function CORS preflight is failing. Check edge function OPTIONS handler returns 200 with CORS headers.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Configuration Check Complete',
          description: 'Configuration appears correct. Edge function is deployed and CORS is working.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('[ScannerInput] Diagnostics failed:', error);
      toast({
        title: 'Diagnostics Error',
        description: 'Failed to run diagnostics. Check browser console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, [toast]);

  // Check if edge functions are available on mount and provide retry function
  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    setServiceError(null);
    console.log('[ScannerInput] Checking scanner service health...');
    
    const { healthy, error } = await checkEdgeFunctionHealth();
    
    if (healthy) {
      console.log('[ScannerInput] Scanner service is healthy');
      setServiceStatus('healthy');
      setServiceError(null);
      setDiagnostics(null); // Clear diagnostics if service is healthy
    } else {
      console.error('[ScannerInput] Scanner service unavailable:', error);
      setServiceStatus('unavailable');
      setServiceError(error || 'Scanner service is not available');
      
      // Automatically run diagnostics when health check fails
      runDiagnostics();
    }
    
    setIsCheckingHealth(false);
  }, [toast, runDiagnostics]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

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
          <div className="flex items-center gap-4">
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2">
              {serviceStatus === 'checking' && (
                <Badge variant="outline" className="text-xs">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1.5" />
                  Checking...
                </Badge>
              )}
              {serviceStatus === 'healthy' && (
                <Badge className="bg-success/20 text-success border-success/30 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
              {serviceStatus === 'unavailable' && (
                <Badge variant="destructive" className="text-xs">
                  <div className="h-3 w-3 rounded-full bg-destructive mr-1.5" />
                  Offline
                </Badge>
              )}
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

          {/* Service Status Alert */}
          {serviceStatus === 'unavailable' && (
            <Card className="mt-6 border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-destructive mb-2">Scanner Service Unavailable</h3>
                    <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">
                      {serviceError || 'The scanner service is not accessible. This may be a temporary issue.'}
                    </p>
                  </div>
                  
                  {/* Diagnostic Results */}
                  {diagnostics && (
                    <div className="bg-background/50 rounded-lg p-4 space-y-3 border border-border/50">
                      <h4 className="font-medium text-foreground text-sm">Configuration Diagnostics</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Environment Variable:</span>
                          <Badge variant={diagnostics.envVarSet ? "outline" : "destructive"} className="text-xs">
                            {diagnostics.envVarSet ? 'Set' : 'Not Set'}
                          </Badge>
                        </div>
                        {diagnostics.envVarSet && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">URL Format:</span>
                              <Badge variant={diagnostics.envVarFormat === 'valid' ? "outline" : "destructive"} className="text-xs">
                                {diagnostics.envVarFormat === 'valid' ? 'Valid' : 'Invalid'}
                              </Badge>
                            </div>
                            {diagnostics.url && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">URL:</span>
                                <code className="text-xs bg-secondary/50 px-2 py-1 rounded">{diagnostics.url}</code>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">DNS Resolution:</span>
                              <Badge variant={diagnostics.dnsResolves ? "outline" : "destructive"} className="text-xs">
                                {diagnostics.dnsResolves ? 'Resolves' : 'Failed'}
                              </Badge>
                            </div>
                            {diagnostics.url && (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Edge Function Deployed:</span>
                                  <Badge variant={diagnostics.edgeFunctionDeployed ? "outline" : "destructive"} className="text-xs">
                                    {diagnostics.edgeFunctionDeployed ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">CORS Working:</span>
                                  <Badge variant={diagnostics.edgeFunctionCorsWorking ? "outline" : "destructive"} className="text-xs">
                                    {diagnostics.edgeFunctionCorsWorking ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                                {diagnostics.edgeFunctionError && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-muted-foreground">Edge Function Error:</span>
                                    <span className="text-xs text-destructive">{diagnostics.edgeFunctionError}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                      
                      {diagnostics.recommendations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <h5 className="font-medium text-foreground text-xs mb-2">Recommendations:</h5>
                          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                            {diagnostics.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={checkHealth}
                      disabled={isCheckingHealth}
                      className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      {isCheckingHealth ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-2" />
                          Retry Connection
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={runDiagnostics}
                      disabled={isRunningDiagnostics}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      {isRunningDiagnostics ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-2" />
                          Check Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scan Error Display */}
          {scanError && (
            <Card className="mt-6 border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-2">Scan Failed</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {scanError}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start Scan Button */}
          <div className="mt-10 text-center">
            <Button
              size="lg"
              onClick={handleStartScan}
              disabled={parsedDomains.length === 0 || scanLoading || serviceStatus === 'unavailable'}
              className="btn-gradient px-12 py-7 text-lg font-semibold animate-glow-pulse disabled:opacity-50 disabled:cursor-not-allowed"
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
