import { HttpAgent } from "@icp-sdk/core/agent";
import { useEffect, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

export function useStorageClient() {
  const [client, setClient] = useState<StorageClient | null>(null);

  useEffect(() => {
    let mounted = true;
    loadConfig().then((config) => {
      if (!mounted) return;
      const agent = new HttpAgent({ host: config.backend_host });
      const sc = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      setClient(sc);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return client;
}
