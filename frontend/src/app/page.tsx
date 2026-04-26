import fs from "node:fs/promises";
import path from "node:path";

import MonopolyDashboard, {
  type Metrics,
  type Rollout,
} from "@/components/monopoly-dashboard";

async function loadJson<T>(relativePath: string): Promise<T> {
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  const file = await fs.readFile(absolutePath, "utf-8");
  return JSON.parse(file) as T;
}

export default async function Home() {
  const rollout = await loadJson<Rollout>("demo/best_rollout.json");
  const metrics = await loadJson<Metrics>("demo/training_metrics.json");

  return (
    <MonopolyDashboard
      initialMetrics={metrics}
      initialRollout={rollout}
      apiBase={process.env.NEXT_PUBLIC_MONOPOLY_API_URL ?? ""}
    />
  );
}
