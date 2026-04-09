import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  FileText,
  Globe,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Mod, ModInput } from "../backend";
import { useUserGames } from "../hooks/useQueries";
import PhotoCapture from "./PhotoCapture";

const COMMON_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Russian",
  "Japanese",
  "Chinese",
  "Arabic",
  "Italian",
  "Korean",
  "Dutch",
  "Polish",
  "Swedish",
  "Turkish",
  "Hindi",
  "Other",
];

interface GameConfig {
  playerSpeed: number;
  healthMultiplier: number;
  wantedLevel: string;
  weather: string;
  timeOfDay: string;
  spawnItems: string;
  spawnVehicles: string;
  godMode: boolean;
  infiniteAmmo: boolean;
  noClip: boolean;
}

interface CultureEntry {
  id: number;
  name: string;
  language: string;
  description?: string;
}

interface CharacterEntry {
  id: number;
  name: string;
  role?: string;
  abilities?: string;
  backstory?: string;
  cultureId?: number | null;
  photoFile?: File;
  photoPreview?: string;
}

interface DialogueEntry {
  id: number;
  speaker: string;
  text: string;
  videoFile?: File;
  videoPreview?: string;
}

interface SkitEntry {
  id: number;
  title: string;
  location?: string;
  videoFile?: File;
  videoPreview?: string;
}

let entryIdCounter = 0;
const nextId = () => ++entryIdCounter;

const DEFAULT_CONFIG: GameConfig = {
  playerSpeed: 1,
  healthMultiplier: 1,
  wantedLevel: "default",
  weather: "Default",
  timeOfDay: "Default",
  spawnItems: "",
  spawnVehicles: "",
  godMode: false,
  infiniteAmmo: false,
  noClip: false,
};

interface ModCreatorProps {
  initialMod?: Mod;
  onSave: (input: ModInput, files: File[]) => Promise<void>;
  isSaving?: boolean;
}

