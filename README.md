# LOST IN RUINS (2D RPG Game)

A robust, data-driven 2D Action RPG built on the **Phaser 3** engine. This project features a modular architecture that separates core engine logic from game content, allowing for rapid iteration and scalability. Levels, items, enemies, and quests are defined in external JSON files, making the game highly extensible.

## 🎮 Key Features

* **Data-Driven Architecture:** All game content (Items, Enemies, Levels, Loot Tables) is defined in JSON, allowing for easy modification without touching the codebase.
* **Real-Time Combat:** Action-oriented combat system with "I-Frames" (invulnerability windows), knockback physics, and visual feedback.
* **Persistent Inventory:** Singleton-based inventory management that persists across scenes, complete with Quick Slots (1-5) and drag-and-drop functionality.
* **Dynamic Level Progression:** Linear progression through distinct biomes including Forests, Dungeons, Cyberpunk Cities, and Underwater Ruins.
* **Loot System:** Robust drop mechanics using weighted probability tables for randomized loot and guaranteed drops.
* **Polished UI/UX:** Dedicated scenes for Main Menu, Settings (Audio/SFX), Controls, Pausing, and HUD overlays.

## 🛠️ Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Engine** | Phaser 3 (JS/ES6) | Scene management, asset handling, and game loop. |
| **Physics** | Arcade Physics | Lightweight AABB collision detection. |
| **Level Design** | Tiled | Map creation exported as JSON. |
| **Build Tool** | Node.js / npm | Dependency management. |
| **Assets** | PNG, JSON, MP3 | Standard web formats for data and media. |

## 🕹️ Controls

| Key(s) | Action |
| :--- | :--- |
| **WASD / Arrows** | Move Character |
| **SPACE** | Attack |
| **I** | Toggle Inventory |
| **1 - 5** | Use Quick Slot Item |
| **E** | Interact with NPCs |
| **ESC** | Pause Game |
| **R** | Retry Level (Game Over) |

## 📂 Project Structure

The source code follows a strict component-based architecture located in the `src/` directory:

* **`/assets`**: Raw game assets (images, audio, tilemaps).
* **`/config`**: Global game constants and input mappings.
* **`/core`**: Low-level utilities (EventBus, SaveSystem/LocalStorage wrapper).
* **`/data`**: The "brain" of the game. JSON definitions for content (`items.json`, `enemies.json`, `levels.json`).
* **`/entities`**: Class definitions for game objects (`Player.js`, `Enemy.js`, `Item.js`).
* **`/scenes`**: Game states (Boot, Menu, GameScene, UIScene, Pause, etc.).
* **`/systems`**: Gameplay logic managers (`CombatSystem.js`, `InventoryManager.js`, `MapManager.js`).

## 🚀 Getting Started

### Prerequisites
* Node.js and npm installed.

### Installation
1.  Clone the repository:
    ```bash
    git clone [https://github.com/your-username/rpg-game.git](https://github.com/your-username/rpg-game.git)
    ```
2.  Navigate to the project folder:
    ```bash
    cd rpg-game
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run the development server:
    ```bash
    npm run start
    ```

## 🎨 Extensibility (How to Add Content)

Because the engine is data-driven, you can add new content by simply editing the JSON files in `src/data/`.

### Adding a New Item
1.  Open `src/data/items.json`.
2.  Add a new object with a unique key:
    ```json
    "super_potion": {
        "name": "Super Potion",
        "sprite": "item_potion_purple",
        "type": "CONSUMABLE",
        "effect": { "type": "heal", "stat": "hp", "value": 100 }
    }
    ```

### Adding a New Enemy
1.  Open `src/data/enemies.json`.
2.  Define stats (HP, Damage) and assign a Loot Table ID.
3.  Place the enemy in your **Tiled** map using a Point object with `type: Enemy` and a custom property `id` matching your JSON key.

## 🗺️ Roadmap

* [ ] **Save/Load System:** Serialize inventory and level progress.
* [ ] **Boss Mechanics:** Complex AI patterns for the "Null Shard" boss.
* [ ] **Audio Polish:** Unique SFX for different weapon types.
* [ ] **Mobile Support:** Touch control overlays.

## 📄 License
FREE for all Public use 😁
                                                         ( aita group of technologies)
