const WebSocket = require("ws");
const { SpeakingQueue, SpeakText } = require("./speaking-queue");
const { OpenAI } = require("langchain");
const { initializeAgentExecutor, Tool, AgentExecutor } = require("langchain/agents");
const { BaseLLM } = require("langchain/llms");
const { DynamicTool } = require("langchain/tools");

class TextListener {
    /** @type {WebSocket} chatWebSocket */
    chatWebSocket;

    /** @type {SpeakingQueue} */
    speakingQueue;

    /** @type {Object} */
    texts;

    /** @type {String} */
    voice;

    /** @type {String} */
    msg;

    /** @type {Tool[]} */
    tools;

    /** @type {BaseLLM} */
    model;

    /** @type {AgentExecutor} */
    executor;

    constructor(chatWebSocket) {
        this.texts = {};
        this.msg = '';
        this.chatWebSocket = chatWebSocket;
        this.speakingQueue = new SpeakingQueue();
        this.model = new OpenAI({ temperature: 0, openAIApiKey: process.env.OPENAI_API_KEY });
        this.voice = "Polly.Matthew-Neural";
        this.tools = [
            new DynamicTool({
                name: "CHANGE_VOICE",
                description: "call this when the user wants to change the voice",
                func: (chat) => this.handleCommand('change-voice'),
            }),
            new DynamicTool({
                name: "SEND_CHAT",
                description: "call this when the user is done speaking and doesn't want to perform any special action",
                func: (chat) => this.handleCommand('send-chat'),
            }),
        ];
    }

    async initialize() {
        this.executor = await initializeAgentExecutor(
            this.tools,
            this.model,
            "zero-shot-react-description"
        );
    }

    forceState(state) {
        this.texts = state.texts;
        this.msg = state.msg;
    }

    async onMessage(assemblyMsg) {
        const res = JSON.parse(assemblyMsg.data);
        this.texts[res.audio_start] = res.text;
        const keys = Object.keys(this.texts);
        keys.sort((a, b) => a - b);
        this.msg = '';
        for (const key of keys) {
            if (this.texts[key]) {
                this.msg += ` ${this.texts[key]}`;
            }
        }
        // const detectedCommands = this.detectCommand();
        // for (const command of detectedCommands) {
        //     this.handleCommand(command);
        // }
        if (this._endsOnPause()) {
            const text = this.msg.substring(0, this.msg.length - 1);
            const input = `I need to use only one of my tools to act on the following text: ${text}`;
            await this.executor.call({ input });
            console.log(`acted on ${text}`);
        }
        console.log(this.msg);
    }

    _endsOnPause() {
        return this.msg.substring(this.msg.length - 1).match(/[\.\?!,:]/);
    }

    detectCommand() {
        const detectedCommands = [];

        if (this.msg.toLocaleLowerCase().includes('command') && this.msg.toLocaleLowerCase().includes('clear')) {
            detectedCommands.push('clear');
        }

        if (this.msg.toLocaleLowerCase().includes('command') && this.msg.toLocaleLowerCase().includes('send')) {
            detectedCommands.push('send-chat');
        }

        return detectedCommands;
    }

    handleCommand(command) {
        switch (command) {
            case 'send-chat':
                this.chatWebSocket.send(JSON.stringify({ type: "console", message: JSON.stringify({ texts: this.texts, msg: this.msg }) }));
                this.msg.toLocaleLowerCase().indexOf('command') > -1 && (this.msg = this.msg.replace(/command .*/g, '').trim());
                this.chatWebSocket.send(JSON.stringify({ type: "sendChat", message: this.msg }));
                this.texts = {};
                this.msg = '';
                this.speakingQueue.clear();
                break;
            case 'change-voice':
                this.texts = {};
                this.msg = '';
                this.speakingQueue.clear();
                this.voice = this.voice === "Polly.Matthew-Neural" ? "Polly.Joanna-Neural" : "Polly.Matthew-Neural";
                this.speakingQueue.enqueue(new SpeakText(`Voice changed!`));
            default:
                break;
        }
    }
}

exports.TextListener = TextListener;