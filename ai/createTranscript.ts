import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();
// const apiKey = process.env.OPENAI_API_KEY;

const createTranscript = async (filePath = "/audiotest.mp3") => {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(__dirname + filePath),
    model: "whisper-1",
  });
  const textFromAudioFile = transcription.text;

  console.log("transcripted audio:", textFromAudioFile);
  return textFromAudioFile;
};

export { createTranscript };
