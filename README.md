# Live Phone Bot

This code is a Node.js application that uses the Express.js framework and WebSocket to enable real-time transcription and bot interaction. It utilizes Twilio's voice API to capture a phone call's audio and AssemblyAI's WebSocket API to transcribe the call in real-time. The application also uses a Chat WebSocket to handle interactions with a chatbot.

Here's a high-level overview of the code:

Import necessary libraries and initialize Express.js and WebSocket.
Declare necessary variables and instances.
Set up WebSocket connections for chat and call.
Define routes for the Express.js app.
Handle incoming messages and events from the WebSocket connections.
Start the application by listening on a specific port (8080).
When a call is connected, the app will send the audio stream to AssemblyAI for real-time transcription. The transcription result is then processed by the TextListener class, which interacts with the chatbot through the Chat WebSocket. The chatbot's response is then sent back to the caller using Twilio's voice API.

Make a phone call to chat with a bot.

## Tools Used

- [Twilio](https://www.twilio.com/) - for making phone calls and streaming audio to the bot
- [AssemblyAI](https://www.assemblyai.com/) - for transcribing the audio
- [ngrok](https://ngrok.com/) - to make it simple to use a local server
- [LangChain](https://github.com/hwchase17/langchain) - for deciding what to do with your input [Next]
- [ChatGPT](https://chat.openai.com/) - for maintaining a conversation [Next after that]

## How to Use

1. Follow this [guide](https://www.assemblyai.com/blog/transcribe-twilio-phone-calls-in-real-time-with-assemblyai/) to set up twilio and assemblyai
2. Clone this repo
3. Add your assemblyai credentials to the `.env` file by running `echo "ASSEMBLYAI_API_KEY=<your api key>" >> .env` in the root directory
4. run `npm install`
5. run `npm start`

Now you should be able to make a phone call to your twilio number and have it transcribed by assemblyai. The transcription will then be printed to the console.
