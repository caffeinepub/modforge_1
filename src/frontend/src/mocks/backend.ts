import type { backendInterface, Mod, UserGame, UserProfile, UserRole, _CaffeineStorageCreateCertificateResult, _CaffeineStorageRefillInformation, _CaffeineStorageRefillResult } from "../backend";

const samplePrincipal = { toText: () => "aaaaa-aa", isAnonymous: () => false } as any;

const sampleMods: Mod[] = [
  {
    id: BigInt(1),
    title: "Cyberpunk Night City Overhaul",
    owner: samplePrincipal,
    modifiedAt: BigInt(Date.now() * 1000000),
    game: "Cyberpunk 2077",
    scriptText: "",
    createdAt: BigInt(Date.now() * 1000000),
    tags: ["Xbox", "PC", "graphics"],
    description: "Complete visual overhaul for Night City with neon-drenched streets",
    configJson: JSON.stringify({ brightness: 1.2, neonIntensity: 0.9 }),
    isEnabled: true,
    isPublic: true,
    attachments: [],
  },
  {
    id: BigInt(2),
    title: "Minecraft PE Ultra Shaders",
    owner: samplePrincipal,
    modifiedAt: BigInt(Date.now() * 1000000),
    game: "Minecraft Pocket Edition",
    scriptText: "",
    createdAt: BigInt(Date.now() * 1000000),
    tags: ["Android", "iOS"],
    description: "Beautiful shader pack for Minecraft on mobile devices",
    configJson: JSON.stringify({ shadows: true, reflections: true }),
    isEnabled: false,
    isPublic: true,
    attachments: [],
  },
  {
    id: BigInt(3),
    title: "GTA V Realistic Weather",
    owner: samplePrincipal,
    modifiedAt: BigInt(Date.now() * 1000000),
    game: "GTA V",
    scriptText: "// weather mod script\nconsole.log('Weather mod loaded');",
    createdAt: BigInt(Date.now() * 1000000),
    tags: ["PlayStation", "Xbox", "PC"],
    description: "Realistic storm and weather effects for Los Santos",
    configJson: JSON.stringify({ rainIntensity: 0.8, fogDensity: 0.3 }),
    isEnabled: true,
    isPublic: true,
    attachments: [],
  },
  {
    id: BigInt(4),
    title: "Zelda Breath of the Wild HD Pack",
    owner: samplePrincipal,
    modifiedAt: BigInt(Date.now() * 1000000),
    game: "The Legend of Zelda: BOTW",
    scriptText: "",
    createdAt: BigInt(Date.now() * 1000000),
    tags: ["Switch"],
    description: "High-definition texture pack for Nintendo Switch",
    configJson: JSON.stringify({ textureResolution: "4K" }),
    isEnabled: true,
    isPublic: true,
    attachments: [],
  },
];

const sampleUserGames: UserGame[] = [
  { id: BigInt(1), name: "Minecraft Pocket Edition", platform: "Android", addedAt: BigInt(Date.now() * 1000000) },
  { id: BigInt(2), name: "GTA V", platform: "PlayStation", addedAt: BigInt(Date.now() * 1000000) },
  { id: BigInt(3), name: "Cyberpunk 2077", platform: "PC", addedAt: BigInt(Date.now() * 1000000) },
];

const sampleUserProfile: UserProfile = {
  name: "ModForge User",
  characterName: "NightHawk",
  role: "Mod Creator",
  abilities: "Scripting, Config Building, File Management",
  backstory: "A veteran modder from the early days of open-world gaming",
  photoUrl: undefined,
};

export const mockBackend: backendInterface = {
  // Storage extension methods (no-ops in mock)
  _caffeineStorageBlobIsLive: async () => false,
  _caffeineStorageBlobsToDelete: async () => [],
  _caffeineStorageConfirmBlobDeletion: async () => undefined,
  _caffeineStorageCreateCertificate: async (_hash: string): Promise<_CaffeineStorageCreateCertificateResult> => ({ method: "mock", blob_hash: _hash }),
  _caffeineStorageRefillCashier: async (_info: _CaffeineStorageRefillInformation | null): Promise<_CaffeineStorageRefillResult> => ({ success: true, topped_up_amount: BigInt(0) }),
  _caffeineStorageUpdateGatewayPrincipals: async () => undefined,
  _initializeAccessControlWithSecret: async () => undefined,
  addModAttachment: async () => undefined,
  addUserGame: async (_name, _platform) => BigInt(Math.floor(Math.random() * 1000)),
  assignCallerUserRole: async () => undefined,
  createMod: async (_input) => BigInt(sampleMods.length + 1),
  deleteMod: async () => undefined,
  getAllMods: async () => sampleMods,
  getAverageRating: async () => 0,
  getCallerUserProfile: async () => sampleUserProfile,
  getCallerUserRole: async () => "user" as unknown as UserRole,
  getCommentsForMod: async () => [],
  getDownloadInfo: async (modId) => ({
    mod: sampleMods.find((m) => m.id === modId) || sampleMods[0],
    attachments: [],
  }),
  getMod: async (id) => sampleMods.find((m) => m.id === id) || null,
  getModAttachments: async () => [],
  getModStats: async () => ({
    publicMods: BigInt(sampleMods.length),
    totalMods: BigInt(sampleMods.length),
    totalTags: BigInt(12),
    totalGames: BigInt(4),
  }),
  getModsByGame: async (game) => sampleMods.filter((m) => m.game.toLowerCase() === game.toLowerCase()),
  getModsByTag: async (tag) => sampleMods.filter((m) => m.tags.some((t) => t.toLowerCase() === tag.toLowerCase())),
  getMyModIds: async () => sampleMods.map((m) => m.id),
  getPopularGames: async () => ["Cyberpunk 2077", "Minecraft Pocket Edition", "GTA V", "The Legend of Zelda: BOTW"],
  getPopularTags: async () => ["Xbox", "PlayStation", "PC", "Android", "iOS", "Switch", "graphics", "weather"],
  getRatingsForMod: async () => [],
  getUserProfile: async () => sampleUserProfile,
  isCallerAdmin: async () => false,
  listMyMods: async () => sampleMods,
  listPublicMods: async () => sampleMods,
  listUserGames: async () => sampleUserGames,
  removeModAttachment: async () => undefined,
  removeUserGame: async () => undefined,
  saveCallerUserProfile: async () => undefined,
  searchMods: async (term) =>
    sampleMods.filter(
      (m) =>
        m.title.toLowerCase().includes(term.toLowerCase()) ||
        m.game.toLowerCase().includes(term.toLowerCase()) ||
        m.description.toLowerCase().includes(term.toLowerCase())
    ),
  submitComment: async () => ({ __kind__: "ok" as const, ok: "mock-comment-id" }),
  submitRating: async () => ({ __kind__: "ok" as const, ok: null }),
  deleteComment: async () => ({ __kind__: "ok" as const, ok: null }),
  toggleModEnabled: async (id) => {
    const mod = sampleMods.find((m) => m.id === id);
    return mod ? !mod.isEnabled : false;
  },
  updateMod: async () => undefined,
};
