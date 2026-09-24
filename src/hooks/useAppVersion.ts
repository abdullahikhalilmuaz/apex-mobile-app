import { useEffect, useState } from "react";
import { checkForUpdate, UpdateCheckResult } from "../lib/appVersion";

export function useAppVersion() {
  const [result, setResult] = useState<UpdateCheckResult | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;
    checkForUpdate().then((r) => {
      if (mounted) setResult(r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const shouldShow =
    result?.status === "soft" ? !dismissed : result?.status === "force";

  return {
    result,
    shouldShow,
    dismiss: () => setDismissed(true),
    recheck: async () => {
      setDismissed(false);
      const r = await checkForUpdate();
      setResult(r);
    },
  };
}
