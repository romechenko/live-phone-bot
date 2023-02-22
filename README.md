# Live Phone Bot

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
3. Add your assemblyai credentials to the `.env` file by running `echo ASSEMBLYAI_API_KEY=<your api key> >> .env` in the root directory
4. run `npm install`
5. run `npm start`

Now you should be able to make a phone call to your twilio number and have it transcribed by assemblyai. The transcription will then be printed to the console.