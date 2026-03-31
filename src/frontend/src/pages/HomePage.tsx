import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Download, Layers, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Mod } from "../backend";
import ModCard from "../components/ModCard";
import { useActor } from "../hooks/useActor";
import { useModStats, usePublicMods } from "../hooks/useQueries";
import { buildZip, downloadZip } from "../utils/zipBuilder";

export default function HomePage() {
  const { data: publicMods, isLoading } = usePublicMods();
  const { data: stats } = useModStats();
  const { actor } = useActor();

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

  const trendingMods = publicMods?.slice(0, 6) || [];

  const statsData = [
    {
      icon: <Layers className="w-4 h-4" />,
      label: "Public Mods",
      value: stats?.publicMods.toString() || "0",
    },
    {
      icon: <Download className="w-4 h-4" />,
      label: "Total Mods",
      value: stats?.totalMods.toString() || "0",
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Games",
      value: stats?.totalGames.toString() || "0",
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "Tags",
      value: stats?.totalTags.toString() || "0",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-[580px] flex items-center overflow-hidden"
        style={{
          backgroundImage:
            "url('/assets/generated/hero-modforge.dim_1600x700.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30 uppercase tracking-widest text-xs">
              Open World Mod Platform
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-tight leading-none mb-4">
              FORGE YOUR
              <br />
              <span className="gradient-primary-text text-glow-cyan">
                PERFECT MOD
              </span>
            </h1>
            <p className="text-muted-foreground text-base mb-8 leading-relaxed">
              Create, customize, and share mods for GTA V, Cyberpunk, RDR2 and
              more. Toggle them on or off with a single click.
            </p>
            <div className="flex items-center gap-3">
              <Button
                asChild
                size="lg"
                className="gradient-primary text-white border-0 hover:opacity-90 glow-cyan"
                data-ocid="hero.primary_button"
              >
                <Link to="/create">
                  Start Creating <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border hover:border-primary/40 text-foreground"
                data-ocid="hero.secondary_button"
              >
                <Link to="/explore">Browse Mods</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      {stats && (
        <section className="border-y border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsData.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Mods */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">
              TRENDING PUBLIC MODS
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Latest community creations
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-border hover:border-primary/40"
            data-ocid="trending.button"
          >
            <Link to="/explore">
              View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="trending.loading_state"
          >
            {[...Array(6)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton
              <Skeleton key={i} className="h-48 rounded-lg bg-muted/30" />
            ))}
          </div>
        ) : trendingMods.length === 0 ? (
          <div
            className="text-center py-20 border border-dashed border-border rounded-lg"
            data-ocid="trending.empty_state"
          >
            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground mb-4">
              No public mods yet &mdash; be the first!
            </p>
            <Button
              asChild
              className="gradient-primary text-white border-0"
              data-ocid="trending.primary_button"
            >
              <Link to="/create">Create First Mod</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </section>

      {/* CTA section */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold uppercase tracking-tight mb-3">
              READY TO <span className="gradient-primary-text">BUILD?</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Join the community. Create mods with our visual builder, script
              editor, and file uploader.
            </p>
            <Button
              asChild
              size="lg"
              className="gradient-primary text-white border-0 hover:opacity-90 glow-cyan"
              data-ocid="cta.primary_button"
            >
              <Link to="/create">Launch Mod Creator</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
