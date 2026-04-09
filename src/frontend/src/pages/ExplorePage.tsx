import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Filter, Link2, Search, Star, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import type { Mod } from "../backend";
import ModCard from "../components/ModCard";
import OpenWithDialog from "../components/OpenWithDialog";
import { useActor } from "../hooks/useActor";
import {
  useModAverageRating,
  useModRatings,
  usePopularGames,
  usePopularTags,
  usePublicMods,
  useSearchMods,
  useUserGames,
} from "../hooks/useQueries";
import { buildZip, downloadZip } from "../utils/zipBuilder";

type SystemFilter =
  | "All"
  | "Xbox"
  | "PlayStation"
  | "PC"
  | "Nintendo Switch"
  | "Android"
  | "iOS";

const SYSTEMS: SystemFilter[] = [
  "All",
  "Xbox",
  "PlayStation",
  "PC",
  "Nintendo Switch",
  "Android",
  "iOS",
];

const SYSTEM_BADGE_COLORS: Record<string, string> = {
  xbox: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  playstation: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  pc: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "nintendo switch": "bg-red-500/15 text-red-400 border-red-500/30",
  android: "bg-lime-500/15 text-lime-400 border-lime-500/30",
  ios: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

function SystemBadge({ system }: { system: string }) {
  const key = system.toLowerCase();
  const color =
    SYSTEM_BADGE_COLORS[key] ??
    "bg-muted/60 text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border font-mono font-medium ${color}`}
    >
      {system}
    </span>
  );
}

/** Returns true if the mod's game or tags mention the system keyword */
function modMatchesSystem(mod: Mod, system: SystemFilter): boolean {
  if (system === "All") return true;
  const needle = system.toLowerCase();
  const haystack = [mod.game, ...mod.tags].map((s) => s.toLowerCase());
  return haystack.some((s) => s.includes(needle));
}

