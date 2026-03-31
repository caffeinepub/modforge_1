import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gamepad2, Library, MonitorPlay, Smartphone, Tv2 } from "lucide-react";
import type { UserGame } from "../hooks/useQueries";

interface OpenWithDialogProps {
  open: boolean;
  onClose: () => void;
  modTitle: string;
  games: UserGame[];
}

const platformConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  mobile: {
    label: "Mobile",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: <Smartphone className="w-3 h-3" />,
  },
  pc: {
    label: "PC",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: <MonitorPlay className="w-3 h-3" />,
  },
  console: {
    label: "Console",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: <Tv2 className="w-3 h-3" />,
  },
  other: {
    label: "Other",
    color: "bg-muted text-muted-foreground border-border",
    icon: <Gamepad2 className="w-3 h-3" />,
  },
};

function PlatformBadge({ platform }: { platform: string }) {
  const cfg = platformConfig[platform.toLowerCase()] ?? platformConfig.other;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function OpenWithDialog({
  open,
  onClose,
  modTitle,
  games,
}: OpenWithDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="open-with.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Gamepad2 className="w-4 h-4 text-primary" />
            Open With
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Apply{" "}
            <strong className="text-foreground">
              &ldquo;{modTitle}&rdquo;
            </strong>{" "}
            to your game
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          {games.length === 0 ? (
            <div
              className="text-center py-8 border border-dashed border-border rounded-lg"
              data-ocid="open-with.empty_state"
            >
              <Library className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground mb-1">
                No games in your library
              </p>
              <p className="text-xs text-muted-foreground/60">
                Add games to your library in the Workshop
              </p>
            </div>
          ) : (
            games.map((g, i) => (
              <div
                key={g.id.toString()}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors"
                data-ocid={`open-with.item.${i + 1}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Gamepad2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{g.name}</span>
                </div>
                <PlatformBadge platform={g.platform} />
              </div>
            ))
          )}
        </div>

        <div className="pt-2">
          <Button
            onClick={onClose}
            className="w-full border-border"
            variant="outline"
            data-ocid="open-with.close_button"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { PlatformBadge };
