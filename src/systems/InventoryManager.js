import itemsData from '../data/items.json';

/**
 * InventoryManager - Singleton class that manages player inventory
 * Supports stackable items, equipment slots, and item usage
 */
export default class InventoryManager {
    constructor() {
        // Singleton pattern
        if (InventoryManager.instance) return InventoryManager.instance;
        InventoryManager.instance = this;

        this.items = []; // Array of { id, quantity }
        this.capacity = 24; // Grid of 6x4
        this.gold = 0;

        // Equipment slots
        this.equipment = {
            mainHand: null,
            offHand: null,
            head: null,
            body: null,
            accessory: null
        };

        // Event callbacks
        this.onChangeCallbacks = [];
    }

    /**
     * Add item(s) to inventory
     * @param {string} itemId - The item ID to add
     * @param {number} quantity - Amount to add (default: 1)
     * @returns {boolean} Success status
     */
    addItem(itemId, quantity = 1) {
        const itemData = itemsData[itemId];
        if (!itemData) {
            console.warn(`InventoryManager: Item '${itemId}' not found in items.json!`);
            return false;
        }

        // Handle gold/currency separately
        if (itemData.type === 'CURRENCY' && (itemId === 'gold_coin' || itemId === 'coin')) {
            this.gold += quantity;
            this._notifyChange();
            console.log(`Added ${quantity} gold. Total: ${this.gold}`);
            return true;
        }

        // Check if item is stackable and already exists
        if (itemData.stackable) {
            const existingSlot = this.items.find(slot => slot.id === itemId);
            if (existingSlot) {
                const maxStack = itemData.maxStack || 99;
                const canAdd = Math.min(quantity, maxStack - existingSlot.quantity);
                existingSlot.quantity += canAdd;

                // Handle overflow - create new stack if needed
                const overflow = quantity - canAdd;
                if (overflow > 0) {
                    return this._addNewStack(itemId, overflow, itemData);
                }

                this._notifyChange();
                console.log(`Stacked ${quantity} ${itemData.name}. Total: ${existingSlot.quantity}`);
                return true;
            }
        }

        // Add as new item slot
        return this._addNewStack(itemId, quantity, itemData);
    }

    /**
     * Add item as a new inventory slot
     * @private
     */
    _addNewStack(itemId, quantity, itemData) {
        if (this.items.length >= this.capacity) {
            console.log("Inventory Full!");
            return false;
        }

        this.items.push({ id: itemId, quantity });
        this._notifyChange();
        console.log(`Added ${quantity}x ${itemData.name} to inventory.`);
        return true;
    }

    /**
     * Remove item(s) from inventory
     * @param {string} itemId - The item ID to remove
     * @param {number} quantity - Amount to remove (default: 1)
     * @returns {boolean} Success status
     */
    removeItem(itemId, quantity = 1) {
        const slotIndex = this.items.findIndex(slot => slot.id === itemId);
        if (slotIndex === -1) {
            console.warn(`Item '${itemId}' not in inventory.`);
            return false;
        }

        const slot = this.items[slotIndex];
        slot.quantity -= quantity;

        if (slot.quantity <= 0) {
            this.items.splice(slotIndex, 1);
        }

        this._notifyChange();
        return true;
    }

    /**
     * Use a consumable item
     * @param {string} itemId - The item ID to use
     * @param {Object} target - The target entity (usually player)
     * @returns {boolean} Success status
     */
    useItem(itemId, target) {
        const itemData = itemsData[itemId];
        if (!itemData) return false;

        if (itemData.type !== 'CONSUMABLE') {
            console.log(`Cannot use ${itemData.name} - not consumable.`);
            return false;
        }

        if (!this.hasItem(itemId)) {
            console.log(`No ${itemData.name} in inventory.`);
            return false;
        }

        // Apply effect
        if (itemData.effect) {
            const { type, stat, value } = itemData.effect;
            if (type === 'heal' && target.stats) {
                const oldHp = target.stats.hp;
                target.stats.hp = Math.min(target.stats.hp + value, target.stats.maxHp || 100);
                console.log(`Healed ${target.stats.hp - oldHp} HP.`);
            } else if (type === 'restore' && target.stats) {
                const oldMana = target.stats.mana || 0;
                target.stats.mana = Math.min((target.stats.mana || 0) + value, target.stats.maxMana || 50);
                console.log(`Restored ${(target.stats.mana || 0) - oldMana} Mana.`);
            }
        }

        // Consume item
        this.removeItem(itemId, 1);
        return true;
    }

