✅ Current Working Development & Deployment Environment Summary
📁 1. package.json (Key Versions)

{
  "name": "bolt-expo-starter",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "EXPO_NO_TELEMETRY=1 expo start",
    "build:web": "expo export --platform web",
    "vercel-build": "expo export --platform web --output-dir dist",
    "lint": "expo lint"
  },
  "dependencies": {
    "expo": "~52.0.46",
    "expo-router": "~4.0.20",
    "expo-constants": "~17.0.8",
    "expo-blur": "~14.0.3",
    "expo-camera": "~16.0.18",
    "expo-font": "~13.0.4",
    "expo-haptics": "~14.0.1",
    "expo-linear-gradient": "~14.0.2",
    "expo-linking": "~7.0.5",
    "expo-secure-store": "~14.0.1",
    "expo-splash-screen": "^0.29.21",
    "expo-status-bar": "~2.0.1",
    "expo-web-browser": "~14.0.2",
    "expo-symbols": "^0.2.2",
    "expo-system-ui": "^4.0.7",
    "@expo/vector-icons": "^14.0.2",
    "@expo/config-plugins": "~9.0.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.9",
    "react-native-svg": "15.8.0",
    "react-native-reanimated": "~3.16.1",
    "react-native-gesture-handler": "~2.20.2",
    "react-native-screens": "~4.4.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-url-polyfill": "^2.0.0",
    "react-native-web": "^0.19.13",
    "react-native-webview": "13.12.5",
    "@supabase/supabase-js": "^2.49.4",
    "date-fns": "^4.1.0",
    "@lucide/lab": "^0.1.2",
    "lucide-react-native": "^0.475.0",
    "typescript": "5.3.3"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~18.3.12",
    "typescript": "^5.3.3"
  }
}
🌐 2. Vercel Deployment Settings (Web GUI)
Framework Settings:
Framework Preset: Other

Output Directory: dist

Build Command: npm run vercel-build

Install Command: npm install

Development Command: None

Node.js Version:
22.x

🧾 3. vercel.json

{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

🧠 4. Additional Notes
✅ Redirect logic in app/index.tsx:

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/inventory" />;
}

✅ Ensure dist folder is pushed to GitHub
If it was in .gitignore, make sure to remove it or comment it out:

# .gitignore — remove this line if present:
# dist/


✅ Summary of Key Fixes That Made It Work


| Issue                                      | Fix                                                       |
| ------------------------------------------ | --------------------------------------------------------- |
| Version mismatches (Expo SDK, etc.)        | Used `expo install` and `expo-doctor` to align versions   |
| `expo-router` static build problems        | Used `expo export --platform web` to generate `dist`      |
| Missing fallback route                     | Added `vercel.json` with fallback rewrite to `index.html` |
| `dist` folder missing from deployment      | Pushed `dist/` folder to GitHub manually                  |
| Vercel build config not pointing to `dist` | Set `Output Directory` to `dist` in Web GUI               |

