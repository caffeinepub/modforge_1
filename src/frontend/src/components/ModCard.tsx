import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Download,
  Edit,
  Gamepad2,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import type { Mod } from "../backend";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-all hover:shadow-glow"
      data-ocid={`mods.item.${index + 1}`}
    >
      {/* Top accent */}
      <div className="h-1 w-full gradient-primary opacity-60" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-sm">
              {mod.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Gamepad2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {mod.game || "General"}
              </span>
            </div>
          </div>
          {showActions && (
            <div className="flex items-center">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  mod.isEnabled ? "bg-emerald-400" : "bg-muted-foreground/40"
                }`}
              />
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {mod.description || "No description provided."}
        </p>

        {/* Tags */}
        {mod.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {mod.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs py-0 bg-muted/60 text-muted-foreground border-border"
              >
                {tag}
              </Badge>
            ))}
            {mod.tags.length > 3 && (
              <Badge
                variant="secondary"
                className="text-xs py-0 bg-muted/40 text-muted-foreground"
              >
                +{mod.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1">
            {onDownload && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => onDownload(mod)}
                data-ocid={`mods.button.${index + 1}`}
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
            {showActions && onToggle && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${
                  mod.isEnabled
                    ? "text-emerald-400 hover:text-muted-foreground"
                    : "text-muted-foreground hover:text-emerald-400"
                }`}
                onClick={() => onToggle(mod)}
                disabled={isTogglingId === mod.id}
                data-ocid={`mods.toggle.${index + 1}`}
              >
                {mod.isEnabled ? (
                  <Power className="w-3.5 h-3.5" />
                ) : (
                  <PowerOff className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
            {showActions && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => onEdit(mod)}
                data-ocid={`mods.edit_button.${index + 1}`}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            )}
            {showActions && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(mod)}
                disabled={isDeletingId === mod.id}
                data-ocid={`mods.delete_button.${index + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
