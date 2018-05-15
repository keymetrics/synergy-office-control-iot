/**
 * Parent class which will be inherited by the different modes
 */
module.exports = class Mode {
    constructor() {
        this.timeouts = []
        this.intervals = []
    }

    clearAll() {
        // clear every timeout + interval here
        console.log('Clearing all timeouts + intervals')
    }
    
}