    /**
     * Equip an item to its designated slot
     * @param {string} itemId - The item ID to equip
     * @returns {boolean} Success status
     */
    equipItem(itemId) {
        const itemData = itemsData[itemId];
        if (!itemData || !itemData.slot) {
            console.log(`Cannot equip ${itemId} - no slot defined.`);
            return false;
        }

        if (!this.hasItem(itemId)) {
            console.log(`No ${itemData.name} in inventory.`);
            return false;
        }

        const slot = itemData.slot;

        // Unequip current item if slot is occupied
        if (this.equipment[slot]) {
            this.unequipItem(slot);
        }

        // Move from inventory to equipment
        this.removeItem(itemId, 1);
        this.equipment[slot] = itemId;

        this._notifyChange();
        console.log(`Equipped ${itemData.name} to ${slot}.`);
        return true;
    }

    /**
     * Unequip an item from a slot
     * @param {string} slot - The equipment slot to unequip
     * @returns {boolean} Success status
     */
    unequipItem(slot) {
        if (!this.equipment[slot]) {
            console.log(`No item equipped in ${slot}.`);
            return false;
        }

        const itemId = this.equipment[slot];

        // Add back to inventory
        if (!this.addItem(itemId, 1)) {
            console.log("Inventory full - cannot unequip.");
            return false;
        }

        this.equipment[slot] = null;
        this._notifyChange();
        return true;
    }

    /**
     * Check if player has an item
     * @param {string} itemId - The item ID to check
     * @param {number} quantity - Required quantity (default: 1)
     * @returns {boolean}
     */
    hasItem(itemId, quantity = 1) {
        const slot = this.items.find(s => s.id === itemId);
        return slot && slot.quantity >= quantity;
    }

    /**
     * Get count of an item in inventory
     * @param {string} itemId - The item ID to count
     * @returns {number}
     */
    getItemCount(itemId) {
        const slot = this.items.find(s => s.id === itemId);
        return slot ? slot.quantity : 0;
    }

    /**
     * Get all items in inventory
     * @returns {Array}
     */
    getItems() {
        return this.items;
    }

    /**
     * Get equipment data
     * @returns {Object}
     */
    getEquipment() {
        return this.equipment;
    }

    /**
     * Calculate total stat bonuses from equipment
     * @returns {Object}
     */
    getEquipmentStats() {
        const stats = { attack: 0, defense: 0, speed: 0 };

        Object.values(this.equipment).forEach(itemId => {
            if (itemId) {
                const itemData = itemsData[itemId];
                if (itemData && itemData.stats) {
                    Object.entries(itemData.stats).forEach(([stat, value]) => {
                        stats[stat] = (stats[stat] || 0) + value;
                    });
                }
            }
        });

        return stats;
    }

    /**
     * Register a callback for inventory changes
     * @param {Function} callback
     */
    onChange(callback) {
        this.onChangeCallbacks.push(callback);
    }

    /**
     * Notify all listeners of inventory change
     * @private
     */
    _notifyChange() {
        this.onChangeCallbacks.forEach(cb => cb(this));
    }

    /**
     * Clear inventory (for testing or new game)
     */
    clear() {
        this.items = [];
        this.gold = 0;
        this.equipment = {
            mainHand: null,
            offHand: null,
            head: null,
            body: null,
            accessory: null
        };
        this._notifyChange();
    }

    /**
     * Serialize inventory for save system
     * @returns {Object}
     */
    serialize() {
        return {
            items: [...this.items],
            gold: this.gold,
            equipment: { ...this.equipment }
        };
    }

    /**
     * Load inventory from saved data
     * @param {Object} data
     */
    deserialize(data) {
        if (data.items) this.items = data.items;
        if (data.gold !== undefined) this.gold = data.gold;
        if (data.equipment) this.equipment = data.equipment;
        this._notifyChange();
    }
}

// Export singleton instance
export const inventoryInstance = new InventoryManager();
