import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "@tanstack/react-router";
import {
  Calendar,
  Download,
  Link2,
  MessageSquare,
  Play,
  Star,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Comment, ExternalBlob } from "../backend";
import OpenWithDialog from "../components/OpenWithDialog";
import { useActor } from "../hooks/useActor";
import {
  useDeleteComment,
  useMod,
  useModAttachments,
  useModAverageRating,
  useModComments,
  useSubmitComment,
  useSubmitRating,
  useUserGames,
  useUserProfile,
} from "../hooks/useQueries";
import { buildZip, downloadZip } from "../utils/zipBuilder";

const SYSTEM_BADGE_COLORS: Record<string, string> = {
  xbox: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  playstation: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  pc: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "nintendo switch": "bg-red-500/15 text-red-400 border-red-500/30",
  android: "bg-lime-500/15 text-lime-400 border-lime-500/30",
  ios: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const KNOWN_SYSTEMS = [
  "xbox",
  "playstation",
  "pc",
  "nintendo switch",
  "android",
  "ios",
  "switch",
];

function getSystemTags(game: string, tags: string[]): string[] {
  const found: string[] = [];
  const candidates = [game, ...tags].map((s) => s.toLowerCase());
  for (const sys of KNOWN_SYSTEMS) {
    if (candidates.some((c) => c.includes(sys))) {
      const label =
        sys === "nintendo switch" || sys === "switch"
          ? "Nintendo Switch"
          : sys.charAt(0).toUpperCase() + sys.slice(1);
      if (!found.includes(label)) found.push(label);
    }
  }
  return found;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Star display ──────────────────────────────────────────────────────────

function StarDisplay({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <div
      className="flex gap-0.5"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(1, Math.max(0, rating - (i - 1)));
        return (
          <span
            key={i}
            className="relative inline-block"
            style={{ width: size, height: size }}
          >
            <Star
              size={size}
              className="text-muted/40 absolute inset-0"
              fill="currentColor"
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                size={size}
                className="text-yellow-400 absolute inset-0"
                fill="currentColor"
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Interactive star picker ───────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex gap-1" aria-label="Select star rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <label
          key={i}
          className="cursor-pointer focus-within:outline-2 focus-within:outline-primary focus-within:outline-offset-1 rounded transition-transform hover:scale-110 inline-block"
          data-ocid={`mod_detail.star_picker.${i}`}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
        >
          <input
            type="radio"
            name="star-rating"
            value={i}
            checked={value === i}
            onChange={() => onChange(i)}
            className="sr-only"
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
          />
          <Star
            size={24}
            className={`transition-colors ${display >= i ? "text-yellow-400" : "text-muted/40"}`}
            fill={display >= i ? "currentColor" : "none"}
          />
        </label>
      ))}
    </div>
  );
}

