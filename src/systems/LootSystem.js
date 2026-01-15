import lootTables from '../data/lootTables.json';
import itemsData from '../data/items.json';

/**
 * LootSystem - Handles probabilistic loot generation based on loot tables
 * Uses weighted random selection for item drops
 */
export default class LootSystem {
    /**
     * Roll loot from a specified loot table
     * @param {string} lootTableId - The ID of the loot table to roll from
     * @returns {Array} Array of {itemId, quantity} objects representing dropped items
     */
    static rollLoot(lootTableId) {
        const table = lootTables[lootTableId];
        if (!table) {
            console.warn(`LootSystem: Loot table '${lootTableId}' not found!`);
            return [];
        }

        const droppedItems = [];

        // Check if anything drops at all
        if (Math.random() > table.dropChance) {
            return droppedItems;
        }

        // Add guaranteed items first
        if (table.guaranteedItems) {
            table.guaranteedItems.forEach(itemId => {
                droppedItems.push({ itemId, quantity: 1 });
            });
        }

        // Roll the dice for each roll allowed
        const rolls = table.rolls || 1;
        for (let i = 0; i < rolls; i++) {
            const rolledItem = this.weightedRandomSelect(table.items);
            if (rolledItem) {
                const quantity = this.randomRange(rolledItem.minQty, rolledItem.maxQty);
                droppedItems.push({ itemId: rolledItem.id, quantity });
            }
        }

        // Consolidate duplicate items
        return this.consolidateItems(droppedItems);
    }

    /**
     * Weighted random selection from an array of items
     * @param {Array} items - Array of items with 'weight' property
     * @returns {Object|null} Selected item or null
     */
    static weightedRandomSelect(items) {
        if (!items || items.length === 0) return null;

        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.weight || 1;
            if (random <= 0) {
                return item;
            }
        }

        return items[items.length - 1]; // Fallback
    }

    /**
     * Get random integer between min and max (inclusive)
     */
    static randomRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Consolidate duplicate item entries into single entries with combined quantities
     */
    static consolidateItems(items) {
        const consolidated = {};

        items.forEach(({ itemId, quantity }) => {
            if (consolidated[itemId]) {
                consolidated[itemId].quantity += quantity;
            } else {
                consolidated[itemId] = { itemId, quantity };
            }
        });

        return Object.values(consolidated);
    }

    /**
     * Get item data from items.json
     * @param {string} itemId - The item ID to look up
     * @returns {Object|null} Item data or null if not found
     */
    static getItemData(itemId) {
        return itemsData[itemId] || null;
    }

    /**
     * Check if an item exists
     * @param {string} itemId - The item ID to check
     * @returns {boolean}
     */
    static itemExists(itemId) {
        return !!itemsData[itemId];
    }

    /**
     * Get rarity color for UI display
     * @param {string} rarity - Item rarity level
     * @returns {number} Hex color value
     */
    static getRarityColor(rarity) {
        const colors = {
            common: 0xffffff,    // White
            uncommon: 0x00ff00,  // Green
            rare: 0x0066ff,      // Blue
            epic: 0x9900ff,      // Purple
            legendary: 0xff9900  // Orange
        };
        return colors[rarity] || colors.common;
    }
}
