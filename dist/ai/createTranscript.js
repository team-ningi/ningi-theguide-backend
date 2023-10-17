"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTranscript = void 0;
const fs_1 = __importDefault(require("fs"));
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
const createTranscript = async (filePath = "/audiotest.mp3") => {
    const transcription = await openai.audio.transcriptions.create({
        file: fs_1.default.createReadStream(__dirname + filePath),
        model: "whisper-1",
    });
    const textFromAudioFile = transcription.text;
    console.log("transcripted audio:", textFromAudioFile);
    return textFromAudioFile;
};
exports.createTranscript = createTranscript;
