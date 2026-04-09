import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Apple,
  Camera,
  Edit3,
  Gamepad2,
  Library,
  Loader2,
  MonitorPlay,
  Plus,
  Save,
  Shield,
  Smartphone,
  Sword,
  Trash2,
  Tv2,
  User,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Mod, UserProfile } from "../backend";
import AuthGuard from "../components/AuthGuard";
import ModCard from "../components/ModCard";
import OpenWithDialog from "../components/OpenWithDialog";
import PhotoCapture from "../components/PhotoCapture";
import { useActor } from "../hooks/useActor";
import type { UserGame } from "../hooks/useQueries";
import {
  useAddUserGame,
  useDeleteMod,
  useMyMods,
  useRemoveUserGame,
  useSaveProfile,
  useToggleModEnabled,
  useUserGames,
  useUserProfile,
} from "../hooks/useQueries";
import { useStorageClient } from "../hooks/useStorageClient";
import { buildZip, downloadZip } from "../utils/zipBuilder";

const labelClass = "text-xs text-muted-foreground uppercase tracking-wide";

// System-specific platform config with color-coded badges
const SYSTEM_PLATFORMS = [
  { value: "xbox", label: "Xbox" },
  { value: "playstation", label: "PlayStation" },
  { value: "pc", label: "PC" },
  { value: "switch", label: "Nintendo Switch" },
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
  { value: "other", label: "Other" },
] as const;

type SystemPlatform = (typeof SYSTEM_PLATFORMS)[number]["value"];

