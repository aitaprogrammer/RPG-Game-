export default class PersistenceManager {
    static getUnlockedLevels() {
        const stored = localStorage.getItem('unlockedLevels');
        if (stored) {
            return JSON.parse(stored);
        }
        return ['chamber']; // Default: only first level unlocked
    }

    static unlockLevel(levelID) {
        const unlocked = this.getUnlockedLevels();
        if (!unlocked.includes(levelID)) {
            unlocked.push(levelID);
            localStorage.setItem('unlockedLevels', JSON.stringify(unlocked));
            console.log(`Level Unlocked: ${levelID}`);
        }
    }

    static isLevelUnlocked(levelID) {
        return this.getUnlockedLevels().includes(levelID);
    }

    static reset() {
        localStorage.removeItem('unlockedLevels');
    }
}
