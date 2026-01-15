import dialogues from '../data/dialogues.json';

export default class DialogueManager {
    constructor(scene) {
        this.scene = scene;
        this.active = false;

        // UI Components
        this.container = this.scene.add.container(0, 0);
        this.container.setVisible(false);
        this.container.setScrollFactor(0); // Sticky UI

        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.bg = this.scene.add.rectangle(width / 2, height - 100, width - 40, 150, 0x000000, 0.8);
        this.bg.setStrokeStyle(2, 0xffffff);

        this.text = this.scene.add.text(40, height - 160, '', {
            fontSize: '18px',
            fill: '#fff',
            wordWrap: { width: width - 80 }
        });

        this.container.add([this.bg, this.text]);
        this.choices = [];
    }

    startDialogue(dialogueID, callback) {
        const data = dialogues[dialogueID];
        if (!data) return;

        this.active = true;
        this.container.setVisible(true);
        this.container.setDepth(100); // Ensure UI is on top
        this.updateText(data);
        this.callback = callback;
    }

    updateText(data) {
        this.text.setText(`${data.speaker}: ${data.text}`);

        // Clear old choices
        this.choices.forEach(c => c.destroy());
        this.choices = [];

        // Add choices
        let yOffset = 0;
        const screenHeight = this.scene.scale.height;

        data.choices.forEach((choice, index) => {
            console.log("Rendering choice:", choice.text);

            // Create Text FIRST so we can reference it
            // Moving UP to -130 so it is definitely securely inside the box
            const choiceText = this.scene.add.text(60, screenHeight - 120 + yOffset, `> ${choice.text}`, {
                fontSize: '20px',
                fill: '#ffff00',
                backgroundColor: '#333333'
            });

            // Background for hit area
            const choiceBg = this.scene.add.rectangle(60, screenHeight - 110 + yOffset, 400, 30, 0x555555, 0.5)
                .setOrigin(0, 0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.handleChoice(choice))
                .on('pointerover', () => choiceText.setColor('#ff0000'))
                .on('pointerout', () => choiceText.setColor('#ffff00'));

            // Order: Add BG first to container, then Text, so Text is on top
            this.container.add(choiceBg);
            this.container.add(choiceText);

            this.choices.push(choiceBg);
            this.choices.push(choiceText);

            yOffset += 40;
        });
    }

    handleChoice(choice) {
        console.log("Option clicked:", choice);
        // Trigger actions
        if (choice.action === 'START_QUEST' && this.callback) {
            console.log("Triggering Quest Callback");
            this.callback('START_QUEST', choice.questID);
        }

        if (choice.next) {
            this.startDialogue(choice.next, this.callback);
        } else {
            this.endDialogue();
        }
    }

    endDialogue() {
        this.active = false;
        this.container.setVisible(false);
    }
}
