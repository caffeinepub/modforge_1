import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Game,
  ModId,
  ModInput,
  ModUpdate,
  Tag,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export type GameId = bigint;
export interface UserGame {
  id: GameId;
  name: string;
  platform: string;
  addedAt: bigint;
}

export function usePublicMods() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["publicMods"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPublicMods();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyMods() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myMods"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyMods();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMod(id: ModId | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["mod", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getMod(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useModStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["modStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getModStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchMods(term: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["searchMods", term],
    queryFn: async () => {
      if (!actor || !term.trim()) return [];
      return actor.searchMods(term);
    },
    enabled: !!actor && !isFetching && !!term.trim(),
  });
}

export function useModsByGame(game: Game | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["modsByGame", game],
    queryFn: async () => {
      if (!actor || !game) return [];
      return actor.getModsByGame(game);
    },
    enabled: !!actor && !isFetching && !!game,
  });
}

export function usePopularGames() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["popularGames"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPopularGames();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePopularTags() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["popularTags"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPopularTags();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserGames() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userGames"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listUserGames() as Promise<UserGame[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddUserGame() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      platform,
    }: { name: string; platform: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return (actor as any).addUserGame(name, platform) as Promise<GameId>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userGames"] });
    },
  });
}

export function useRemoveUserGame() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (gameId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return (actor as any).removeUserGame(gameId) as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userGames"] });
    },
  });
}

export function useCreateMod() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ModInput) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createMod(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myMods"] });
      qc.invalidateQueries({ queryKey: ["publicMods"] });
    },
  });
}

export function useUpdateMod() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, update }: { id: ModId; update: ModUpdate }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateMod(id, update);
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["myMods"] });
      qc.invalidateQueries({ queryKey: ["mod", id.toString()] });
      qc.invalidateQueries({ queryKey: ["publicMods"] });
    },
  });
}

export function useDeleteMod() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: ModId) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteMod(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myMods"] });
      qc.invalidateQueries({ queryKey: ["publicMods"] });
    },
  });
}

export function useToggleModEnabled() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: ModId) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.toggleModEnabled(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myMods"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}
