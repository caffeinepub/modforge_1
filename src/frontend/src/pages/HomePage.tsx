import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Download,
  Gamepad2,
  Layers,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Mod } from "../backend";
import ModCard from "../components/ModCard";
import OpenWithDialog from "../components/OpenWithDialog";
import { useActor } from "../hooks/useActor";
import {
  useModStats,
  usePopularGames,
  usePublicMods,
  useUserGames,
} from "../hooks/useQueries";
import { buildZip, downloadZip } from "../utils/zipBuilder";

interface DownloadTarget {
  mod: Mod;
  matchedGames: ReturnType<typeof useUserGames>["data"];
}

export default function HomePage() {
  const { data: publicMods, isLoading } = usePublicMods();
  const { data: stats } = useModStats();
  const { data: popularGames } = usePopularGames();
  const { data: userGames } = useUserGames();
  const { actor } = useActor();

  const [downloadTarget, setDownloadTarget] = useState<DownloadTarget | null>(
    null,
  );

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
        /* keep empty */
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

      // Determine which games to show in Open With
      const library = userGames ?? [];
      const modGame = mod.game?.trim().toLowerCase();
      const matched = modGame
        ? library.filter(
            (g) =>
              g.name.toLowerCase().includes(modGame) ||
              modGame.includes(g.name.toLowerCase()),
          )
        : library;
      setDownloadTarget({
        mod,
        matchedGames: matched.length > 0 ? matched : library,
      });
    } catch {
      toast.error("Download failed");
    }
  };

  const trendingMods = publicMods?.slice(0, 8) ?? [];

  const statsData = [
    {
      icon: <Layers className="w-5 h-5" />,
      label: "Public Mods",
      value: stats ? Number(stats.publicMods).toLocaleString() : "—",
    },
    {
      icon: <Download className="w-5 h-5" />,
      label: "Total Mods",
      value: stats ? Number(stats.totalMods).toLocaleString() : "—",
    },
    {
      icon: <Gamepad2 className="w-5 h-5" />,
      label: "Games Supported",
      value: stats ? Number(stats.totalGames).toLocaleString() : "—",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Unique Tags",
      value: stats ? Number(stats.totalTags).toLocaleString() : "—",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className="relative min-h-[600px] tv:min-h-[700px] flex items-center overflow-hidden"
        style={{
          backgroundImage:
            "url('/assets/generated/hero-modforge.dim_1600x700.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        {/* Scan-line texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 3px,oklch(0.93 0.01 230) 3px,oklch(0.93 0.01 230) 4px)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 tv:py-32">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <Badge className="mb-5 bg-primary/10 text-primary border-primary/30 uppercase tracking-widest text-xs font-semibold px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Open World Mod Platform
            </Badge>

            <h1 className="text-5xl md:text-6xl tv:text-7xl font-bold uppercase tracking-tight leading-[0.95] mb-5">
              FORGE YOUR
              <br />
              <span className="gradient-primary-text text-glow-cyan">
                PERFECT MOD
              </span>
            </h1>

            <p className="text-muted-foreground text-base tv:text-lg mb-8 leading-relaxed max-w-md">
              Create, customize, and share mods for any game — mobile, PC, Xbox,
              PlayStation, Nintendo Switch, and more. Toggle them on or off from
              any device.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="gradient-primary text-primary-foreground border-0 hover:opacity-90 glow-cyan touch-target font-semibold uppercase tracking-wide"
                data-ocid="hero.create_button"
              >
                <Link to="/create">
                  <Zap className="w-4 h-4 mr-2" />
                  Create Mod
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border hover:border-primary/50 hover:bg-primary/5 text-foreground touch-target uppercase tracking-wide"
                data-ocid="hero.explore_button"
              >
                <Link to="/explore">
                  Explore Mods
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            {/* Popular games chip strip */}
            {popularGames && popularGames.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex flex-wrap gap-2"
              >
                <span className="text-xs text-muted-foreground self-center mr-1">
                  Popular:
                </span>
                {popularGames.slice(0, 5).map((g) => (
                  <Link
                    key={g}
                    to="/explore"
                    className="text-xs px-2.5 py-1 rounded-full bg-card/80 border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
                    data-ocid={`hero.popular_game.${g}`}
                  >
                    {g}
                  </Link>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {statsData.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
              data-ocid={`stats.item.${i + 1}`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TRENDING MODS ───────────────────────────────────────── */}
      <section className="bg-background py-16 tv:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-1">
                Community
              </p>
              <h2 className="text-2xl tv:text-3xl font-bold uppercase tracking-tight">
                TRENDING PUBLIC MODS
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Latest creations from the ModForge community
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border hover:border-primary/40 hover:bg-primary/5 shrink-0"
              data-ocid="trending.view_all_button"
            >
              <Link to="/explore">
                View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              data-ocid="trending.loading_state"
            >
              {[...Array(8)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                <div key={i} className="rounded-xl overflow-hidden">
                  <Skeleton className="h-24 w-full bg-muted/30 rounded-none" />
                  <div className="bg-card/80 p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-muted/30" />
                    <Skeleton className="h-3 w-full bg-muted/20" />
                    <Skeleton className="h-3 w-2/3 bg-muted/20" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingMods.length === 0 ? (
            <div
              className="text-center py-20 border border-dashed border-border rounded-xl bg-card/30"
              data-ocid="trending.empty_state"
            >
              <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-25" />
              <p className="text-muted-foreground mb-2 font-medium">
                No public mods yet — be the first!
              </p>
              <p className="text-xs text-muted-foreground/60 mb-6">
                Create and publish a mod to see it appear here
              </p>
              <Button
                asChild
                className="gradient-primary text-primary-foreground border-0 touch-target"
                data-ocid="trending.create_first_button"
              >
                <Link to="/create">Create First Mod</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trendingMods.map((mod, i) => (
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
      </section>

      {/* ── FEATURE HIGHLIGHTS ──────────────────────────────────── */}
      <section className="bg-muted/20 border-y border-border py-16 tv:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl tv:text-3xl font-bold uppercase tracking-tight mb-2">
              BUILT FOR EVERY{" "}
              <span className="gradient-primary-text">PLATFORM</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Mod any open-world game across every device and console.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-[0_0_16px_oklch(0.82_0.12_195_/_0.1)] transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold uppercase tracking-wide text-sm mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="bg-background py-16 tv:py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl tv:text-4xl font-bold uppercase tracking-tight mb-3">
              READY TO{" "}
              <span className="gradient-primary-text text-glow-cyan">
                BUILD?
              </span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm">
              Join the community. Build mods with our visual Config Builder,
              Script Editor, or file upload — then share them with the world.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="gradient-primary text-primary-foreground border-0 hover:opacity-90 glow-cyan touch-target font-semibold uppercase tracking-wide"
                data-ocid="cta.create_button"
              >
                <Link to="/create">
                  <Zap className="w-4 h-4 mr-2" />
                  Launch Mod Creator
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border hover:border-primary/40 touch-target uppercase tracking-wide"
                data-ocid="cta.explore_button"
              >
                <Link to="/explore">Browse Mods</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── OPEN WITH DIALOG ────────────────────────────────────── */}
      {downloadTarget && (
        <OpenWithDialog
          open={!!downloadTarget}
          onClose={() => setDownloadTarget(null)}
          modTitle={downloadTarget.mod.title}
          games={downloadTarget.matchedGames ?? []}
        />
      )}
    </div>
  );
}

const FEATURES = [
  {
    icon: <Layers className="w-5 h-5" />,
    title: "Visual Config Builder",
    description:
      "Design mod parameters with a no-code form interface. Supports NPCs, dialogues, items, and custom culture groups.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Script Editor",
    description:
      "Write custom game logic in the built-in script editor with syntax highlighting and instant validation.",
  },
  {
    icon: <Download className="w-5 h-5" />,
    title: "ZIP Package Download",
    description:
      "Download your mod as a ready-to-use .zip containing mod.json, scripts, and a toggle.txt for on/off control.",
  },
  {
    icon: <Gamepad2 className="w-5 h-5" />,
    title: "Console Compatible",
    description:
      "Toggle mods on/off from Xbox Edge, PlayStation browser, or any mobile device. D-pad and touch friendly.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Character & NPC Profiles",
    description:
      "Create rich character cards with photos, backstories, abilities, roles, and custom culture group assignments.",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "My Games Library",
    description:
      "Track games you own across all platforms. Use Open With to apply any downloaded mod directly to your game.",
  },
];
