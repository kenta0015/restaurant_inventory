# 🗃️ SUPABASE_SUMMARY.md

This file summarizes the current Supabase configuration used in the restaurant-inventory-app project. It includes table structures, Row-Level Security (RLS) settings, and key implementation notes.

✅ Supabase Project Overview

Database Provider: Supabase (PostgreSQL-based)

Used for: Managing inventory, recipes, meal logs, recipe-ingredient links, and recipe categories

Tables Configured:

inventory

recipes

recipe_ingredients

meal_logs

recipe_categories

📊 Table Structures & Purpose

1. inventory

Purpose: Stores raw ingredient stock data.

Fields:

id (uuid, PK)

name (text)

quantity (numeric)

unit (text)

alertLevel (numeric)

Notes: Used to track ingredient quantities and low-stock alerts.

2. recipes

Purpose: Stores meal preparation recipes.

Fields:

id (uuid, PK)

name (text)

category (text)

createdAt (timestamp)

Notes: Recipes are linked to ingredients via the recipe_ingredients table.

3. recipe_ingredients

Purpose: Links recipes to their ingredients, specifying quantity per batch.

Fields:

id (uuid, PK)

recipe_id (uuid, FK to recipes.id)

ingredient_id (uuid, FK to inventory.id)

quantity_per_batch (numeric)

unit (text)

Notes: Enables batch-based inventory deduction and scalable recipe editing.

4. meal_logs

Purpose: Logs prepared meals and quantities.

Fields:

id (uuid, PK)

recipe_id (uuid, FK to recipes.id)

count (integer)

manualOverrideServings (integer, optional)

comment (text, optional)

user_id (uuid, FK to auth.users.id)

created_at (timestamp)

5. recipe_categories

Purpose: Stores user-defined categories for recipes.

Fields:

id (uuid, PK)

name (text, unique)

created_at (timestamp)

Notes: Used to organize recipes into logical groups (e.g., Sauce, Main Dish).

🔄 Table Relationships

inventory (ingredient)
     ▲
     │ ingredient_id
recipe_ingredients (link table)
     │ recipe_id
     ▼
recipes
     │
     ▼
recipe_categories

recipe_ingredients links:

recipe_id → a recipe from recipes

ingredient_id → an item from inventory

and adds quantity_per_batch and unit

🔐 Row-Level Security (RLS) Summary

inventory

RLS: Enabled

SELECT Policy:

USING (true)

→ Public read access (no login required)

recipes

RLS: Enabled

SELECT Policy:

USING (true)

→ Public read access

meal_logs

RLS: Enabled

SELECT Policy:

USING (auth.uid() = user_id)

→ Only the user who created a log can read it.

INSERT/UPDATE: Policies not yet added

🔧 Auth Integration Status

Currently not enforcing login in the app

user_id field is present in meal_logs, ready for secure user-level tracking

Future plan: add auth.uid()-based INSERT and UPDATE policies

📌 Recommendations

🔐 Add INSERT/UPDATE RLS to meal_logs

🧼 Enforce non-null user_id once Supabase Auth is integrated

📥 Consider exporting this summary to README.md as a quick link

Last updated: May 7, 2025