// ─── Comment item ──────────────────────────────────────────────────────────

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex gap-3 p-4 bg-muted/20 rounded-lg border border-border/50 group"
      data-ocid="mod_detail.comment_item"
    >
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 uppercase select-none">
        {comment.authorName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-sm text-foreground truncate">
            {comment.authorName}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed break-words">
          {comment.text}
        </p>
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1.5 rounded text-destructive/60 hover:text-destructive hover:bg-destructive/10 self-start shrink-0"
          aria-label="Delete comment"
          data-ocid="mod_detail.delete_comment_button"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Skit video player ─────────────────────────────────────────────────────

function SkitVideoPlayer({ blobs }: { blobs: ExternalBlob[] }) {
  if (blobs.length === 0) return null;

  return (
    <section aria-label="Skit Videos">
      <h2 className="text-lg font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
        <Play size={18} className="text-primary" />
        Skit Videos
        <span className="text-xs font-normal text-muted-foreground normal-case tracking-normal">
          ({blobs.length})
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {blobs.map((blob, i) => {
          const url = blob.getDirectURL();
          return (
            <div
              key={url || `skit-${i}`}
              className="bg-card border border-border rounded-lg overflow-hidden"
              data-ocid={`mod_detail.skit_video.${i + 1}`}
            >
              <video
                src={url}
                controls
                preload="metadata"
                className="w-full aspect-video bg-black"
                aria-label={`Skit video ${i + 1}`}
              >
                <track kind="captions" />
                Your browser does not support HTML5 video.
              </video>
              <div className="px-3 py-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-mono">
                  Skit {i + 1}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ModDetailPage() {
  const { modId } = useParams({ from: "/mod/$modId" });
  const numericId = BigInt(modId);
  const modIdStr = modId;

  const { actor } = useActor();
  const { data: mod, isLoading: loadingMod } = useMod(numericId);
  const { data: attachments = [] } = useModAttachments(numericId);
  const { data: avgRating = 0 } = useModAverageRating(modIdStr);
  const { data: comments = [], isLoading: loadingComments } =
    useModComments(modIdStr);
  const { data: profile } = useUserProfile();
  const { data: userGames = [] } = useUserGames();

  const submitRating = useSubmitRating();
  const submitComment = useSubmitComment();
  const deleteComment = useDeleteComment();

  const [myRating, setMyRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [openWithMod, setOpenWithMod] = useState(false);

  const isLoggedIn = !!actor && !!profile;

  // Copy share link
  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Could not copy link"));
  };

  // Download mod
  const handleDownload = async () => {
    if (!actor || !mod) {
      toast.error("Sign in to download mods");
      return;
    }
    try {
      const info = await actor.getDownloadInfo(mod.id);
      const encoder = new TextEncoder();
      let configObj: object = {};
      try {
        configObj = JSON.parse(info.mod.configJson);
      } catch {
        // keep empty
      }
      const modJson = JSON.stringify(
        {
          title: info.mod.title,
          game: info.mod.game,
          tags: info.mod.tags,
          description: info.mod.description,
          config: configObj,
          scriptText: info.mod.scriptText,
        },
        null,
        2,
      );
      const entries = [
        { name: "mod.json", data: encoder.encode(modJson) },
        {
          name: "script.txt",
          data: encoder.encode(info.mod.scriptText || "-- No script"),
        },
        {
          name: "toggle.txt",
          data: encoder.encode(info.mod.isEnabled ? "enabled" : "disabled"),
        },
      ];
      const zip = buildZip(entries);
      downloadZip(zip, `${info.mod.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.zip`);
      toast.success("Mod downloaded!");
      setOpenWithMod(true);
    } catch {
      toast.error("Download failed");
    }
  };

  // Submit rating
  const handleRatingSubmit = () => {
    if (!myRating) return;
    submitRating.mutate(
      { modId: modIdStr, stars: myRating },
      {
        onSuccess: () =>
          toast.success(`Rated ${myRating} star${myRating > 1 ? "s" : ""}!`),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  // Submit comment
  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    submitComment.mutate(
      { modId: modIdStr, text: commentText.trim() },
      {
        onSuccess: () => {
          toast.success("Comment posted!");
          setCommentText("");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  // Delete comment
  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(
      { commentId, modId: modIdStr },
      {
        onSuccess: () => toast.success("Comment deleted"),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  // Determine open-with games list
  const openWithGames = (() => {
    if (!mod) return userGames;
    const modGame = mod.game.toLowerCase();
    if (!modGame) return userGames;
    const matched = userGames.filter(
      (g) =>
        g.name.toLowerCase().includes(modGame) ||
        modGame.includes(g.name.toLowerCase()),
    );
    return matched.length > 0 ? matched : userGames;
  })();

  if (loadingMod) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Skeleton className="h-9 w-2/3 bg-muted/30" />
        <Skeleton className="h-5 w-1/3 bg-muted/30" />
        <Skeleton className="h-32 bg-muted/30 rounded-lg" />
        <Skeleton className="h-48 bg-muted/30 rounded-lg" />
      </div>
    );
  }

  if (!mod) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center"
        data-ocid="mod_detail.not_found"
      >
        <p className="text-2xl font-bold text-foreground mb-2">Mod not found</p>
        <p className="text-muted-foreground text-sm">
          This mod may have been removed or made private.
        </p>
      </div>
    );
  }

  const systemTags = getSystemTags(mod.game, mod.tags);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Top accent line */}
        <div className="h-0.5 w-full gradient-primary rounded-full" />

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight gradient-primary-text break-words">
              {mod.title}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mod.game || "General"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border text-muted-foreground hover:text-foreground hover:border-primary/40 h-10 touch-target"
              onClick={handleCopyLink}
              data-ocid="mod_detail.share_link_button"
            >
              <Link2 size={15} />
              Copy Link
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all hover:shadow-[0_0_14px_oklch(0.82_0.12_195/0.4)] h-10 touch-target"
              onClick={handleDownload}
              data-ocid="mod_detail.download_button"
            >
              <Download size={15} />
              Download
            </Button>
          </div>
        </div>

        {/* Meta: tags, system badges */}
        <div className="flex flex-wrap gap-2 items-center">
          {systemTags.map((sys) => {
            const key = sys.toLowerCase();
            const color =
              SYSTEM_BADGE_COLORS[key] ??
              "bg-muted/60 text-muted-foreground border-border";
            return (
              <span
                key={sys}
                className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-mono font-medium ${color}`}
              >
                {sys}
              </span>
            );
          })}
          {mod.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs bg-muted/50 text-muted-foreground border-border"
            >
              {tag}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">
            Created {formatDate(mod.createdAt)}
          </span>
        </div>

        {/* Description */}
        {mod.description && (
          <p className="text-foreground/80 leading-relaxed text-sm sm:text-base bg-card border border-border/60 rounded-lg px-4 py-3">
            {mod.description}
          </p>
        )}
      </motion.div>

      {/* Skit Videos */}
      {attachments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SkitVideoPlayer blobs={attachments} />
        </motion.div>
      )}

      {/* Ratings */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        aria-label="Ratings"
        className="bg-card border border-border rounded-lg p-5 sm:p-6 space-y-5"
        data-ocid="mod_detail.ratings_section"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
            <Star size={18} className="text-yellow-400" />
            Rating
          </h2>
          <div className="flex items-center gap-3">
            <StarDisplay rating={avgRating} size={20} />
            <span className="text-2xl font-bold text-foreground">
              {avgRating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Interactive picker for logged-in users */}
        {isLoggedIn ? (
          <div className="border-t border-border/60 pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Rate this mod:</p>
            <div className="flex items-center gap-4 flex-wrap">
              <StarPicker value={myRating} onChange={setMyRating} />
              <Button
                size="sm"
                disabled={!myRating || submitRating.isPending}
                onClick={handleRatingSubmit}
                className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all h-9"
                data-ocid="mod_detail.submit_rating_button"
              >
                {submitRating.isPending ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground border-t border-border/60 pt-4">
            Sign in to rate this mod.
          </p>
        )}
      </motion.section>

      {/* Comments */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        aria-label="Comments"
        className="space-y-5"
        data-ocid="mod_detail.comments_section"
      >
        <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={18} className="text-primary" />
          Comments
          {comments.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground normal-case tracking-normal">
              ({comments.length})
            </span>
          )}
        </h2>

        {/* Comment form */}
        {isLoggedIn ? (
          <div
            className="bg-card border border-border rounded-lg p-4 space-y-3"
            data-ocid="mod_detail.comment_form"
          >
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts about this mod..."
              className="resize-none bg-muted/30 border-border focus-visible:border-primary/50 min-h-[88px]"
              maxLength={1000}
              data-ocid="mod_detail.comment_input"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {commentText.length}/1000
              </span>
              <Button
                size="sm"
                disabled={!commentText.trim() || submitComment.isPending}
                onClick={handleCommentSubmit}
                className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all h-9"
                data-ocid="mod_detail.submit_comment_button"
              >
                {submitComment.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground bg-card border border-border/60 rounded-lg px-4 py-3">
            Sign in to leave a comment.
          </p>
        )}

        {/* Comment list */}
        {loadingComments ? (
          <div className="space-y-3" data-ocid="mod_detail.comments_loading">
            {[...Array(3)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: loading skeleton
              <Skeleton key={i} className="h-20 bg-muted/20 rounded-lg" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div
            className="text-center py-12 border border-dashed border-border rounded-lg"
            data-ocid="mod_detail.comments_empty"
          >
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No comments yet.</p>
            {isLoggedIn && (
              <p className="text-xs text-muted-foreground mt-1">
                Be the first to share your thoughts!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                canDelete={isLoggedIn && c.authorName === profile?.name}
                onDelete={() => handleDeleteComment(c.id)}
              />
            ))}
          </div>
        )}
      </motion.section>

      {/* Open With dialog */}
      {mod && (
        <OpenWithDialog
          open={openWithMod}
          onClose={() => setOpenWithMod(false)}
          modTitle={mod.title}
          games={openWithGames}
        />
      )}
    </div>
  );
}
