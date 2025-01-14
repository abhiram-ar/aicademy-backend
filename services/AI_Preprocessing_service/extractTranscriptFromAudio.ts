import { logErrorMessage, logSuccess } from '../../utils/log';
import assemblyAIClient from './AssemblyAIConfig';
import { Error } from 'assemblyai';

export const extractTranscriptFromAudio = async (
    audioPath: string
): Promise<{ transcript: string; transcriptId: string }> => {
    console.log('extracting transcript...');

    const startTime = Date.now();
    const transcript = await assemblyAIClient.transcripts.transcribe({
        audio: audioPath,
        speech_model: 'nano', //change to 'best' in production
    });
    const timeTaken = Date.now() - startTime;
    logSuccess(`transcript extraction completed in ${timeTaken}ms`);

    if (transcript.error) {
        logErrorMessage('error while extracting transcript');
        throw transcript.error;
    }

    if (!transcript.text) {
        throw new Error('transcript is null or undefined');
    }

    return { transcript: transcript.text, transcriptId: transcript.id };
};

// // testing
// const filePath = '/home/abhiram/Bootcamp/week-10/AIcademy/backend/temp/downloads/Elon.opus';
// extractTranscriptFromAudio(filePath);
