export default class InteractionSystem {
    constructor(scene) {
        this.scene = scene;
    }

    setup(player, interactablesGroup) {
        this.scene.physics.add.overlap(player, interactablesGroup, this.onOverlap, null, this);
    }

    onOverlap(player, interactable) {
        // Debounce or check flags if needed

        switch (interactable.name) {
            case 'Portal':
                this.handlePortal(interactable);
                break;
            default:
                console.log("Interacting with unknown:", interactable.name);
                break;
        }
    }

    handlePortal(portal) {
        const targetLevel = portal.getData('targetLevel');
        if (targetLevel) {
            console.log(`Teleporting to ${targetLevel}...`);
            // Add a small delay or fade effect here in a real game
            this.scene.scene.restart({ levelID: targetLevel });
        }
    }
}
