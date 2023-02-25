
class SpeakingQueue {
    /** @type {SpeakText[]} */
    queue;

    /** @type {number} keeps track of how much of the currnt spoken respomse has been enqueued */
    textLengthCounter;

    constructor() {
        this.queue = [];
        this.textLengthCounter = 0;
    }

    /** @param {SpeakText} speaking */
    enqueue(speaking) {
        this.queue.push(speaking);
        this.textLengthCounter += speaking.text.length;
    }

    /** @param {String} partial to enqueue. This is used to accelerate the first message heard by the user */
    partial(partial) {
        if (this.textLengthCounter >= partial.length) {
            return;
        }
        
        const speaking = new SpeakText(partial.substring(this.textLengthCounter));
        this.queue.push(speaking);
        this.textLengthCounter += speaking.text.length;
    }

    dequeue() {
        return this.queue.shift();
    }

    peek() {
        return this.isEmpty ? undefined : this.queue[0];
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    clear() {
        this.queue = [];
        this.textLengthCounter = 0;
    }
}

class SpeakText {
    /** @type {string} */
    text;

    /** @type {boolean} */
    spoken = false;

    /** @param {String} text */
    constructor(text) {
        this.text = text;
    }

    equals(obj) {
        return this.text === obj.text;
    }
}

exports.SpeakText = SpeakText;
exports.SpeakingQueue = SpeakingQueue;