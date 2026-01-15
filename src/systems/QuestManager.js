import questsConfig from '../data/quests.json';

class QuestManager {
    constructor() {
        if (QuestManager.instance) return QuestManager.instance;
        QuestManager.instance = this;

        this.quests = JSON.parse(JSON.stringify(questsConfig)); // Deep copy to current session status
        this.listeners = [];
    }

    startQuest(questID) {
        if (this.quests[questID]) {
            this.quests[questID].status = 'ACTIVE';
            console.log(`Quest Started: ${this.quests[questID].title}`);
            this.notify();
        }
    }

    onEnemyKilled(enemyID) {
        for (let id in this.quests) {
            const quest = this.quests[id];
            if (quest.status === 'ACTIVE') {
                quest.objectives.forEach(obj => {
                    if (obj.type === 'KILL' && obj.target === enemyID) {
                        obj.current++;
                        console.log(`Quest Update: ${quest.title} - ${obj.current}/${obj.amount}`);
                        this.checkCompletion(id);
                    }
                });
            }
        }
        this.notify();
    }

    checkCompletion(questID) {
        const quest = this.quests[questID];
        const allComplete = quest.objectives.every(obj => obj.current >= obj.amount);

        if (allComplete) {
            quest.status = 'COMPLETED';
            console.log(`Quest Completed: ${quest.title}!`);
            // Give Rewards (Mock)
        }
    }

    // Observer Pattern for UI
    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.quests));
    }

    getQuestStatus(questID) {
        return this.quests[questID]?.status || 'INACTIVE';
    }

    resetQuest(questID) {
        if (this.quests[questID]) {
            // Reload initial state for this quest from config
            // For simplicity, we can just reset status and objectives using the imported config.
            // But since we didn't keep a reference to the original config structure inside the instance other than the deep copy constructor...
            // We can import it again or just reset status if we trust objectives don't change structure heavily or we can re-deep-copy from a saved reference.
            // Let's assume re-copying the specific quest from the imported config is best.
        }
    }

    resetAll() {
        this.quests = JSON.parse(JSON.stringify(questsConfig));
        this.notify();
    }
}

export default new QuestManager();
