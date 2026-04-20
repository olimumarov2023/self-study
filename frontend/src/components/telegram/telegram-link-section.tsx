import { useState } from 'react';
import { Send, CheckCircle2, Loader2, ExternalLink, Copy, Unlink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useTelegramStatus,
  useCreateTelegramLinkToken,
  useUnlinkTelegram,
} from '@/queries/use-telegram';

export function TelegramLinkSection() {
  const { data: status, isLoading } = useTelegramStatus();
  const createToken = useCreateTelegramLinkToken();
  const unlink = useUnlinkTelegram();

  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setDeepLink(null);
    setCopied(false);
    const result = await createToken.mutateAsync();
    if (result.deepLink) setDeepLink(result.deepLink);
  }

  async function handleCopy() {
    if (!deepLink) return;
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  function handleUnlink() {
    setDeepLink(null);
    unlink.mutate();
  }

  const enabled = status?.botUsername !== null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4 text-primary" />
          Telegram Bot
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Get your TODO list every day at 00:00 (UTC+5). Update item status
          straight from Telegram — changes sync back here.
        </p>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {!isLoading && !enabled && (
          <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
            Telegram bot is not configured on the server. Set
            <code className="mx-1 rounded bg-background px-1 py-0.5 text-xs">
              TELEGRAM_BOT_TOKEN
            </code>
            in the backend and restart to enable.
          </div>
        )}

        {!isLoading && enabled && status?.linked && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">Linked</span>
              <span className="text-muted-foreground">
                to @{status.botUsername}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={unlink.isPending}
              className="gap-2"
            >
              <Unlink className="h-3.5 w-3.5" />
              Unlink
            </Button>
          </div>
        )}

        {!isLoading && enabled && !status?.linked && (
          <div className="space-y-3">
            {!deepLink && (
              <Button
                onClick={handleGenerate}
                disabled={createToken.isPending}
                className="w-full gap-2 sm:w-auto"
              >
                {createToken.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Link Telegram
              </Button>
            )}

            {deepLink && (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Tap the button on your phone (or copy the link) — this will
                  open Telegram and link your chat. The link expires in 15 min.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    asChild
                    className="w-full gap-2 sm:flex-1"
                    size="sm"
                  >
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Telegram
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="w-full gap-2 sm:w-auto"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy link
                      </>
                    )}
                  </Button>
                </div>
                <p className="break-all text-xs text-muted-foreground">
                  {deepLink}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
