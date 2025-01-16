import { AssemblyAI } from 'assemblyai';
import * as dotEnv from 'dotenv';
import path from 'path';
dotEnv.config({ path: path.join(__dirname, '..', '..', '.env') });

const assemblyAIClient = new AssemblyAI({ apiKey: process.env.ASSEMBLY_AI_API_KEY as string });

export default assemblyAIClient;
