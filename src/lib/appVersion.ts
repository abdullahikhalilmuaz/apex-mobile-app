import Constants from "expo-constants";

const VERSION_URL =
  "https://raw.githubusercontent.com/abdullahikhalilmuaz/apex-mobile-app/main/version.json";

const GRACE_PERIOD_DAYS = 21;

export type VersionInfo = {
  latestVersion: string;
  downloadUrl: string;
  releasedAt: string;
  releaseNotes: string;
};

export type UpdateCheckResult =
  | { status: "up-to-date" }
  | { status: "soft"; info: VersionInfo }
  | { status: "force"; info: VersionInfo }
  | { status: "error"; message: string };

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  try {
    const currentVersion = Constants.expoConfig?.version ?? "0.0.0";

    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`);
    if (!res.ok) {
      return { status: "error", message: `HTTP ${res.status}` };
    }

    const info: VersionInfo = await res.json();

    if (compareVersions(info.latestVersion, currentVersion) <= 0) {
      return { status: "up-to-date" };
    }

    // Compare release date for grace period
    const releasedAt = new Date(info.releasedAt).getTime();
    const now = Date.now();
    const daysSince = (now - releasedAt) / (1000 * 60 * 60 * 24);

    if (daysSince >= GRACE_PERIOD_DAYS) {
      return { status: "force", info };
    }

    return { status: "soft", info };
  } catch (e: any) {
    return { status: "error", message: e?.message ?? "Network error" };
  }
}
