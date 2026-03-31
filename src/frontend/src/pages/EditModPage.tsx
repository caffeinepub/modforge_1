import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { ModInput } from "../backend";
import { ExternalBlob } from "../backend";
import AuthGuard from "../components/AuthGuard";
import ModCreator from "../components/ModCreator";
import { useActor } from "../hooks/useActor";
import { useMod, useUpdateMod } from "../hooks/useQueries";

export default function EditModPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const modId = BigInt(id || "0");
  const { data: mod, isLoading } = useMod(modId);
  const updateMod = useUpdateMod();
  const { actor } = useActor();
  const router = useRouter();

  const handleSave = async (input: ModInput, files: File[]) => {
    try {
      await updateMod.mutateAsync({ id: modId, update: input });

      if (files.length > 0 && actor) {
        await Promise.all(
          files.map(async (file) => {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const blob = ExternalBlob.fromBytes(bytes);
            await actor.addModAttachment(modId, blob);
          }),
        );
      }

      toast.success("Mod updated!");
      router.navigate({ to: "/workshop" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to update mod");
    }
  };

  return (
    <AuthGuard message="Sign in to edit mods">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold uppercase tracking-tight mb-1">
            EDIT MOD
          </h1>
          <p className="text-muted-foreground text-sm">
            Update your mod settings and republish
          </p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4" data-ocid="edit.loading_state">
            <Skeleton className="h-48 bg-muted/30 rounded-lg" />
            <Skeleton className="h-96 bg-muted/30 rounded-lg" />
          </div>
        ) : !mod ? (
          <div className="text-center py-20" data-ocid="edit.error_state">
            <p className="text-muted-foreground">Mod not found</p>
          </div>
        ) : (
          <ModCreator
            initialMod={mod}
            onSave={handleSave}
            isSaving={updateMod.isPending}
          />
        )}
      </div>
    </AuthGuard>
  );
}
