class ListenerFactory {
    constructor() {
        this.listeners = {};
    }

    addListener(elementID, event, handler, options = {}) {
        if(!document.getElementById(elementID)) {
            return null
        }
        this.listeners[elementID]

    }
}