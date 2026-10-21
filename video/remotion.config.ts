import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(2); // NAS: 2코어
Config.setChromiumOpenGlRenderer("swangle"); // GPU 없는 서버에서 3D(WebGL)를 SwiftShader로 그린다
// REMOTION_BROWSER가 있으면 그 Chromium을 쓴다(예: Playwright가 받아 둔 headless shell)
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
