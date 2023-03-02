require('dotenv').config();
const express = require("express");
const expressWebSocket = require('express-ws');
const WebSocket = require("ws");
const WaveFile = require("wavefile").WaveFile;
const { TextListener } = require("./text-listener.js");
const { SpeakText } = require("./speaking-queue.js");
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
expressWebSocket(app, null, {
  perMessageDeflate: false,
});

let assembly;
let chunks = [];
/** @type {WebSocket} chatWebSocket */
let chatWebSocket;
/** @type {TextListener} textListener */
let globalTextListener;

app.ws("/chat", (ws, req) => {
  ws.send(JSON.stringify({ type: "console", message: "Connected to chat server" }));
  console.log("New Chat Connection Initiated");
  chatWebSocket = ws;
  ws.on("message", (message) => {
    const msg = JSON.parse(message);
    switch (msg.type) {
      case "chatSent":
        console.log("Chat sent:", msg.message);
        break;
      case "botResponse":
        /** @type {String} */
        const botResponse = msg.message;
        const hasSentence = ((botResponse.match( /[\.\?!,:]/ )?.length) ?? 0) > 0;
        let textLeengthCounter = 0;
        if (hasSentence) {
          const sentencs = botResponse.match(/[^\.!\?,:]+[\.!\?,:]+/g);
          for (const sentence of sentencs.slice(0, sentencs.length - 1)) {
            textLeengthCounter += sentence.length;
            if (textLeengthCounter > globalTextListener.speakingQueue.textLengthCounter) {
              globalTextListener.speakingQueue.enqueue(new SpeakText(sentence));
            }
          }
        }
        console.log('queue state: ' + JSON.stringify(globalTextListener?.speakingQueue?.queue ?? []));
        break;
      case 'spokenText':
        globalTextListener.forceState(msg.state);
        globalTextListener.handleCommand('send-chat');

        break;
      default:
        console.log("Unknown message type:", msg.type);
        break;
    }
  });
});

app.ws("/call", (ws, req) => {
  console.info("New Call Connection Initiated");

  ws.on("message", (message) => {
    if (!assembly)
      return console.error("AssemblyAI's WebSocket must be initialized.");

    if (!chatWebSocket)
      return console.error("ChatClint WebSocket must be initialized. Did you run chat-api in your chat window?");

    const msg = JSON.parse(message);

    switch (msg.event) {
      case "connected":
        console.info("A new call has started.");
        assembly.onerror = console.error;
        assembly.onmessage = globalTextListener.onMessage.bind(globalTextListener);
        break;

      case "start":
        console.info("Starting media stream...");
        break;

      case "media":
        const twilioData = msg.media.payload;

        // Here are the current options explored using the WaveFile lib:

        // We build the wav file from scratch since it comes in as raw data
        let wav = new WaveFile();

        // Twilio uses MuLaw so we have to encode for that
        wav.fromScratch(1, 8000, "8m", Buffer.from(twilioData, "base64"));

        // This library has a handy method to decode MuLaw straight to 16-bit PCM
        wav.fromMuLaw();

        // Here we get the raw audio data in base64
        const twilio64Encoded = wav.toDataURI().split("base64,")[1];

        // Create our audio buffer
        const twilioAudioBuffer = Buffer.from(twilio64Encoded, "base64");

        // We send data starting at byte 44 to remove wav headers so our model sees only audio data
        chunks.push(twilioAudioBuffer.subarray(44));

        // We have to chunk data b/c twilio sends audio durations of ~20ms and AAI needs a min of 100ms
        // Chunking to 100ms
        if (chunks.length >= 5) {
          // Here we want to concat our buffer to create one single buffer
          const audioBuffer = Buffer.concat(chunks);

          // Re-encode to base64
          const encodedAudio = audioBuffer.toString("base64");

          // Finally send to assembly and clear chunks
          assembly.send(JSON.stringify({ audio_data: encodedAudio }));
          chunks = [];
        }

        break;

      case "stop":
        console.info("Call has ended");
        assembly.send(JSON.stringify({ terminate_session: true }));
        break;
    }
  });
});

app.get("/", (_, res) => res.send("Twilio Live Stream App"));

app.post("/", async (req, res) => {
  assembly = new WebSocket(
    "wss://api.assemblyai.com/v2/realtime/ws?sample_rate=8000",
    { headers: { authorization: process.env.ASSEMBLYAI_API_KEY } }
  );

  const twiml = new VoiceResponse();
  const start = twiml.start();
  start.stream({
    url: `wss://${req.headers.host}/call`,
  });
  twiml.say({ voice: "Polly.Matthew-Neural" }, "Just a heads up, this call will be recorded and transcribed in real time.");

  twiml.redirect('/check');

  globalTextListener = new TextListener(chatWebSocket);
  globalTextListener.initialize();

  res.type('text/xml');
  res.send(twiml.toString());
});

app.post("/check", async (req, res) => {

  const twiml = new VoiceResponse();

  if (!globalTextListener.speakingQueue.isEmpty()) {
    const text = globalTextListener.speakingQueue.dequeue();
    twiml.say({ voice: globalTextListener.voice }, text.text);
  } else if (Object.keys(globalTextListener.texts).length == 0) {
    twiml.pause({ length: 1 });
  }

  twiml.redirect('/check');

  res.type('text/xml');
  res.send(twiml.toString());
});

console.log("Listening on Port 8080");
app.listen(8080);
