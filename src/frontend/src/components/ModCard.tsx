import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Download,
  Edit,
  ExternalLink,
  Gamepad2,
  Link2,
  MonitorPlay,
  Power,
  PowerOff,
  Smartphone,
  Star,
  Trash2,
  Tv2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Mod } from "../backend";
import { useModAverageRating, useModRatings } from "../hooks/useQueries";

interface ModCardProps {
  mod: Mod;
  index?: number;
  showActions?: boolean;
  onDownload?: (mod: Mod) => void;
  onEdit?: (mod: Mod) => void;
  onDelete?: (mod: Mod) => void;
  onToggle?: (mod: Mod) => void;
  isTogglingId?: bigint | null;
  isDeletingId?: bigint | null;
}

const SYSTEM_COLORS: Record<string, string> = {
  xbox: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  playstation: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ps5: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ps4: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "nintendo switch": "bg-red-500/15 text-red-400 border-red-500/30",
  switch: "bg-red-500/15 text-red-400 border-red-500/30",
  android: "bg-lime-500/15 text-lime-400 border-lime-500/30",
  ios: "bg-primary/15 text-primary border-primary/30",
  mobile: "bg-primary/15 text-primary border-primary/30",
  pc: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  console: "bg-accent/15 text-accent-foreground border-accent/30",
};

function getSystemColor(tag: string) {
  return (
    SYSTEM_COLORS[tag.toLowerCase()] ??
    "bg-muted/60 text-muted-foreground border-border"
  );
}

function SystemIcon({ tag }: { tag: string }) {
  const lower = tag.toLowerCase();
  if (lower === "android" || lower === "ios" || lower === "mobile")
    return <Smartphone className="w-2.5 h-2.5" />;
  if (lower === "pc") return <MonitorPlay className="w-2.5 h-2.5" />;
  if (
    lower === "console" ||
    lower.includes("xbox") ||
    lower.includes("playstation") ||
    lower.includes("switch")
  )
    return <Tv2 className="w-2.5 h-2.5" />;
  return <Gamepad2 className="w-2.5 h-2.5" />;
}

const SYSTEM_TAGS = new Set([
  "xbox",
  "playstation",
  "ps5",
  "ps4",
  "nintendo switch",
  "switch",
  "android",
  "ios",
  "mobile",
  "pc",
  "console",
]);

function isSystemTag(tag: string) {
  return SYSTEM_TAGS.has(tag.toLowerCase());
}

export default function ModCard({
  mod,
  index = 0,
  showActions = false,
  onDownload,
  onEdit,
  onDelete,
  onToggle,
  isTogglingId,
  isDeletingId,
}: ModCardProps) {
  const formattedDate = new Date(
    Number(mod.createdAt / 1_000_000n),
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const { data: avgRating } = useModAverageRating(mod.id.toString());
  const { data: ratings } = useModRatings(mod.id.toString());
  const ratingCount = ratings?.length ?? 0;

  const systemTags = mod.tags.filter(isSystemTag);
  const otherTags = mod.tags.filter((t) => !isSystemTag(t));
  const visibleOtherTags = otherTags.slice(0, 2);
  const extraCount = otherTags.length - visibleOtherTags.length;

  const copyLink = async () => {
    const url = `${window.location.origin}/mod/${mod.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_24px_oklch(0.82_0.12_195_/_0.18)]"
      data-ocid={`mods.item.${index + 1}`}
    >
      {/* Top gradient bar */}
      <div className="h-0.5 w-full gradient-primary opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Faux cover — game name on colored gradient strip */}
      <div className="relative h-24 gradient-primary flex items-end px-4 pb-3 overflow-hidden">
        {/* Scan-line texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, oklch(0 0 0) 3px, oklch(0 0 0) 4px)",
          }}
        />
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/30 to-transparent" />

        {/* Active indicator */}
        {showActions && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                mod.isEnabled
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                  : "bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  mod.isEnabled ? "bg-emerald-400" : "bg-muted-foreground/40"
                }`}
              />
              {mod.isEnabled ? "ON" : "OFF"}
            </span>
          </div>
        )}

        {/* Game label */}
        <div className="relative z-10 flex items-center gap-1.5 min-w-0">
          <Gamepad2 className="w-3.5 h-3.5 text-primary-foreground/70 flex-shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80 truncate">
            {mod.game || "General"}
          </span>
        </div>
      </div>

      <div className="p-4 pt-3">
        {/* Title */}
        <a
          href={`/mod/${mod.id}`}
          className="block font-bold text-foreground truncate text-sm uppercase tracking-wide mb-1 hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1 rounded"
          data-ocid={`mods.title_link.${index + 1}`}
        >
          {mod.title}
        </a>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {mod.description || "No description provided."}
        </p>

        {/* System tags row */}
        {systemTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {systemTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide ${getSystemColor(tag)}`}
              >
                <SystemIcon tag={tag} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Other tags */}
        {visibleOtherTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {visibleOtherTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] py-0 px-1.5 bg-muted/50 text-muted-foreground border-border"
              >
                {tag}
              </Badge>
            ))}
            {extraCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] py-0 px-1.5 bg-muted/30 text-muted-foreground"
              >
                +{extraCount}
              </Badge>
            )}
          </div>
        )}

        {/* Rating row */}
        <div className="flex items-center gap-1.5 mb-3 min-h-[18px]">
          {avgRating !== undefined && ratingCount > 0 ? (
            <>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-amber-400">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({ratingCount})
              </span>
            </>
          ) : avgRating !== undefined ? (
            <span className="text-[10px] text-muted-foreground italic">
              No ratings yet
            </span>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-0.5">
            {/* View Details */}
            <a
              href={`/mod/${mod.id}`}
              className="inline-flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors rounded-md"
              aria-label="View mod details"
              data-ocid={`mods.view_button.${index + 1}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {/* Copy link */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={copyLink}
              aria-label="Copy mod link"
              data-ocid={`mods.copy_link.${index + 1}`}
            >
              <Link2 className="w-3.5 h-3.5" />
            </Button>
            {onDownload && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 text-muted-foreground hover:text-primary hover:bg-primary/10 touch-target transition-colors"
                style={{ touchAction: "manipulation" }}
                onClick={() => onDownload(mod)}
                aria-label="Download mod"
                data-ocid={`mods.button.${index + 1}`}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            {showActions && onToggle && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-11 w-11 touch-target transition-colors ${
                  mod.isEnabled
                    ? "text-emerald-400 hover:text-muted-foreground hover:bg-muted/20"
                    : "text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                }`}
                style={{ touchAction: "manipulation" }}
                onClick={() => onToggle(mod)}
                disabled={isTogglingId === mod.id}
                title={mod.isEnabled ? "Disable mod" : "Enable mod"}
                aria-label={mod.isEnabled ? "Disable mod" : "Enable mod"}
                data-ocid={`mods.toggle.${index + 1}`}
              >
                {mod.isEnabled ? (
                  <Power className="w-4 h-4" />
                ) : (
                  <PowerOff className="w-4 h-4" />
                )}
              </Button>
            )}
            {showActions && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 text-muted-foreground hover:text-primary hover:bg-primary/10 touch-target transition-colors"
                style={{ touchAction: "manipulation" }}
                onClick={() => onEdit(mod)}
                aria-label="Edit mod"
                data-ocid={`mods.edit_button.${index + 1}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {showActions && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 touch-target transition-colors"
                style={{ touchAction: "manipulation" }}
                onClick={() => onDelete(mod)}
                disabled={isDeletingId === mod.id}
                aria-label="Delete mod"
                data-ocid={`mods.delete_button.${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
