## 🍽️ Restaurant Inventory Bolt

A mobile-first inventory management app designed for small restaurants, food trucks, and prep-heavy kitchens.Built for speed, simplicity, and smart, suggestion-based planning, this app helps staff track ingredients, manage recipes, log prep activities, and keep inventory in sync — with minimal manual input.

Built with React Native + Expo Router, styled for clarity, and designed for easy tracking of stock levels without worrying about expiry dates.

## ✅ Stable Version Setup (as of June 2025)

Package Version Notes
expo 52.0.46 SDK 52 (current) ✅
react-native 0.76.9 Matches SDK 52 ✅
react 18.2.0 ✅ Recommended (not 18.3.1)
react-dom 18.2.0 For web compatibility ✅
expo-router 4.0.21 ✅ Works with SDK 52
@react-native-picker/picker 2.9.0 ✅ Compatible

**【OCR command】** cd api-server 　
npx tsx server.ts

## ⚠️ Important Notes

react@18.3.1 is not fully compatible yet — use 18.2.0.

expo-router@5.x requires Expo SDK 53+. Use 4.x for SDK 52.

After changes, always run:

```bash

Remove-Item -Recurse -Force node_modules
del package-lock.json
npm install
npx expo start --clear

```

## 📦 Project Structure

restaurant_inventory_bolt-main/
├── app/ # Screens and routing
├── assets/ # App icons and images
├── components/ # Reusable UI components (InventoryItem, PrepTaskItem, etc.)
├── data/ # Dummy data for inventory, recipes, and tasks
├── hooks/ # Custom React hooks
├── types/ # TypeScript types
├── utils/ # Utility functions
├── .bolt/ # Bolt build system configs
├── package.json # Project settings and dependencies
├── tsconfig.json # TypeScript settings
└── README.md # Project overview (you are here)

## 🗌 Key Features

### 📟 Track Ingredients

View, add, and update stock in real time

### 🍱 Prep-Based Inventory Logic

Materials are deducted automatically based on prep quantity

### 📊 Prep-Sheet Mode

Suggest daily prep quantity based on past trends (weekday/weekend-based average)

### ⚠️ Smart Alerts

Combined low stock and physical check warnings

### 🧠 Suggestion-Based System

Offers prep quantity estimates, but leaves control in staff hands

### ✍️ Manual Adjustments

Override prep suggestions as needed

### 📌 Prep Sheet Interface

Shows required amounts per ingredient per day, allows toggling "completed" state and quantity edits, then updates inventory with one tap

### 📲 Fast & Simple Input

Dropdowns, quick-add chips, and smart defaults

📱 Designed for Real Kitchens
✅ Large buttons and color-coded warnings
✅ Minimal, mobile-first UI with tab navigation
✅ Fast interactions, minimal typing
✅ Templates for common recipes and prep sets

## 🧾 OCR-Driven Inventory Setup

📷 Invoice Image Upload
Upload photos of supplier invoices to detect ingredients and quantities automatically using OCR (Tesseract.js)

## 🧠 AI-Based Name Correction

Smart fuzzy matching (via Fuse.js) corrects minor OCR spelling errors like "Garie" → "Garlic"

## 🧹 Line Cleaning & Error Tolerance

Fixes common OCR issues like "0nion" → "onion", and parses decimal formats like 1,5 kg

## ✅ Automatic Stock Update

Ingredients from invoices are matched to inventory (or created if missing), with quantities added instantly

## 🔍 Preview + Scan Feedback

Invoice preview, parsed OCR text, and confirmation toast (e.g., "✅ 3 items updated") after each upload

## 🖼 Image Preview

See the uploaded invoice image before and after scanning for transparency and verification

### 🧠 Prep Sheet Quantity Logic

The system operates in a hybrid mode combining automation with manual control.

| Field                 | Meaning                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| `quantity`            | Auto-generated suggested prep quantity from `prep_suggestions`            |
| `currentMealStock`    | Existing prepped stock for today                                          |
| `Planned Prep`        | Default = `quantity - currentMealStock`                                   |
| `plannedPrepOverride` | Staff override input (from modal)                                         |
| `Done` action         | Logs `plannedPrepOverride` if provided, otherwise uses `quantity - stock` |

## ➡️ **Display always shows system's suggestion**, but [✅ Done] respects staff input.

This app uses a "complete deletion + manual override" strategy for meal logs:

