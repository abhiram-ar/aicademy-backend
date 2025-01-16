import { logErrorMessage, logSuccessWithTimestamp, logWithTimestamp } from '../../utils/log';
import assemblyAIClient from './AssemblyAIConfig';

export const extractTranscriptFromAudio = async (
    audioPath: string
): Promise<{ text: string; id: string }> => {
    try {
        logWithTimestamp('extracting transcript...');

        const startTime = Date.now();
        const transcript = await assemblyAIClient.transcripts.transcribe({
            audio: audioPath,
            speech_model: 'nano', //change to 'best' in production
        });
        const timeTaken = Date.now() - startTime;
        logSuccessWithTimestamp(`transcript extraction completed in ${timeTaken}ms`);

        if (transcript.error) {
            logErrorMessage('error while extracting transcript');
            throw transcript.error;
        }

        if (!transcript.text) {
            throw new Error('transcript is null or undefined');
        }

        return { text: transcript.text, id: transcript.id };
    } catch (error) {
        logErrorMessage('error while extracting audio transcript');
        throw error;
    }
};

// // testing
// const filePath = '/home/abhiram/Bootcamp/week-10/AIcademy/backend/temp/downloads/Elon.opus';
// extractTranscriptFromAudio(filePath);
