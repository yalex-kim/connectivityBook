import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(2); // NAS: 2코어
// REMOTION_BROWSER가 있으면 그 Chromium을 쓴다(예: Playwright가 받아 둔 headless shell)
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
