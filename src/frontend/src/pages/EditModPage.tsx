import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { ModInput } from "../backend";
import { ExternalBlob } from "../backend";
import AuthGuard from "../components/AuthGuard";
import ModCreator from "../components/ModCreator";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMod, useUpdateMod } from "../hooks/useQueries";

export default function EditModPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const modId = BigInt(id || "0");
  const { data: mod, isLoading, isError } = useMod(modId);
  const updateMod = useUpdateMod();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const router = useRouter();

  const handleSave = async (input: ModInput, files: File[]) => {
    try {
      await updateMod.mutateAsync({
        id: modId,
        update: {
          title: input.title,
          game: input.game,
          description: input.description,
          tags: input.tags,
          configJson: input.configJson,
          scriptText: input.scriptText,
          isPublic: input.isPublic,
        },
      });

      if (files.length > 0 && actor) {
        await Promise.all(
          files.map(async (file) => {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const blob = ExternalBlob.fromBytes(bytes);
            await actor.addModAttachment(modId, blob);
          }),
        );
      }

      toast.success("Mod updated successfully!");
      router.navigate({ to: "/workshop" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update mod";
      toast.error(message);
    }
  };

  const handleBack = () => {
    router.navigate({ to: "/workshop" });
  };

  // Check ownership — compare principal string
  const isOwner =
    mod && identity
      ? mod.owner.toText() === identity.getPrincipal().toText()
      : true; // defer until both are loaded

  const showNotFound = !isLoading && (mod === null || isError);
  const showNotOwned = !isLoading && mod && !isOwner;

  return (
    <AuthGuard message="Sign in to edit mods">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start gap-4"
        >
          <button
            type="button"
            onClick={handleBack}
            className="mt-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="Back to Workshop"
            data-ocid="edit.back_button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight mb-1">
              EDIT MOD
            </h1>
            <p className="text-muted-foreground text-sm">
              Update your mod settings and republish
            </p>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4" data-ocid="edit.loading_state">
            <Skeleton className="h-12 bg-muted/30 rounded-lg w-1/3" />
            <Skeleton className="h-48 bg-muted/30 rounded-lg" />
            <Skeleton className="h-96 bg-muted/30 rounded-lg" />
          </div>
        )}

        {/* Not Found / Error State */}
        {showNotFound && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-5 text-center"
            data-ocid="edit.error_state"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Mod Not Found</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                This mod doesn't exist or may have been deleted.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-border gap-2"
              onClick={handleBack}
              data-ocid="edit.back_to_workshop_button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workshop
            </Button>
          </motion.div>
        )}

        {/* Not Owned State */}
        {showNotOwned && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-5 text-center"
            data-ocid="edit.unauthorized_state"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                You don't have permission to edit this mod. Only the original
                creator can make changes.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-border gap-2"
              onClick={handleBack}
              data-ocid="edit.back_to_workshop_button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workshop
            </Button>
          </motion.div>
        )}

        {/* Mod Creator Form */}
        {!isLoading && mod && isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            data-ocid="edit.form"
          >
            <ModCreator
              initialMod={mod}
              onSave={handleSave}
              isSaving={updateMod.isPending}
            />
          </motion.div>
        )}
      </div>
    </AuthGuard>
  );
}
