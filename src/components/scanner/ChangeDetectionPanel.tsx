import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChangeDetectionPanelProps {
  scanId: string;
  domain: string;
}

interface Change {
  type: string;
  description: string;
}

export function ChangeDetectionPanel({ scanId, domain }: ChangeDetectionPanelProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [changes, setChanges] = useState<Change[]>([]);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleMonitorChanges = async () => {
    setIsLoading(true);
    setIsMonitoring(true);

    try {
      console.log('[ChangeDetectionPanel] Starting change detection for:', { scanId, domain });

      const { data, error } = await supabase.functions.invoke('monitor-domain-changes', {
        body: { scanId, domain, baselineSnapshotId: snapshotId },
      });

      if (error) {
        console.error('[ChangeDetectionPanel] Error:', error);
        toast({
          title: 'Change Detection Failed',
          description: error.message || 'Failed to monitor domain changes',
          variant: 'destructive',
        });
        setIsMonitoring(false);
        return;
      }

      console.log('[ChangeDetectionPanel] Change detection result:', data);

      if (data) {
        setSnapshotId(data.snapshotId);
        setChanges(data.changes || []);
        
        if (data.changesDetected > 0) {
          toast({
            title: 'Changes Detected',
            description: `Found ${data.changesDetected} change(s) on ${domain}`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'No Changes',
            description: `No changes detected on ${domain} since last snapshot`,
            variant: 'default',
          });
        }
      }
    } catch (err) {
      console.error('[ChangeDetectionPanel] Exception:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsMonitoring(false);
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'vendor_added':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'vendor_removed':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'cookie_changed':
      case 'ssp_changed':
        return <RefreshCw className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getChangeBadgeVariant = (type: string): "default" | "destructive" | "secondary" => {
    switch (type) {
      case 'vendor_added':
        return 'default';
      case 'vendor_removed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Change Detection
          </span>
          <Button
            onClick={handleMonitorChanges}
            disabled={isLoading}
            size="sm"
            className="btn-gradient"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Monitoring...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Monitor Changes
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isMonitoring && !changes.length && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Detecting changes...</p>
            </div>
          </div>
        )}

        {changes.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium">
                {changes.length} change{changes.length !== 1 ? 's' : ''} detected
              </span>
            </div>
            {changes.map((change, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                {getChangeIcon(change.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getChangeBadgeVariant(change.type)}>
                      {change.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{change.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : !isMonitoring && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No changes detected yet. Click "Monitor Changes" to compare against previous snapshot.
            </p>
            {snapshotId && (
              <p className="text-xs text-muted-foreground">
                Last snapshot: {snapshotId.substring(0, 8)}...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
