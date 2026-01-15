import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScannerAuth } from '@/hooks/useScannerAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, AlertCircle, Sparkles, BarChart3, Shield, Zap } from 'lucide-react';
import adfixusLogo from '@/assets/adfixus-logo-scanner.png';

export default function ScannerLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useScannerAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/scanner/input');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = login(username, password);
    if (success) {
      navigate('/scanner/input');
    } else {
      setError('Invalid username or password');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Content */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Hero */}
        <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
          <div className="max-w-lg mx-auto lg:mx-0">
            <div className="mb-8">
              <img 
                src={adfixusLogo} 
                alt="AdFixus" 
                className="h-10 object-contain animate-float"
              />
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
              Revenue Intelligence
              <span className="block text-primary mt-2">Powered by AI</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Uncover hidden revenue opportunities across your publisher portfolio with 
              AI-powered domain analysis and real-time traffic intelligence.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Badge variant="outline" className="py-2 px-4 text-sm border-primary/30 text-muted-foreground">
                <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                Traffic Analytics
              </Badge>
              <Badge variant="outline" className="py-2 px-4 text-sm border-primary/30 text-muted-foreground">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                Privacy Compliance
              </Badge>
              <Badge variant="outline" className="py-2 px-4 text-sm border-primary/30 text-muted-foreground">
                <Zap className="h-4 w-4 mr-2 text-primary" />
                Revenue Recovery
              </Badge>
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium"
                  >
                    {['AP', 'NM', 'TG', 'DX'][i]}
                  </div>
                ))}
              </div>
              <span>Trusted by 35+ publishers globally</span>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Login Form */}
        <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center">
          <Card className="w-full max-w-md glass-card border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome Back
                </h2>
                <p className="text-muted-foreground">
                  Sign in to access the Domain Scanner
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="h-12 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="h-12 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 btn-gradient text-base font-semibold"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </form>
              
              <div className="mt-6 pt-6 border-t border-border text-center">
                <Badge className="bg-primary/10 text-primary border-primary/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered Analysis
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