When a user manually enters the current stock of a prepared meal (e.g. "4 batches of tomato sauce remain"), the system:

Deletes all existing meal logs for that recipe

Inserts a single new log with the manually entered quantity

Adjusts inventory based on the difference (delta) between the old and new total

This ensures that the meal log reflects the actual physical stock, even after long breaks (e.g., holidays).

## 🔄 Impact on Forecasting

Although the system currently uses weekday/weekend suggestions set by the user, future versions may:

Use historical logs (past 3 weeks) to automatically forecast prep suggestions

Filter out override entries by checking notes = 'Manual override'

This hybrid design balances automation and manual control with clarity and traceability.

## Inventory Logic

📄 [Detailed Inventory Logic](./docs/inventory_logic.md)

##Superbase Summary
[See Supabase summary ](./SUPABASE_SUMMARY.md)

## 📊 Prep-Sheet Mode

Automatically suggests what to prepare each day using:

Past weekday-based average meals

Prep targets (e.g., “5 miso mayo bottles”)

Ingredient requirements per recipe

Current inventory comparison

💡 Example:“⚠️ Not enough miso to prepare 3 more bottles of miso mayo”

## ⚠️ Smart Alerts System

System automation isn’t perfect — this feature helps avoid surprises.
⚠️ Alert.alert() in the meal may not display on web (Expo Web or browser), but it works correctly(?? suspicious) on native devices (iOS/Android). Use console.warn() or a toast library for web fallback if needed.

## ♻️ Combines: Low Stock + Unverified Manual Check

## 🕒 checkThreshold: Warn if stock < X or last checked over Y days ago

## 👁️ Visual cues only → never blocks flow

## 📋 Recipe and Inventory Data Management

✅ In-App CSV Import for Recipes and Ingredients
Users can now upload .csv files directly from the app.

The uploader supports previewing and mapping of recipe names, categories, ingredients, and "how to cook" instructions.

Parsed data is automatically inserted into the Supabase recipes and ingredients tables.

This feature eliminates the need to use the Supabase dashboard for initial data setup.

✅ OCR-Based Invoice Capture (Implemented with Tesseract.js)
A working in-app invoice scanner reads text from supplier invoices via uploaded images.

Parsed data appears in a preview and can be adjusted before submission.

Supports dynamic ingredient entry and category assignment during the OCR flow.

✅ Manual Entry and Editing
Ingredients and recipes can still be added or edited manually.

Category dropdown with "+ New" option allows for dynamic category creation.

All changes sync directly with Supabase.

## 📦 Invoice Management (Now - Mixed Approach)

Paper, PDF, and CSV invoices are supported.

OCR-based scanning has been implemented for image-based invoices.

Manual verification is still required to ensure accuracy before updating stock.

### 🔍 Optional Enhancements:

"Restock Last" Shortcut: One-tap refilling for commonly restocked ingredients.

Supplier Mapping: Link ingredients to suppliers for more accurate invoice parsing and order planning.

## 🏁 Key PhilosophyAutomate what can be automated. Simplify what must stay manual. Always prioritize speed and accuracy for kitchen operations.

## 🛠️ Technologies Used

Expo (SDK 52)

React Native (0.76)

Expo Router (4.0)

TypeScript (5.3)

Lucide React Native Icons

date-fns for date formatting

## 🧹 Cleaned Up (Recently Updated)

Removed all expiry date alerts.

Focus is now only on quantity management and low stock alerts.

Fully cleaned merge conflicts and improved codebase stability.

Updated and modernized Expo + dependencies.

Removed all @/ aliases and replaced them with relative imports for compatibility with Expo Web bundler

Fixed white screen issues in Expo Web by aligning paths and bundler expectations

## 📌 Notes

This app currently runs entirely with dummy data stored in /data/dummyData.ts.

Future versions can easily connect to a real backend (Firebase, Supabase, etc.)

Designed to be minimal and easy for small kitchen teams.

## 🚧 Note (May 2025):

The app is temporarily running in Web mode (npx expo start --web) for testing purposes due to Expo Go limitations on iOS 16.7 (iPhone 8). Once development is complete, the target will be switched back to iOS mobile testing.

## 📄 License

This project is private for now.Feel free to use it as a base for your own kitchen inventory system.

✨ Enjoy managing your kitchen inventory smarter and faster!
