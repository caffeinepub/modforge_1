import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Search, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import type { Mod } from "../backend";
import ModCard from "../components/ModCard";
import { useActor } from "../hooks/useActor";
import {
  usePopularGames,
  usePopularTags,
  usePublicMods,
  useSearchMods,
} from "../hooks/useQueries";
import { buildZip, downloadZip } from "../utils/zipBuilder";

export default function ExplorePage() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(searchInput);

  const { data: publicMods, isLoading: loadingMods } = usePublicMods();
  const { data: searchResults, isLoading: loadingSearch } =
    useSearchMods(deferredSearch);
  const { data: games } = usePopularGames();
  const { data: tags } = usePopularTags();
  const { actor } = useActor();

  const isSearching = !!deferredSearch.trim();
  const baseMods = isSearching ? searchResults || [] : publicMods || [];

  const filteredMods = baseMods.filter((mod) => {
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
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold uppercase tracking-tight mb-1">
          EXPLORE MODS
        </h1>
        <p className="text-muted-foreground text-sm">
          Browse and download community-created mods
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search mods by title, description..."
          className="pl-9 bg-card border-border"
          data-ocid="explore.search_input"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full lg:w-56 flex-shrink-0 space-y-6">
          {/* Games filter */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Games
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedGame(null)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                  !selectedGame
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
                data-ocid="explore.tab"
              >
                All Games
              </button>
              {(games || []).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGame(selectedGame === g ? null : g)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors ${
                    selectedGame === g
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                  data-ocid="explore.tab"
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
                    data-ocid="explore.toggle"
                  >
                    <Badge
                      variant="secondary"
                      className={`text-xs cursor-pointer transition-colors ${
                        selectedTag === tag
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
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
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${filteredMods.length} mod${filteredMods.length !== 1 ? "s" : ""} found`}
            </p>
            {(selectedGame || selectedTag || searchInput) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedGame(null);
                  setSelectedTag(null);
                  setSearchInput("");
                }}
                className="text-xs text-muted-foreground"
                data-ocid="explore.button"
              >
                Clear filters
              </Button>
            )}
          </div>

          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              data-ocid="explore.loading_state"
            >
              {[...Array(6)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton
                <Skeleton key={i} className="h-48 bg-muted/30 rounded-lg" />
              ))}
            </div>
          ) : filteredMods.length === 0 ? (
            <div
              className="text-center py-20 border border-dashed border-border rounded-lg"
              data-ocid="explore.empty_state"
            >
              <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">
                No mods found matching your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMods.map((mod, i) => (
                <ModCard
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
    </div>
  );
}
