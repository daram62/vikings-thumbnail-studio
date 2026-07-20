import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;
const externalDeploy = process.env.CLOUDFLARE_EXTERNAL_DEPLOY === "1";
const externalDatabaseId = process.env.CLOUDFLARE_DATABASE_ID;

const localBindingConfig = externalDeploy
  ? {
      name: "vikings",
      main: "./worker/index.ts",
      compatibility_date: "2026-07-20",
      d1_databases: d1
        ? [
            {
              binding: d1,
              database_name: "vikings-thumbnail-studio-db",
              database_id: externalDatabaseId || SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
            },
          ]
        : [],
      r2_buckets: [],
    }
  : {
  main: "./worker/index.ts",
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
  };

export default defineConfig({
  plugins: [
    vinext(),
    sites(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      config: localBindingConfig,
    }),
  ],
});
