import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ModInput {
    title: string;
    game: Game;
    scriptText: string;
    tags: Array<Tag>;
    description: string;
    configJson: string;
    isPublic: boolean;
}
export interface Rating {
    modId: string;
    createdAt: bigint;
    stars: bigint;
    rater: Principal;
}
export type Game = string;
export interface Comment {
    id: string;
    modId: string;
    createdAt: bigint;
    text: string;
    authorName: string;
    author: Principal;
}
export interface UserGame {
    id: GameId;
    name: string;
    platform: string;
    addedAt: bigint;
}
export interface ModUpdate {
    title?: string;
    game?: Game;
    scriptText?: string;
    tags?: Array<Tag>;
    description?: string;
    configJson?: string;
    isPublic?: boolean;
}
export type ModId = bigint;
export interface Mod {
    id: ModId;
    title: string;
    owner: Principal;
    modifiedAt: bigint;
    game: Game;
    scriptText: string;
    createdAt: bigint;
    tags: Array<Tag>;
    description: string;
    configJson: string;
    isEnabled: boolean;
    isPublic: boolean;
    attachments: Array<ExternalBlob>;
}
export type Tag = string;
export type GameId = bigint;
export interface UserProfile {
    characterName?: string;
    name: string;
    role?: string;
    photoUrl?: string;
    backstory?: string;
    abilities?: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addModAttachment(modId: ModId, blob: ExternalBlob): Promise<void>;
    addUserGame(name: string, platform: string): Promise<GameId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMod(input: ModInput): Promise<ModId>;
    deleteComment(commentId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteMod(id: ModId): Promise<void>;
    getAllMods(): Promise<Array<Mod>>;
    getAverageRating(modId: string): Promise<number>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsForMod(modId: string): Promise<Array<Comment>>;
    getDownloadInfo(modId: ModId): Promise<{
        mod: Mod;
        attachments: Array<ExternalBlob>;
    }>;
    getMod(id: ModId): Promise<Mod | null>;
    getModAttachments(modId: ModId): Promise<Array<ExternalBlob>>;
    getModStats(): Promise<{
        publicMods: bigint;
        totalMods: bigint;
        totalTags: bigint;
        totalGames: bigint;
    }>;
    getModsByGame(game: Game): Promise<Array<Mod>>;
    getModsByTag(tag: Tag): Promise<Array<Mod>>;
    getMyModIds(): Promise<Array<ModId>>;
    getPopularGames(): Promise<Array<Game>>;
    getPopularTags(): Promise<Array<Tag>>;
    getRatingsForMod(modId: string): Promise<Array<Rating>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listMyMods(): Promise<Array<Mod>>;
    listPublicMods(): Promise<Array<Mod>>;
    listUserGames(): Promise<Array<UserGame>>;
    removeModAttachment(_modId: ModId, _blobId: string): Promise<void>;
    removeUserGame(gameId: GameId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchMods(searchTerm: string): Promise<Array<Mod>>;
    submitComment(modId: string, commentText: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitRating(modId: string, stars: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    toggleModEnabled(id: ModId): Promise<boolean>;
    updateMod(id: ModId, update: ModUpdate): Promise<void>;
}