function SystemBadge({ platform }: { platform: string }) {
  const key = platform.toLowerCase() as SystemPlatform;
  const configs: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    xbox: {
      label: "Xbox",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: <Tv2 className="w-3 h-3" />,
    },
    playstation: {
      label: "PlayStation",
      className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      icon: <Gamepad2 className="w-3 h-3" />,
    },
    pc: {
      label: "PC",
      className: "bg-secondary/80 text-muted-foreground border-border",
      icon: <MonitorPlay className="w-3 h-3" />,
    },
    switch: {
      label: "Switch",
      className: "bg-red-500/15 text-red-400 border-red-500/30",
      icon: <Gamepad2 className="w-3 h-3" />,
    },
    android: {
      label: "Android",
      className: "bg-lime-500/15 text-lime-400 border-lime-500/30",
      icon: <Smartphone className="w-3 h-3" />,
    },
    ios: {
      label: "iOS",
      className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      icon: <Apple className="w-3 h-3" />,
    },
    other: {
      label: "Other",
      className: "bg-muted/60 text-muted-foreground border-border",
      icon: <Gamepad2 className="w-3 h-3" />,
    },
  };

  const cfg = configs[key] ?? configs.other;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function CharacterProfileCard() {
  const { data: profile, isLoading } = useUserProfile();
  const saveProfile = useSaveProfile();
  const storageClient = useStorageClient();

  const [isEditing, setIsEditing] = useState(false);
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formName, setFormName] = useState("");
  const [formCharName, setFormCharName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formAbilities, setFormAbilities] = useState("");
  const [formBackstory, setFormBackstory] = useState("");

  const startEdit = () => {
    setFormName(profile?.name ?? "");
    setFormCharName(profile?.characterName ?? "");
    setFormRole(profile?.role ?? "");
    setFormAbilities(profile?.abilities ?? "");
    setFormBackstory(profile?.backstory ?? "");
    setPhotoPreview(profile?.photoUrl ?? null);
    setPhotoFile(null);
    setIsEditing(true);
  };

  const handlePhotoCapture = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Display name is required");
      return;
    }
    let photoUrl = profile?.photoUrl ?? "";
    if (photoFile && storageClient) {
      setUploadingPhoto(true);
      try {
        const bytes = new Uint8Array(await photoFile.arrayBuffer());
        const { hash } = await storageClient.putFile(bytes);
        photoUrl = await storageClient.getDirectURL(hash);
      } catch (err) {
        console.error("Photo upload failed", err);
        toast.error("Photo upload failed");
        setUploadingPhoto(false);
        return;
      }
      setUploadingPhoto(false);
    }
    const updated: UserProfile = {
      name: formName.trim(),
      characterName: formCharName.trim() ? formCharName.trim() : undefined,
      role: formRole.trim() ? formRole.trim() : undefined,
      abilities: formAbilities.trim() ? formAbilities.trim() : undefined,
      backstory: formBackstory.trim() ? formBackstory.trim() : undefined,
      photoUrl: photoUrl || undefined,
    };
    try {
      await saveProfile.mutateAsync(updated);
      toast.success("Profile saved!");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  if (isLoading) {
    return (
      <div
        className="bg-card border border-border rounded-xl p-6"
        data-ocid="profile.loading_state"
      >
        <Skeleton className="h-24 w-24 rounded-full mb-4" />
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 space-y-5"
          data-ocid="profile.panel"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Edit Character Profile
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-muted-foreground hover:text-foreground touch-target flex items-center justify-center"
              data-ocid="profile.close_button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={photoPreview ?? undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => setPhotoCaptureOpen(true)}
                className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 hover:opacity-90"
                data-ocid="profile.upload_button"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium">Profile Photo</p>
              <p className="text-xs text-muted-foreground">
                Optional — take or upload a photo
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 border-border text-xs gap-1.5"
                onClick={() => setPhotoCaptureOpen(true)}
                data-ocid="profile.upload_button"
              >
                <Camera className="w-3 h-3" />
                {photoPreview ? "Change Photo" : "Add Photo"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className={labelClass}>
                Display Name *
              </Label>
              <Input
                id="profile-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Your name"
                className="bg-muted/40 border-border"
                data-ocid="profile.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-charname" className={labelClass}>
                Character Name <span className="opacity-50">(Optional)</span>
              </Label>
              <Input
                id="profile-charname"
                value={formCharName}
                onChange={(e) => setFormCharName(e.target.value)}
                placeholder="Your in-game alias"
                className="bg-muted/40 border-border"
                data-ocid="profile.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-role" className={labelClass}>
                Role <span className="opacity-50">(Optional)</span>
              </Label>
              <Input
                id="profile-role"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                placeholder="e.g. Street Racer, Hacker"
                className="bg-muted/40 border-border"
                data-ocid="profile.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-abilities" className={labelClass}>
                Abilities <span className="opacity-50">(Optional)</span>
              </Label>
              <Input
                id="profile-abilities"
                value={formAbilities}
                onChange={(e) => setFormAbilities(e.target.value)}
                placeholder="e.g. Expert driver, Code breaker"
                className="bg-muted/40 border-border"
                data-ocid="profile.input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-backstory" className={labelClass}>
              Backstory <span className="opacity-50">(Optional)</span>
            </Label>
            <Textarea
              id="profile-backstory"
              value={formBackstory}
              onChange={(e) => setFormBackstory(e.target.value)}
              placeholder="Describe your character's story, origins, motivations..."
              className="bg-muted/40 border-border resize-none h-24"
              data-ocid="profile.textarea"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              data-ocid="profile.cancel_button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveProfile.isPending || uploadingPhoto}
              className="gradient-primary text-white border-0 gap-1.5"
              data-ocid="profile.save_button"
            >
              {saveProfile.isPending || uploadingPhoto ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Profile
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <PhotoCapture
          open={photoCaptureOpen}
          onClose={() => setPhotoCaptureOpen(false)}
          onCapture={handlePhotoCapture}
        />
      </>
    );
  }

  const hasProfile =
    profile &&
    (profile.characterName ||
      profile.role ||
      profile.abilities ||
      profile.backstory ||
      profile.photoUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
      data-ocid="profile.card"
    >
      <div className="h-2 gradient-primary" />
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Player Profile
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={startEdit}
            className="text-xs gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground"
            data-ocid="profile.edit_button"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </Button>
        </div>

        <div className="flex items-center gap-5">
          <Avatar className="w-20 h-20 border-2 border-border flex-shrink-0">
            <AvatarImage src={profile?.photoUrl ?? undefined} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xl">
              {profile?.name?.charAt(0)?.toUpperCase() ?? (
                <User className="w-8 h-8" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate">
              {profile?.name || "Anonymous"}
            </p>
            {profile?.characterName && (
              <p className="text-sm text-primary font-mono truncate">
                &ldquo;{profile.characterName}&rdquo;
              </p>
            )}
            {profile?.role && (
              <Badge
                variant="secondary"
                className="mt-1 text-xs bg-primary/10 text-primary border-primary/20"
              >
                {profile.role}
              </Badge>
            )}
          </div>
        </div>

        {hasProfile && (
          <div className="mt-5 space-y-3 pt-4 border-t border-border">
            {profile?.abilities && (
              <div className="flex items-start gap-3">
                <Sword className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    Abilities
                  </p>
                  <p className="text-sm">{profile.abilities}</p>
                </div>
              </div>
            )}
            {profile?.backstory && (
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    Backstory
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile.backstory}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!profile && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Set up your character profile to represent yourself in the
              ModForge universe.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-border text-xs gap-1.5"
              onClick={startEdit}
              data-ocid="profile.primary_button"
            >
              <Plus className="w-3 h-3" /> Create Profile
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MyGamesSection() {
  const { data: games, isLoading } = useUserGames();
  const addGame = useAddUserGame();
  const removeGame = useRemoveUserGame();

  const [gameName, setGameName] = useState("");
  const [platform, setPlatform] = useState("pc");

  const handleAdd = async () => {
    if (!gameName.trim()) {
      toast.error("Please enter a game name");
      return;
    }
    try {
      await addGame.mutateAsync({ name: gameName.trim(), platform });
      setGameName("");
      toast.success("Game added to library!");
    } catch {
      toast.error("Failed to add game");
    }
  };

  const handleRemove = async (gameId: bigint) => {
    try {
      await removeGame.mutateAsync(gameId);
      toast.success("Game removed");
    } catch {
      toast.error("Failed to remove game");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-xl p-6 space-y-5"
      data-ocid="games.panel"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            My Games Library
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {(games || []).length} game{(games || []).length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Add game form */}
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <Input
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Game name (e.g. Minecraft PE)"
          className="bg-muted/40 border-border flex-1 min-w-0"
          data-ocid="games.input"
        />
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger
            className="bg-muted/40 border-border w-40 flex-shrink-0"
            data-ocid="games.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {SYSTEM_PLATFORMS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleAdd}
          disabled={addGame.isPending || !gameName.trim()}
          className="gradient-primary text-white border-0 flex-shrink-0 touch-target"
          data-ocid="games.primary_button"
        >
          {addGame.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span className="ml-1.5">Add</span>
        </Button>
      </div>

      {/* Game list */}
      {isLoading ? (
        <div className="space-y-2" data-ocid="games.loading_state">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 bg-muted/30 rounded-lg" />
          ))}
        </div>
      ) : (games || []).length === 0 ? (
        <div
          className="text-center py-10 border border-dashed border-border rounded-lg"
          data-ocid="games.empty_state"
        >
          <Gamepad2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
          <p className="text-sm text-muted-foreground">
            No games in your library yet
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Add games you own to use Open With after downloading mods
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2"
          data-ocid="games.list"
        >
          {(games || []).map((g: UserGame, i: number) => (
            <div
              key={g.id.toString()}
              className="flex items-center justify-between gap-3 px-3 py-3 rounded-lg bg-muted/30 border border-border group hover:border-primary/30 transition-colors"
              data-ocid={`games.item.${i + 1}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Gamepad2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate">{g.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <SystemBadge platform={g.platform} />
                <button
                  type="button"
                  onClick={() => handleRemove(g.id)}
                  disabled={removeGame.isPending}
                  className="touch-target flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-destructive transition-opacity disabled:opacity-50"
                  aria-label={`Remove ${g.name}`}
                  data-ocid={`games.delete_button.${i + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function WorkshopPage() {
  const { data: myMods, isLoading } = useMyMods();
  const deleteMod = useDeleteMod();
  const toggleMod = useToggleModEnabled();
  const { actor } = useActor();
  const navigate = useNavigate();

  const [deleteTarget, setDeleteTarget] = useState<Mod | null>(null);
  const [togglingId, setTogglingId] = useState<bigint | null>(null);
  const [openWithMod, setOpenWithMod] = useState<Mod | null>(null);
  const { data: userGames } = useUserGames();

  const handleToggle = async (mod: Mod) => {
    setTogglingId(mod.id);
    try {
      await toggleMod.mutateAsync(mod.id);
    } catch {
      toast.error("Failed to toggle mod");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMod.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted`);
    } catch {
      toast.error("Failed to delete mod");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEdit = (mod: Mod) => {
    navigate({ to: `/edit/${mod.id.toString()}` });
  };

  const handleDownload = async (mod: Mod) => {
    if (!actor) return;
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
      const attachmentEntries = await Promise.all(
        info.attachments.map(async (att, i) => {
          const bytes = await att.getBytes();
          return { name: `attachment-${i + 1}`, data: bytes };
        }),
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
        ...attachmentEntries,
      ];
      const zip = buildZip(entries);
      downloadZip(zip, `${info.mod.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.zip`);
      toast.success("Mod downloaded!");
      setOpenWithMod(mod);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <AuthGuard message="Sign in to view your workshop">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight mb-1">
              MY WORKSHOP
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage, toggle, and download your mods
            </p>
          </div>
          <Button
            asChild
            className="gradient-primary text-white border-0 hover:opacity-90 touch-target"
            data-ocid="workshop.primary_button"
          >
            <Link to="/create">
              <Plus className="w-4 h-4 mr-1.5" /> New Mod
            </Link>
          </Button>
        </motion.div>

        {/* Character Profile Card */}
        <CharacterProfileCard />

        {/* My Games Library */}
        <MyGamesSection />

        {/* Mods section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Your Mods
            </h2>
            <span className="text-xs text-muted-foreground">
              {(myMods || []).length} mod
              {(myMods || []).length !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4"
              data-ocid="workshop.loading_state"
            >
              {[...Array(3)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton
                <Skeleton key={i} className="h-48 bg-muted/30 rounded-lg" />
              ))}
            </div>
          ) : (myMods || []).length === 0 ? (
            <div
              className="text-center py-24 border border-dashed border-border rounded-lg"
              data-ocid="workshop.empty_state"
            >
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No mods yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Create your first mod to get started
              </p>
              <Button
                asChild
                className="gradient-primary text-white border-0"
                data-ocid="workshop.primary_button"
              >
                <Link to="/create">Create Your First Mod</Link>
              </Button>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4"
              data-ocid="workshop.list"
            >
              {(myMods || []).map((mod, i) => (
                <ModCard
                  key={mod.id.toString()}
                  mod={mod}
                  index={i}
                  showActions
                  onDownload={handleDownload}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  onToggle={handleToggle}
                  isTogglingId={togglingId}
                  isDeletingId={
                    deleteMod.isPending ? (deleteTarget?.id ?? null) : null
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete confirm dialog */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
        >
          <AlertDialogContent
            className="bg-card border-border"
            data-ocid="workshop.dialog"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Mod</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="border-border touch-target"
                data-ocid="workshop.cancel_button"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-target"
                data-ocid="workshop.confirm_button"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Open With dialog */}
      {openWithMod &&
        (() => {
          const modGame = openWithMod.game?.trim().toLowerCase();
          const allGames = userGames || [];
          const matchedGame = modGame
            ? allGames.find((g) => g.name.trim().toLowerCase() === modGame)
            : undefined;
          const applicableGames = matchedGame ? [matchedGame] : allGames;
          return (
            <OpenWithDialog
              open={!!openWithMod}
              onClose={() => setOpenWithMod(null)}
              modTitle={openWithMod.title}
              games={applicableGames}
            />
          );
        })()}
    </AuthGuard>
  );
}
