import { useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { ModInput } from "../backend";
import { ExternalBlob } from "../backend";
import AuthGuard from "../components/AuthGuard";
import ModCreator from "../components/ModCreator";
import { useActor } from "../hooks/useActor";
import { useCreateMod } from "../hooks/useQueries";

export default function CreateModPage() {
  const createMod = useCreateMod();
  const { actor } = useActor();
  const router = useRouter();

  const handleSave = async (input: ModInput, files: File[]) => {
    try {
      const modId = await createMod.mutateAsync(input);

      // Upload file attachments
      if (files.length > 0 && actor) {
        await Promise.all(
          files.map(async (file) => {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const blob = ExternalBlob.fromBytes(bytes);
            await actor.addModAttachment(modId, blob);
          }),
        );
      }

      toast.success("Mod created successfully!");
      router.navigate({ to: "/workshop" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create mod";
      toast.error(msg);
    }
  };

  return (
    <AuthGuard message="Sign in to create mods">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold uppercase tracking-tight mb-1">
            MOD CREATOR
          </h1>
          <p className="text-muted-foreground text-sm">
            Build and publish your mod to the community
          </p>
        </motion.div>

        <ModCreator onSave={handleSave} isSaving={createMod.isPending} />
      </div>
    </AuthGuard>
  );
}