/** Extract system-like tags from a mod to display as platform badges */
function getSystemTags(mod: Mod): string[] {
  const knownSystems = [
    "xbox",
    "playstation",
    "pc",
    "nintendo switch",
    "android",
    "ios",
    "switch",
  ];
  const found: string[] = [];
  const candidates = [mod.game, ...mod.tags].map((s) => s.toLowerCase());
  for (const sys of knownSystems) {
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

export default function ExplorePage() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<SystemFilter>("All");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [openWithMod, setOpenWithMod] = useState<Mod | null>(null);
  const [openWithGames, setOpenWithGames] = useState<
    ReturnType<typeof useUserGames>["data"]
  >([]);

  const deferredSearch = useDeferredValue(searchInput);

  const { data: publicMods, isLoading: loadingMods } = usePublicMods();
  const { data: searchResults, isLoading: loadingSearch } =
    useSearchMods(deferredSearch);
  const { data: games } = usePopularGames();
  const { data: tags } = usePopularTags();
  const { data: userGames } = useUserGames();
  const { actor } = useActor();

  const isSearching = !!deferredSearch.trim();
  const baseMods = isSearching ? (searchResults ?? []) : (publicMods ?? []);

  const filteredMods = baseMods.filter((mod) => {
    if (!modMatchesSystem(mod, selectedSystem)) return false;
    if (selectedGame && mod.game !== selectedGame) return false;
    if (selectedTag && !mod.tags.includes(selectedTag)) return false;
    return true;
  });

  const isLoading = isSearching ? loadingSearch : loadingMods;

  const handleDownload = async (mod: Mod) => {
    if (!actor) {
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
        // keep empty object
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

      // Show OpenWith dialog
      const modGame = mod.game.toLowerCase();
      const matchedGames = (userGames ?? []).filter((g) =>
        mod.game
          ? g.name.toLowerCase().includes(modGame) ||
            modGame.includes(g.name.toLowerCase())
          : true,
      );
      setOpenWithGames(
        matchedGames.length > 0 ? matchedGames : (userGames ?? []),
      );
      setOpenWithMod(mod);
    } catch {
      toast.error("Download failed");
    }
  };

  const clearFilters = () => {
    setSelectedSystem("All");
    setSelectedGame(null);
    setSelectedTag(null);
    setSearchInput("");
  };

  const hasFilters =
    selectedSystem !== "All" || selectedGame || selectedTag || searchInput;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold uppercase tracking-tight mb-1 gradient-primary-text">
          Mod Library
        </h1>
        <p className="text-muted-foreground text-sm">
          Browse and download community-created mods for every platform
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search mods by title, description..."
          className="pl-9 bg-card border-border focus-visible:border-primary/50 h-11"
          data-ocid="explore.search_input"
        />
      </div>

      {/* System / Platform filter bar */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Platform
          </span>
        </div>
        <fieldset className="flex flex-wrap gap-2 border-0 p-0 m-0">
          <legend className="sr-only">Filter by platform</legend>
          {SYSTEMS.map((sys) => (
            <button
              key={sys}
              type="button"
              onClick={() => setSelectedSystem(sys)}
              aria-pressed={selectedSystem === sys}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wide border transition-all duration-150
                focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
                ${
                  selectedSystem === sys
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_oklch(0.82_0.12_195/0.4)]"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              data-ocid={`explore.platform_filter.${sys.toLowerCase().replace(/\s/g, "_")}`}
            >
              {sys}
            </button>
          ))}
        </fieldset>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full lg:w-52 flex-shrink-0 space-y-6">
          {/* Games filter */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Games
            </h3>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setSelectedGame(null)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1 ${
                  !selectedGame
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
                data-ocid="explore.game_filter.all"
              >
                All Games
              </button>
              {(games ?? []).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGame(selectedGame === g ? null : g)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors truncate focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1 ${
                    selectedGame === g
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                  data-ocid="explore.game_filter.item"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Tags filter */}
          {tags && tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedTag(selectedTag === tag ? null : tag)
                    }
                    data-ocid="explore.tag_filter.item"
                    className="focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1 rounded"
                  >
                    <Badge
                      variant="secondary"
                      className={`text-xs cursor-pointer transition-colors ${
                        selectedTag === tag
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted border-border"
                      }`}
                    >
                      {tag}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Mods grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${filteredMods.length} mod${filteredMods.length !== 1 ? "s" : ""} found`}
            </p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
                data-ocid="explore.clear_filters_button"
              >
                Clear filters
              </Button>
            )}
          </div>

          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
              data-ocid="explore.loading_state"
            >
              {[...Array(6)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton
                <Skeleton key={i} className="h-52 bg-muted/30 rounded-lg" />
              ))}
            </div>
          ) : filteredMods.length === 0 ? (
            <div
              className="text-center py-20 border border-dashed border-border rounded-lg"
              data-ocid="explore.empty_state"
            >
              <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-foreground mb-1">
                No mods found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-4 border-border"
                  data-ocid="explore.empty_clear_button"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredMods.map((mod, i) => (
                <ExploreModCard
                  key={mod.id.toString()}
                  mod={mod}
                  index={i}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Open With dialog */}
      {openWithMod && (
        <OpenWithDialog
          open={!!openWithMod}
          onClose={() => setOpenWithMod(null)}
          modTitle={openWithMod.title}
          games={openWithGames ?? []}
        />
      )}
    </div>
  );
}

/** Extended ModCard for Explore page — shows system badges, rating, share link, and download */
function ExploreModCard({
  mod,
  index,
  onDownload,
}: {
  mod: Mod;
  index: number;
  onDownload: (mod: Mod) => void;
}) {
  const systemTags = getSystemTags(mod);
  const { data: avgRating } = useModAverageRating(mod.id.toString());
  const { data: ratings } = useModRatings(mod.id.toString());
  const ratingCount = ratings?.length ?? 0;

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
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-200 hover:glow-cyan"
      data-ocid={`explore.mod_card.${index + 1}`}
    >
      {/* Top glow accent */}
      <div className="h-0.5 w-full gradient-primary opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="p-4">
        {/* Title + game */}
        <div className="mb-2">
          <a
            href={`/mod/${mod.id}`}
            className="block font-bold text-foreground uppercase tracking-wide text-sm line-clamp-1 hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1 rounded"
            data-ocid={`explore.mod_title.${index + 1}`}
          >
            {mod.title}
          </a>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {mod.game || "General"}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {mod.description || "No description provided."}
        </p>

        {/* System / platform badges */}
        {systemTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3" aria-label="Platforms">
            {systemTags.map((sys) => (
              <SystemBadge key={sys} system={sys} />
            ))}
          </div>
        )}

        {/* Tag badges */}
        {mod.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {mod.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs py-0 bg-muted/50 text-muted-foreground border-border"
              >
                {tag}
              </Badge>
            ))}
            {mod.tags.length > 2 && (
              <Badge
                variant="secondary"
                className="text-xs py-0 bg-muted/30 text-muted-foreground border-border"
              >
                +{mod.tags.length - 2}
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

        {/* Actions row */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            className="flex-1 h-9 text-xs font-semibold uppercase tracking-wide bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:shadow-[0_0_14px_oklch(0.82_0.12_195/0.4)]"
            onClick={() => onDownload(mod)}
            style={{ touchAction: "manipulation" }}
            data-ocid={`explore.download_button.${index + 1}`}
          >
            Download
          </Button>
          <a
            href={`/mod/${mod.id}`}
            className="inline-flex items-center justify-center h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border border-border rounded-md"
            aria-label="View mod details"
            data-ocid={`explore.view_button.${index + 1}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border border-border"
            onClick={copyLink}
            aria-label="Copy mod link"
            data-ocid={`explore.copy_link.${index + 1}`}
          >
            <Link2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