export default function ModCreator({
  initialMod,
  onSave,
  isSaving,
}: ModCreatorProps) {
  const { data: userGames } = useUserGames();
  const [title, setTitle] = useState(initialMod?.title || "");
  const [game, setGame] = useState(initialMod?.game || "");
  const [systemTag, setSystemTag] = useState<string>(() => {
    if (initialMod?.configJson) {
      try {
        return JSON.parse(initialMod.configJson).systemTag || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  const [description, setDescription] = useState(initialMod?.description || "");
  const [isPublic, setIsPublic] = useState(initialMod?.isPublic ?? false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialMod?.tags || []);
  const [config, setConfig] = useState<GameConfig>(() => {
    if (initialMod?.configJson) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(initialMod.configJson) };
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });
  const [scriptText, setScriptText] = useState(initialMod?.scriptText || "");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cultures
  const [cultures, setCultures] = useState<CultureEntry[]>(() => {
    if (initialMod?.configJson) {
      try {
        const parsed = JSON.parse(initialMod.configJson);
        return (parsed.cultures || []).map(
          (c: { name: string; language: string; description?: string }) => ({
            id: nextId(),
            name: c.name,
            language: c.language,
            description: c.description || "",
          }),
        );
      } catch {
        return [];
      }
    }
    return [];
  });
  const [customLanguageId, setCustomLanguageId] = useState<number | null>(null);

  // Characters
  const [characters, setCharacters] = useState<CharacterEntry[]>(() => {
    if (initialMod?.configJson) {
      try {
        const parsed = JSON.parse(initialMod.configJson);
        return (parsed.characters || []).map(
          (c: {
            name: string;
            role?: string;
            abilities?: string;
            backstory?: string;
            cultureId?: number | null;
          }) => ({
            id: nextId(),
            name: c.name,
            role: c.role || "",
            abilities: c.abilities || "",
            backstory: c.backstory || "",
            cultureId: c.cultureId ?? null,
          }),
        );
      } catch {
        return [];
      }
    }
    return [];
  });
  const [photoCaptureCharId, setPhotoCaptureCharId] = useState<number | null>(
    null,
  );
  const characterPhotoRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Dialogues
  const [dialogues, setDialogues] = useState<DialogueEntry[]>(() => {
    if (initialMod?.configJson) {
      try {
        const parsed = JSON.parse(initialMod.configJson);
        return (parsed.dialogues || []).map(
          (d: { speaker: string; text: string }) => ({
            id: nextId(),
            speaker: d.speaker,
            text: d.text,
          }),
        );
      } catch {
        return [];
      }
    }
    return [];
  });
  const dialogueVideoRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Skits
  const [skits, setSkits] = useState<SkitEntry[]>(() => {
    if (initialMod?.configJson) {
      try {
        const parsed = JSON.parse(initialMod.configJson);
        return (parsed.skits || []).map(
          (s: { title: string; location?: string }) => ({
            id: nextId(),
            title: s.title,
            location: s.location || "",
          }),
        );
      } catch {
        return [];
      }
    }
    return [];
  });
  const skitVideoRefs = useRef<(HTMLInputElement | null)[]>([]);

  const GAMES = [
    "GTA V",
    "Red Dead Redemption 2",
    "Cyberpunk 2077",
    "The Witcher 3",
    "Minecraft",
    "Skyrim",
    "Other",
  ];

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  // Culture handlers
  const addCulture = () =>
    setCultures((prev) => [
      ...prev,
      { id: nextId(), name: "", language: "", description: "" },
    ]);
  const removeCulture = (id: number) => {
    setCultures((prev) => prev.filter((c) => c.id !== id));
    // Unassign from characters
    setCharacters((prev) =>
      prev.map((c) => (c.cultureId === id ? { ...c, cultureId: null } : c)),
    );
  };
  const updateCulture = (
    id: number,
    field: keyof Omit<CultureEntry, "id">,
    value: string,
  ) =>
    setCultures((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );

  // Character handlers
  const addCharacter = () =>
    setCharacters((prev) => [
      ...prev,
      {
        id: nextId(),
        name: "",
        role: "",
        abilities: "",
        backstory: "",
        cultureId: null,
      },
    ]);
  const removeCharacter = (id: number) =>
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  const updateCharacter = (
    id: number,
    field: keyof CharacterEntry,
    value: string | number | null,
  ) =>
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  const handleCharacterPhoto = (id: number, file: File) => {
    const url = URL.createObjectURL(file);
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, photoFile: file, photoPreview: url } : c,
      ),
    );
  };

  // Dialogue handlers
  const addDialogue = () =>
    setDialogues((prev) => [...prev, { id: nextId(), speaker: "", text: "" }]);
  const removeDialogue = (id: number) =>
    setDialogues((prev) => prev.filter((d) => d.id !== id));
  const updateDialogue = (
    id: number,
    field: "speaker" | "text",
    value: string,
  ) =>
    setDialogues((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  const handleDialogueVideo = (id: number, file: File) => {
    const url = URL.createObjectURL(file);
    setDialogues((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, videoFile: file, videoPreview: url } : d,
      ),
    );
  };

  // Skit handlers
  const addSkit = () =>
    setSkits((prev) => [...prev, { id: nextId(), title: "", location: "" }]);
  const removeSkit = (id: number) =>
    setSkits((prev) => prev.filter((s) => s.id !== id));
  const updateSkit = (id: number, field: "title" | "location", value: string) =>
    setSkits((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  const handleSkitVideo = (id: number, file: File) => {
    const url = URL.createObjectURL(file);
    setSkits((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, videoFile: file, videoPreview: url } : s,
      ),
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a mod title");
      return;
    }
    if (!game.trim()) {
      toast.error("Please select a game");
      return;
    }

    const mediaFiles: File[] = [
      ...characters.filter((c) => c.photoFile).map((c) => c.photoFile as File),
      ...dialogues.filter((d) => d.videoFile).map((d) => d.videoFile as File),
      ...skits.filter((s) => s.videoFile).map((s) => s.videoFile as File),
    ];

    await onSave(
      {
        title: title.trim(),
        game: game.trim(),
        description: description.trim(),
        tags,
        configJson: JSON.stringify({
          ...config,
          systemTag: systemTag === "__all__" ? "" : systemTag,
          cultures: cultures.map((c) => ({
            id: c.id,
            name: c.name,
            language: c.language,
            description: c.description || "",
          })),
          characters: characters.map((c) => ({
            name: c.name,
            role: c.role || "",
            abilities: c.abilities || "",
            backstory: c.backstory || "",
            cultureId: c.cultureId ?? null,
          })),
          dialogues: dialogues.map((d) => ({
            speaker: d.speaker,
            text: d.text,
          })),
          skits: skits.map((s) => ({
            title: s.title,
            location: s.location || "",
          })),
        }),
        scriptText,
        isPublic,
      },
      [...files, ...mediaFiles],
    );
  };

  const updateConfig = <K extends keyof GameConfig>(
    key: K,
    value: GameConfig[K],
  ) => setConfig((prev) => ({ ...prev, [key]: value }));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleDropzoneKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const labelClass = "text-xs text-muted-foreground uppercase tracking-wide";
  const inputClass = "bg-muted/40 border-border";

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Mod Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="mod-title" className={labelClass}>
              Title *
            </Label>
            <Input
              id="mod-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GTA V Speed God Mode"
              className={inputClass}
              data-ocid="creator.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>
              Platform / System <span className="opacity-50">(Optional)</span>
            </Label>
            <Select value={systemTag} onValueChange={setSystemTag}>
              <SelectTrigger className={inputClass} data-ocid="creator.select">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="__all__">All Platforms</SelectItem>
                {[
                  "Xbox",
                  "PlayStation",
                  "PC",
                  "Nintendo Switch",
                  "Android",
                  "iOS",
                  "Other",
                ].map((sys) => (
                  <SelectItem key={sys} value={sys}>
                    {sys}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Game *</Label>
            <Select value={game} onValueChange={setGame}>
              <SelectTrigger className={inputClass} data-ocid="creator.select">
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(userGames || []).length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      From My Library
                    </div>
                    {(userGames || []).map((g) => (
                      <SelectItem key={`lib-${g.id.toString()}`} value={g.name}>
                        {g.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                  </>
                )}
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Popular Games
                </div>
                {GAMES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mod-desc" className={labelClass}>
            Description
          </Label>
          <Textarea
            id="mod-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your mod does..."
            className="bg-muted/40 border-border resize-none h-20"
            data-ocid="creator.textarea"
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add a tag..."
              className="bg-muted/40 border-border flex-1"
              data-ocid="creator.input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTag}
              className="border-border"
              data-ocid="creator.button"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary border-primary/20"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium">Make Public</p>
            <p className="text-xs text-muted-foreground">
              Allow others to find and download this mod
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={setIsPublic}
            data-ocid="creator.switch"
          />
        </div>
      </div>

      {/* Builder tabs */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="bg-muted/30 border border-border w-full grid grid-cols-4 sm:grid-cols-7 h-auto">
          <TabsTrigger
            value="config"
            className="text-xs py-2"
            data-ocid="creator.tab"
          >
            Config
          </TabsTrigger>
          <TabsTrigger
            value="script"
            className="text-xs py-2"
            data-ocid="creator.tab"
          >
            Script
          </TabsTrigger>
          <TabsTrigger
            value="cultures"
            className="text-xs py-2 gap-1"
            data-ocid="creator.tab"
          >
            <Globe className="w-3 h-3 hidden sm:block" />
            Cultures
            {cultures.length > 0 && (
              <span className="ml-0.5 bg-primary/20 text-primary text-[10px] rounded-full px-1.5 py-0">
                {cultures.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="characters"
            className="text-xs py-2"
            data-ocid="creator.tab"
          >
            Characters
          </TabsTrigger>
          <TabsTrigger
            value="dialogues"
            className="text-xs py-2"
            data-ocid="creator.tab"
          >
            Dialogues
          </TabsTrigger>
          <TabsTrigger
            value="skits"
            className="text-xs py-2"
            data-ocid="creator.tab"
          >
            Skits
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="text-xs py-2"
            data-ocid="creator.tab"
          >
            Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <div className="bg-card border border-border rounded-lg p-5 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Game Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs uppercase tracking-wide">
                    Player Speed
                  </Label>
                  <span className="text-xs text-primary font-mono">
                    {config.playerSpeed.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={[config.playerSpeed]}
                  onValueChange={([v]) => updateConfig("playerSpeed", v)}
                  className="[&>span]:bg-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x</span>
                  <span>5x</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs uppercase tracking-wide">
                    Health Multiplier
                  </Label>
                  <span className="text-xs text-primary font-mono">
                    {config.healthMultiplier.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={[config.healthMultiplier]}
                  onValueChange={([v]) => updateConfig("healthMultiplier", v)}
                  className="[&>span]:bg-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x</span>
                  <span>5x</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide">
                  Wanted Level Override
                </Label>
                <Select
                  value={config.wantedLevel}
                  onValueChange={(v) => updateConfig("wantedLevel", v)}
                >
                  <SelectTrigger className="bg-muted/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["default", "disabled", "0", "1", "2", "3", "4", "5"].map(
                      (v) => (
                        <SelectItem key={v} value={v}>
                          {v === "default"
                            ? "Default"
                            : v === "disabled"
                              ? "Disabled"
                              : `${v} Star${v !== "1" ? "s" : ""}`}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide">
                  Weather
                </Label>
                <Select
                  value={config.weather}
                  onValueChange={(v) => updateConfig("weather", v)}
                >
                  <SelectTrigger className="bg-muted/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["Default", "Clear", "Rain", "Storm", "Fog", "Snow"].map(
                      (w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide">
                  Time of Day
                </Label>
                <Select
                  value={config.timeOfDay}
                  onValueChange={(v) => updateConfig("timeOfDay", v)}
                >
                  <SelectTrigger className="bg-muted/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {[
                      "Default",
                      "Dawn",
                      "Morning",
                      "Noon",
                      "Afternoon",
                      "Dusk",
                      "Night",
                      "Midnight",
                    ].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide">
                  Spawn Items
                </Label>
                <Input
                  value={config.spawnItems}
                  onChange={(e) => updateConfig("spawnItems", e.target.value)}
                  placeholder="e.g. WEAPON_PISTOL, HEALTH_PACK"
                  className="bg-muted/40 border-border font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs uppercase tracking-wide">
                  Spawn Vehicles
                </Label>
                <Input
                  value={config.spawnVehicles}
                  onChange={(e) =>
                    updateConfig("spawnVehicles", e.target.value)
                  }
                  placeholder="e.g. adder, infernus, zentorno"
                  className="bg-muted/40 border-border font-mono text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
              {[
                {
                  key: "godMode" as const,
                  label: "God Mode",
                  desc: "Invincible player",
                },
                {
                  key: "infiniteAmmo" as const,
                  label: "Infinite Ammo",
                  desc: "Never run out",
                },
                {
                  key: "noClip" as const,
                  label: "No Clip",
                  desc: "Walk through walls",
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border"
                >
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={config[key]}
                    onCheckedChange={(v) => updateConfig(key, v)}
                    data-ocid="creator.switch"
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="script">
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Script Editor
            </h3>
            <p className="text-xs text-muted-foreground">
              Write custom mod scripts. Use Lua, JavaScript, or game-specific
              syntax.
            </p>
            <Textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder={
                '-- Example Lua script for GTA V\nfunction onModLoaded()\n  SetPlayerSpeed(2.0)\n  SetWeather("EXTRASUNNY")\nend'
              }
              className="bg-background border-border font-mono text-sm resize-none min-h-[320px] text-primary placeholder:text-muted-foreground/40"
              data-ocid="creator.editor"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{scriptText.length} characters</span>
              <span>&middot;</span>
              <span>{scriptText.split("\n").length} lines</span>
            </div>
          </div>
        </TabsContent>

        {/* Cultures & Groups Tab */}
        <TabsContent value="cultures">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Cultures &amp; Groups
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Define cultural groups for your mod. Each group has a name,
                  language, and optional description. Assign groups to
                  characters in the Characters tab.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCulture}
                className="border-border gap-1.5 flex-shrink-0"
                data-ocid="creator.button"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Group
              </Button>
            </div>

            {cultures.length === 0 && (
              <div
                className="text-center py-12 border border-dashed border-border rounded-lg space-y-3"
                data-ocid="creator.empty_state"
              >
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    No culture groups yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add groups like &ldquo;French Tourists&rdquo;,
                    &ldquo;Cartel&rdquo;, or &ldquo;Tokyo Visitors&rdquo; with
                    their spoken language
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCulture}
                  className="border-border gap-1.5"
                  data-ocid="creator.button"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Your First Group
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {cultures.map((culture, idx) => (
                <div
                  key={culture.id}
                  className="p-4 bg-muted/20 border border-border rounded-lg space-y-3"
                  data-ocid={`creator.item.${idx + 1}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className={labelClass}>Group Name *</Label>
                        <Input
                          value={culture.name}
                          onChange={(e) =>
                            updateCulture(culture.id, "name", e.target.value)
                          }
                          placeholder="e.g. French Tourists, Cartel, Tokyo Visitors"
                          className={inputClass}
                          data-ocid="creator.input"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClass}>Language *</Label>
                        {customLanguageId === culture.id ? (
                          <div className="flex gap-1.5">
                            <Input
                              value={culture.language}
                              onChange={(e) =>
                                updateCulture(
                                  culture.id,
                                  "language",
                                  e.target.value,
                                )
                              }
                              placeholder="Type a language..."
                              className={inputClass}
                              autoFocus
                              data-ocid="creator.input"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-border px-2 flex-shrink-0"
                              onClick={() => setCustomLanguageId(null)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={
                              COMMON_LANGUAGES.includes(culture.language)
                                ? culture.language
                                : culture.language
                                  ? "__custom__"
                                  : ""
                            }
                            onValueChange={(v) => {
                              if (v === "__custom__") {
                                setCustomLanguageId(culture.id);
                                updateCulture(culture.id, "language", "");
                              } else {
                                updateCulture(culture.id, "language", v);
                              }
                            }}
                          >
                            <SelectTrigger
                              className={inputClass}
                              data-ocid="creator.select"
                            >
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {COMMON_LANGUAGES.map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                  {lang}
                                </SelectItem>
                              ))}
                              <SelectItem value="__custom__">
                                ✏️ Type custom language...
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCulture(culture.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0 mt-5"
                      data-ocid="creator.delete_button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <Label className={labelClass}>
                      Description <span className="opacity-50">(Optional)</span>
                    </Label>
                    <Input
                      value={culture.description || ""}
                      onChange={(e) =>
                        updateCulture(culture.id, "description", e.target.value)
                      }
                      placeholder="e.g. A group of tourists visiting from Paris"
                      className={inputClass}
                      data-ocid="creator.input"
                    />
                  </div>

                  {/* Preview badge */}
                  {(culture.name || culture.language) && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                        <Globe className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary font-medium">
                          {culture.name || "Unnamed Group"}
                        </span>
                        {culture.language && (
                          <>
                            <span className="text-primary/40 text-xs">·</span>
                            <span className="text-xs text-primary/70">
                              {culture.language}
                            </span>
                          </>
                        )}
                      </div>
                      {/* Show how many characters are in this group */}
                      {characters.filter((c) => c.cultureId === culture.id)
                        .length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {
                            characters.filter((c) => c.cultureId === culture.id)
                              .length
                          }{" "}
                          character
                          {characters.filter((c) => c.cultureId === culture.id)
                            .length !== 1
                            ? "s"
                            : ""}{" "}
                          assigned
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {cultures.length > 0 && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                💡 Tip: Go to the <strong>Characters</strong> tab to assign
                these groups to your NPCs.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Characters Tab */}
        <TabsContent value="characters">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Characters &amp; NPCs
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Define characters or NPCs that appear in your mod. All fields
                  optional.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCharacter}
                className="border-border gap-1.5"
                data-ocid="creator.button"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Character
              </Button>
            </div>

            {characters.length === 0 && (
              <div
                className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-lg"
                data-ocid="creator.empty_state"
              >
                No characters yet. Click &ldquo;Add Character&rdquo; to get
                started.
              </div>
            )}

            <div className="space-y-4">
              {characters.map((char, idx) => (
                <div
                  key={char.id}
                  className="p-4 bg-muted/20 border border-border rounded-lg space-y-4"
                  data-ocid={`creator.item.${idx + 1}`}
                >
                  {/* Photo + Name row */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {char.photoPreview ? (
                        <img
                          src={char.photoPreview}
                          alt={char.name || "Character"}
                          className="w-20 h-20 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                          No photo
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <Label className={labelClass}>Name</Label>
                        <Input
                          value={char.name}
                          onChange={(e) =>
                            updateCharacter(char.id, "name", e.target.value)
                          }
                          placeholder="e.g. Franklin Clinton"
                          className={inputClass}
                          data-ocid="creator.input"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className={labelClass}>
                          Photo <span className="opacity-50">(Optional)</span>
                        </Label>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-border text-xs gap-1.5"
                            onClick={() =>
                              characterPhotoRefs.current[idx]?.click()
                            }
                            data-ocid="creator.upload_button"
                          >
                            <Upload className="w-3 h-3" />
                            {char.photoFile ? "Change" : "Upload"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-border text-xs gap-1.5"
                            onClick={() => setPhotoCaptureCharId(char.id)}
                            data-ocid="creator.upload_button"
                          >
                            <Camera className="w-3 h-3" />
                            Camera
                          </Button>
                          {char.photoFile && (
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {char.photoFile.name}
                            </span>
                          )}
                          <input
                            ref={(el) => {
                              characterPhotoRefs.current[idx] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCharacterPhoto(char.id, file);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCharacter(char.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      data-ocid="creator.delete_button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Role + Abilities + Culture row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className={labelClass}>
                        Role <span className="opacity-50">(Optional)</span>
                      </Label>
                      <Input
                        value={char.role || ""}
                        onChange={(e) =>
                          updateCharacter(char.id, "role", e.target.value)
                        }
                        placeholder="e.g. Street Racer, Hacker"
                        className={inputClass}
                        data-ocid="creator.input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className={labelClass}>
                        Abilities <span className="opacity-50">(Optional)</span>
                      </Label>
                      <Input
                        value={char.abilities || ""}
                        onChange={(e) =>
                          updateCharacter(char.id, "abilities", e.target.value)
                        }
                        placeholder="e.g. Expert driver"
                        className={inputClass}
                        data-ocid="creator.input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className={labelClass}>
                        Culture Group{" "}
                        <span className="opacity-50">(Optional)</span>
                      </Label>
                      {cultures.length === 0 ? (
                        <div className="flex items-center gap-1.5 h-9 px-3 bg-muted/20 border border-dashed border-border rounded-md">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Add groups in Cultures tab
                          </span>
                        </div>
                      ) : (
                        <Select
                          value={
                            char.cultureId != null
                              ? String(char.cultureId)
                              : "__none__"
                          }
                          onValueChange={(v) =>
                            updateCharacter(
                              char.id,
                              "cultureId",
                              v === "__none__" ? null : Number(v),
                            )
                          }
                        >
                          <SelectTrigger
                            className={inputClass}
                            data-ocid="creator.select"
                          >
                            <SelectValue placeholder="No group" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="__none__">
                              — No group —
                            </SelectItem>
                            {cultures.map((cult) => (
                              <SelectItem key={cult.id} value={String(cult.id)}>
                                <span className="flex items-center gap-2">
                                  <Globe className="w-3 h-3" />
                                  {cult.name || "Unnamed Group"}
                                  {cult.language && (
                                    <span className="text-muted-foreground">
                                      ({cult.language})
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {/* Show culture badge if assigned */}
                  {char.cultureId != null &&
                    (() => {
                      const cult = cultures.find(
                        (c) => c.id === char.cultureId,
                      );
                      if (!cult) return null;
                      return (
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="bg-accent/10 text-accent border-accent/20 text-xs gap-1"
                          >
                            <Globe className="w-3 h-3" />
                            {cult.name}
                            {cult.language && ` · ${cult.language}`}
                          </Badge>
                        </div>
                      );
                    })()}

                  {/* Backstory */}
                  <div className="space-y-1">
                    <Label className={labelClass}>
                      Backstory <span className="opacity-50">(Optional)</span>
                    </Label>
                    <Textarea
                      value={char.backstory || ""}
                      onChange={(e) =>
                        updateCharacter(char.id, "backstory", e.target.value)
                      }
                      placeholder="Character background, story, motivations..."
                      className="bg-muted/40 border-border resize-none h-16"
                      data-ocid="creator.textarea"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo capture modal for characters */}
          <PhotoCapture
            open={photoCaptureCharId !== null}
            onClose={() => setPhotoCaptureCharId(null)}
            onCapture={(file) => {
              if (photoCaptureCharId !== null) {
                handleCharacterPhoto(photoCaptureCharId, file);
              }
              setPhotoCaptureCharId(null);
            }}
          />
        </TabsContent>

        {/* Dialogues Tab */}
        <TabsContent value="dialogues">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Dialogues
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Add dialogue lines with optional video clips.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDialogue}
                className="border-border gap-1.5"
                data-ocid="creator.button"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Dialogue Line
              </Button>
            </div>

            {dialogues.length === 0 && (
              <div
                className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-lg"
                data-ocid="creator.empty_state"
              >
                No dialogue lines yet. Click &ldquo;Add Dialogue Line&rdquo; to
                get started.
              </div>
            )}

            <div className="space-y-4">
              {dialogues.map((dia, idx) => (
                <div
                  key={dia.id}
                  className="p-4 bg-muted/20 border border-border rounded-lg space-y-3"
                  data-ocid={`creator.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className={labelClass}>Speaker</Label>
                        <Input
                          value={dia.speaker}
                          onChange={(e) =>
                            updateDialogue(dia.id, "speaker", e.target.value)
                          }
                          placeholder="e.g. Trevor"
                          className={inputClass}
                          data-ocid="creator.input"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClass}>
                          Video Clip (Optional)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-border text-xs gap-1.5"
                            onClick={() =>
                              dialogueVideoRefs.current[idx]?.click()
                            }
                            data-ocid="creator.upload_button"
                          >
                            <Upload className="w-3 h-3" />
                            {dia.videoFile ? "Change Video" : "Upload Video"}
                          </Button>
                          {dia.videoFile && (
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {dia.videoFile.name}
                            </span>
                          )}
                          <input
                            ref={(el) => {
                              dialogueVideoRefs.current[idx] = el;
                            }}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDialogueVideo(dia.id, file);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDialogue(dia.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      data-ocid="creator.delete_button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <Label className={labelClass}>Dialogue Text</Label>
                    <Textarea
                      value={dia.text}
                      onChange={(e) =>
                        updateDialogue(dia.id, "text", e.target.value)
                      }
                      placeholder="Enter the dialogue line..."
                      className="bg-muted/40 border-border resize-none h-20"
                      data-ocid="creator.textarea"
                    />
                  </div>

                  {dia.videoPreview && (
                    <video
                      src={dia.videoPreview}
                      controls
                      muted
                      className="w-full max-h-40 rounded mt-2 border border-border"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Skits Tab */}
        <TabsContent value="skits">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Skits
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload real-world video clips mapped to in-game locations.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSkit}
                className="border-border gap-1.5"
                data-ocid="creator.button"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Skit
              </Button>
            </div>

            {skits.length === 0 && (
              <div
                className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-lg"
                data-ocid="creator.empty_state"
              >
                No skits yet. Click &ldquo;Add Skit&rdquo; to get started.
              </div>
            )}

            <div className="space-y-4">
              {skits.map((skit, idx) => (
                <div
                  key={skit.id}
                  className="p-4 bg-muted/20 border border-border rounded-lg space-y-3"
                  data-ocid={`creator.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className={labelClass}>Skit Title</Label>
                        <Input
                          value={skit.title}
                          onChange={(e) =>
                            updateSkit(skit.id, "title", e.target.value)
                          }
                          placeholder="e.g. Coffee Shop Scene"
                          className={inputClass}
                          data-ocid="creator.input"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClass}>
                          In-Game Location (Optional)
                        </Label>
                        <Input
                          value={skit.location || ""}
                          onChange={(e) =>
                            updateSkit(skit.id, "location", e.target.value)
                          }
                          placeholder="e.g. the corner store, Grove Street"
                          className={inputClass}
                          data-ocid="creator.input"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSkit(skit.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      data-ocid="creator.delete_button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <Label className={labelClass}>
                      Video Upload (Optional)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-border text-xs gap-1.5"
                        onClick={() => skitVideoRefs.current[idx]?.click()}
                        data-ocid="creator.upload_button"
                      >
                        <Upload className="w-3 h-3" />
                        {skit.videoFile ? "Change Video" : "Upload Video"}
                      </Button>
                      {skit.videoFile && (
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {skit.videoFile.name}
                        </span>
                      )}
                      <input
                        ref={(el) => {
                          skitVideoRefs.current[idx] = el;
                        }}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSkitVideo(skit.id, file);
                        }}
                      />
                    </div>
                  </div>

                  {skit.videoPreview && (
                    <video
                      src={skit.videoPreview}
                      controls
                      muted
                      className="w-full max-h-40 rounded mt-2 border border-border"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              File Attachments
            </h3>
            <p className="text-xs text-muted-foreground">
              Attach mod files (DLL, asi, xml, etc.) to package with your mod.
            </p>
            <button
              type="button"
              className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={handleDropzoneKeyDown}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-ocid="creator.dropzone"
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Drop files here or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports all file types
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                data-ocid="creator.upload_button"
              />
            </button>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, fileIdx) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-md border border-border"
                  >
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(fileIdx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {initialMod && initialMod.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Existing Attachments
                </p>
                {initialMod.attachments.map((_att, attIdx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: ExternalBlob has no stable id
                    key={`att-${attIdx}`}
                    className="flex items-center gap-3 p-2.5 bg-muted/20 rounded-md border border-border"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate text-muted-foreground">
                      attachment-{attIdx + 1}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Saved
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="gradient-primary text-white border-0 hover:opacity-90 px-8"
          data-ocid="creator.submit_button"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : initialMod ? (
            "Update Mod"
          ) : (
            "Publish Mod"
          )}
        </Button>
      </div>
    </div>
  );
}
