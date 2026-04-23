import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw, Loader2, ExternalLink } from "lucide-react";

interface CheckResult {
  url: string;
  checkedAt: string;
  durationMs: number;
  statusCode?: number;
  mountSuccess: boolean;
  hasRoot?: boolean;
  hasModuleScript?: boolean;
  scriptCount?: number;
  scripts?: string[];
  htmlBytes?: number;
  error: string | null;
}

const TARGET_URL = "https://usdc.directory";

export default function DeploymentStatus() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-deployment", {
        body: { url: TARGET_URL },
      });
      if (error) throw error;
      setResult(data as CheckResult);
    } catch (e) {
      setResult({
        url: TARGET_URL,
        checkedAt: new Date().toISOString(),
        durationMs: 0,
        mountSuccess: false,
        error: e instanceof Error ? e.message : "Failed to invoke check",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  const ok = result?.mountSuccess === true;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="Deployment Status — USDC Directory" description="Live mount-status check for usdc.directory" />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Deployment Status</h1>
            <p className="text-muted-foreground mt-1">
              Live check for{" "}
              <a
                href={TARGET_URL}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                usdc.directory <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
          <Button onClick={runCheck} disabled={loading} variant="outline">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Re-check
          </Button>
        </div>

        <Card className="p-6">
          {!result && loading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Running first check…
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {ok ? (
                  <CheckCircle2 className="w-12 h-12 text-success" />
                ) : (
                  <XCircle className="w-12 h-12 text-destructive" />
                )}
                <div>
                  <div className="text-2xl font-semibold">
                    {ok ? "App mounts successfully" : "Mount failure detected"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last checked {new Date(result.checkedAt).toLocaleString()} · took {result.durationMs}ms
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <Stat label="HTTP status" value={result.statusCode ?? "—"} good={result.statusCode === 200} />
                <Stat label="HTML bytes" value={result.htmlBytes?.toLocaleString() ?? "—"} />
                <Stat
                  label="Has <div id='root'>"
                  value={result.hasRoot ? "Yes" : "No"}
                  good={result.hasRoot}
                />
                <Stat
                  label="Module script tag"
                  value={result.hasModuleScript ? "Found" : "Missing"}
                  good={result.hasModuleScript}
                />
              </div>

              {result.error && (
                <div className="p-4 rounded-md bg-destructive/10 border border-destructive/30">
                  <div className="text-sm font-semibold text-destructive mb-1">Error details</div>
                  <div className="text-sm text-destructive/90 font-mono">{result.error}</div>
                </div>
              )}

              {result.scripts && result.scripts.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">
                    Detected script sources ({result.scriptCount})
                  </div>
                  <div className="space-y-1">
                    {result.scripts.map((s, i) => (
                      <Badge key={i} variant="secondary" className="font-mono text-xs mr-2">
                        {s.length > 80 ? s.slice(0, 80) + "…" : s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: React.ReactNode; good?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${good === true ? "text-success" : good === false ? "text-destructive" : ""}`}>
        {value}
      </div>
    </div>
  );
}
