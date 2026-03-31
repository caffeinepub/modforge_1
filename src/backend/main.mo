import Time "mo:core/Time";
import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";



actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  // User profiles with full character card
  public type UserProfile = {
    name : Text;
    characterName : ?Text;
    role : ?Text;
    abilities : ?Text;
    backstory : ?Text;
    photoUrl : ?Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── User Games Library ──────────────────────────────────────────────────────

  public type GameId = Nat;

  public type UserGame = {
    id : GameId;
    name : Text;
    platform : Text; // "mobile" | "pc" | "console" | "other"
    addedAt : Int;
  };

  // Maps principal -> list of UserGame
  let userGames = Map.empty<Principal, List.List<UserGame>>();
  var nextGameId : GameId = 1;

  public shared ({ caller }) func addUserGame(name : Text, platform : Text) : async GameId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage their game library");
    };
    let id = nextGameId;
    nextGameId += 1;
    let newGame : UserGame = { id; name; platform; addedAt = Time.now() };
    let existing = switch (userGames.get(caller)) {
      case (null) { List.empty<UserGame>() };
      case (?lst) { lst };
    };
    existing.add(newGame);
    userGames.add(caller, existing);
    id;
  };

  public shared ({ caller }) func removeUserGame(gameId : GameId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage their game library");
    };
    switch (userGames.get(caller)) {
      case (null) {};
      case (?lst) {
        let filtered = List.fromIter<UserGame>(lst.values().filter(func(g : UserGame) : Bool { g.id != gameId }));
        userGames.add(caller, filtered);
      };
    };
  };

  public query ({ caller }) func listUserGames() : async [UserGame] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their game library");
    };
    switch (userGames.get(caller)) {
      case (null) { [] };
      case (?lst) { lst.toArray() };
    };
  };

  // ── Mods ────────────────────────────────────────────────────────────────────

  type ModId = Nat;
  type Game = Text;
  type Tag = Text;

  module Mod {
    public func compare(mod1 : Mod, mod2 : Mod) : Order.Order {
      Nat.compare(mod1.id, mod2.id);
    };
  };

  type Mod = {
    id : ModId;
    owner : Principal;
    title : Text;
    description : Text;
    game : Game;
    tags : [Tag];
    configJson : Text;
    scriptText : Text;
    isEnabled : Bool;
    isPublic : Bool;
    createdAt : Int;
    modifiedAt : Int;
    attachments : [Storage.ExternalBlob];
  };

  type ModInput = {
    title : Text;
    description : Text;
    game : Game;
    tags : [Tag];
    configJson : Text;
    scriptText : Text;
    isPublic : Bool;
  };

  type ModUpdate = {
    title : ?Text;
    description : ?Text;
    game : ?Game;
    tags : ?[Tag];
    configJson : ?Text;
    scriptText : ?Text;
    isPublic : ?Bool;
  };

  func compareByTimestamp(mod1 : Mod, mod2 : Mod) : Order.Order {
    Int.compare(mod2.createdAt, mod1.createdAt);
  };

  let mods = Map.empty<ModId, Mod>();
  var nextModId : ModId = 1;

  func getModInternal(id : ModId) : Mod {
    switch (mods.get(id)) {
      case (null) { Runtime.trap("Mod not found") };
      case (?modData) { modData };
    };
  };

  func checkOwnerOrAdmin(caller : Principal, mod : Mod) {
    if (caller != mod.owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only mod owner or admin can perform this action");
    };
  };

  func canViewMod(caller : Principal, mod : Mod) : Bool {
    mod.isPublic or caller == mod.owner or AccessControl.isAdmin(accessControlState, caller);
  };

  public shared ({ caller }) func createMod(input : ModInput) : async ModId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create mods");
    };
    let id = nextModId;
    nextModId += 1;
    let modData : Mod = {
      id;
      owner = caller;
      title = input.title;
      description = input.description;
      game = input.game;
      tags = input.tags;
      configJson = input.configJson;
      scriptText = input.scriptText;
      isEnabled = true;
      isPublic = input.isPublic;
      createdAt = Time.now();
      modifiedAt = Time.now();
      attachments = [];
    };
    mods.add(id, modData);
    id;
  };

  public query ({ caller }) func getMod(id : ModId) : async ?Mod {
    let modData = getModInternal(id);
    if (not canViewMod(caller, modData)) {
      Runtime.trap("Unauthorized: Cannot view private mod");
    };
    ?modData;
  };

  public shared ({ caller }) func updateMod(id : ModId, update : ModUpdate) : async () {
    let existing = getModInternal(id);
    checkOwnerOrAdmin(caller, existing);
    let updated : Mod = {
      existing with
      title = switch (update.title) {
        case (null) { existing.title };
        case (?title) { title };
      };
      description = switch (update.description) {
        case (null) { existing.description };
        case (?desc) { desc };
      };
      game = switch (update.game) {
        case (null) { existing.game };
        case (?game) { game };
      };
      tags = switch (update.tags) {
        case (null) { existing.tags };
        case (?tags) { tags };
      };
      configJson = switch (update.configJson) {
        case (null) { existing.configJson };
        case (?json) { json };
      };
      scriptText = switch (update.scriptText) {
        case (null) { existing.scriptText };
        case (?script) { script };
      };
      isPublic = switch (update.isPublic) {
        case (null) { existing.isPublic };
        case (?isPublic) { isPublic };
      };
      modifiedAt = Time.now();
    };
    mods.add(id, updated);
  };

  public shared ({ caller }) func deleteMod(id : ModId) : async () {
    let modToDelete = getModInternal(id);
    checkOwnerOrAdmin(caller, modToDelete);
    mods.remove(id);
  };

  public query ({ caller }) func listMyMods() : async [Mod] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list their mods");
    };
    mods.values().toArray().filter(
      func(m) {
        m.owner == caller;
      }
    );
  };

  public query ({ caller }) func listPublicMods() : async [Mod] {
    mods.values().toArray().filter(
      func(m) {
        m.isPublic;
      }
    ).sort(compareByTimestamp);
  };

  public query ({ caller }) func searchMods(searchTerm : Text) : async [Mod] {
    let term = searchTerm.toLower();
    mods.values().toArray().filter(
      func(m) {
        m.isPublic and (
          m.title.toLower().contains(#text term) or
          m.description.toLower().contains(#text term) or
          m.game.toLower().contains(#text term)
        );
      }
    ).sort(compareByTimestamp);
  };

  public query ({ caller }) func getModsByGame(game : Game) : async [Mod] {
    let gameLower = game.toLower();
    mods.values().toArray().filter(
      func(m) {
        m.isPublic and (m.game.toLower() == gameLower);
      }
    );
  };

  public query ({ caller }) func getModsByTag(tag : Tag) : async [Mod] {
    let tagLower = tag.toLower();
    mods.values().toArray().filter(
      func(m) {
        m.isPublic and m.tags.find(func(t) { t.toLower() == tagLower }) != null;
      }
    );
  };

  public shared ({ caller }) func toggleModEnabled(id : ModId) : async Bool {
    let modData = getModInternal(id);
    checkOwnerOrAdmin(caller, modData);
    let newModData = {
      modData with
      isEnabled = not modData.isEnabled;
      modifiedAt = Time.now();
    };
    mods.add(id, newModData);
    newModData.isEnabled;
  };

  public shared ({ caller }) func addModAttachment(modId : ModId, blob : Storage.ExternalBlob) : async () {
    let modData = getModInternal(modId);
    checkOwnerOrAdmin(caller, modData);
    let newAttachments = modData.attachments.concat([blob]);
    mods.add(
      modId,
      {
        modData with
        attachments = newAttachments;
        modifiedAt = Time.now();
      },
    );
  };

  public shared ({ caller }) func removeModAttachment(_modId : ModId, _blobId : Text) : async () {
    ();
  };

  public query ({ caller }) func getModAttachments(modId : ModId) : async [Storage.ExternalBlob] {
    let modData = getModInternal(modId);
    if (not canViewMod(caller, modData)) {
      Runtime.trap("Unauthorized: Cannot view attachments of private mod");
    };
    modData.attachments;
  };

  public query ({ caller }) func getPopularGames() : async [Game] {
    let gameList = List.empty<Game>();
    mods.values().forEach(
      func(m) {
        if (m.isPublic and not gameList.values().any(func(g) { g == m.game })) {
          gameList.add(m.game);
        };
      }
    );
    gameList.toArray();
  };

  public query ({ caller }) func getPopularTags() : async [Tag] {
    let tagList = List.empty<Tag>();
    mods.values().forEach(
      func(m) {
        if (m.isPublic) {
          m.tags.forEach(
            func(t) {
              if (not tagList.values().any(func(existing) { existing == t })) {
                tagList.add(t);
              };
            }
          );
        };
      }
    );
    tagList.toArray();
  };

  public query ({ caller }) func getModStats() : async {
    totalMods : Nat;
    publicMods : Nat;
    totalGames : Nat;
    totalTags : Nat;
  } {
    var totalMods = 0;
    var publicMods = 0;
    let gameSet = List.empty<Game>();
    let tagSet = List.empty<Tag>();

    mods.values().forEach(
      func(m) {
        totalMods += 1;
        if (m.isPublic) {
          publicMods += 1;
          if (not gameSet.values().any(func(existing) { existing == m.game })) {
            gameSet.add(m.game);
          };
          m.tags.forEach(
            func(t) {
              if (not tagSet.values().any(func(existing) { existing == t })) {
                tagSet.add(t);
              };
            }
          );
        };
      }
    );

    {
      totalMods;
      publicMods;
      totalGames = gameSet.size();
      totalTags = tagSet.size();
    };
  };

  public query ({ caller }) func getDownloadInfo(modId : ModId) : async {
    mod : Mod;
    attachments : [Storage.ExternalBlob];
  } {
    let modData = getModInternal(modId);
    if (not canViewMod(caller, modData)) {
      Runtime.trap("Unauthorized: Cannot download private mod");
    };
    {
      mod = modData;
      attachments = modData.attachments;
    };
  };

  public query func getAllMods() : async [Mod] {
    mods.values().toArray().sort();
  };

  public query ({ caller }) func getMyModIds() : async [ModId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list their mod IDs");
    };
    mods.values().toArray().filter(
      func(m) {
        m.owner == caller;
      }
    ).map(
      func(m) { m.id }
    );
  };
};
