import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';

import * as dotenv from 'dotenv';
import path from 'path';
import { logSuccessWithTimestamp, logWithTimestamp } from '../../utils/log';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export const preComputeEmbedding = async (transcript: string, videoKey: string) => {
    logWithTimestamp('started chunking transcript..');
    const chunks = await splitter.splitText(transcript);
    logSuccessWithTimestamp('completed chunking transcript');

    logWithTimestamp('computing embeding..');
    const vectorStore = await QdrantVectorStore.fromTexts(chunks, { key: videoKey }, embedding, {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: 'langchainjs-test2',
    });
    logSuccessWithTimestamp('completed computing embedding and saved to Vector store');

    return vectorStore ? true : false;
};

const embedding = new OpenAIEmbeddings({
    model: 'text-embedding-3-large',
    openAIApiKey: process.env.OPENAI_API_KEY,
});

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 100,
});

//test
// const transcript =
//     "You, like I mentioned with SpaceX, you give a lot of people hope and a lot of people look up to you. Millions of people look up to you. If we think about young people in high school, maybe in college, what advice would you give to them about if they want to try to do something big in this world, they want to really have a big positive impact, what advice would you give them about their career, maybe about life in general? Try to be useful. You do things that are useful to your fellow human beings, to the world. It's very hard to be useful, very hard. Are you contributing more than you consume? Can you try to have a positive net contribution to society? I think that's the thing to aim for, you know, not to try to be sort of a leader for just for the sake of being a leader or whatever. A lot of time people, a lot of times the people you want as leaders are the people who don't want to be leaders. So if you live a useful life, that is a good life, a life worth having lived, you know, and like I said, I would encourage people to use the mental tools of physics and apply them broadly in life. They are the best tools. When you think about education and self education, what do you recommend? So there's the university, there is self study, there is a hands on sort of finding a company or a place or set of people that do the thing you're passionate about and joining them as early as possible. There's taking a road trip across Europe for a few years and writing some poetry. Which trajectory do you suggest in terms of learning about how you can become useful as you mentioned, how you can have the most positive impact? Well, I encourage people to read a lot of books. Just read like mean basically try to ingest as much information as you can and try to also just develop a good general knowledge. So. So you at least have like a rough lay of the land of the knowledge landscape. Like try to learn a little bit about a lot of things. Cause you might not know what you're really interested. How would you know what you're really interested in if you at least aren't like doing a peripheral exploration of broadly of the knowledge landscape and you talk to people from different walks of life and different industries and professions and skills and occupations. Like just try learn as much as possible, man. Search for meaning. Isn't the whole thing a search for a meaning? Yeah, what's the meaning of life and all, but just generally, like I said, I would encourage people to read broadly in many different subject areas and then try to Find something where there's an overlap of your talents and what you're interested in. So people may be good at something but. Or they may have skill at a particular thing, but they don't like doing it. So you wanna try to find thing where you. That's a good combination of the things that you're inherently good at, but you also like doing. And reading is a super fast shortcut to figure out which where are you. You both good at it, you like doing it and it will actually have positive impact. Well, you gotta learn about things somehow. So reading a broad range, just really read it. You know, one important one was a kid I kind read through the encyclopedia. So that's pretty helpful. And there all so things I didn't even know existed. All lights. Obviously it's like as broad as it gets. Encyclopeds were digestible I think, you know, whatever 40 years ago. So you maybe read through the condensed version of the Encyclopedia Britannica. I'd recommend that you can always like skip subjects. So you read a few paragraphs and you know you're not interested, just jump to the next one. So read the encyclopedia or scan, skim through it and. But you know, I put a lot of stock and certainly have a lot of respect for someone who puts in on honest day's work to do useful things and just generally to have like not a zero sum mindset or like have more of a grow the pie mindset. Like the. If you sort of say like when I see people like perhaps including some very smart people kind of taking an attitude of like doing things that seem like morally questionable, it's often because they have at a base sort of axiomatic level a zero sum mindset. And they, without realizing it, they don't realize they have a zero su mindset or at least they don't realize it consciously. And so if you have a zero sum mindset, then the only way to get ahead is by taking things from others. It's like if the pie is fixed, then the only way to have more pie is to take someone else's pie. But this is false. Like obviously the pie has grown dramatically over time the economic pie. So in reality you can have the overus. This analogy. You can have a lot of. There's a lot of PI. PI. PI is not fixed. So you really want to make sure you're not operating without realizing it. From a zero sum mindset where the only way to get ahead is to take things from others, then that's going to result in you trying to take things from others, which is not, not good. It's much better to work on adding to the economic pie. So creating, like I said, creating more than you consume, doing more than you. Yeah, so that's a big deal. I think there's like a fair number of people in finance that do have a bit of a zero sum mindset. I mean, it's all walks of life. I've seen that. One of the, one of the reasons Rogan inspires me is he celebrates others a lot. There's not, not creating a constant competition. Like there's a scarcity of resources. What happens when you celebrate others and you promote others, the ideas of others, it, it actually grows that pie. I mean it every. Like the, the resource, the resources become less scarce. And that applies in a lot of kinds of domains. It applies in academia where a lot of people are very. See, some funding for academic research is zero sum. It is not. If you celebrate each other, if you make, if you get everybody to be excited about AI, about physics above mathematics, I think there'd be more and more funding and I think everybody wins. Yeah, that applies, I think broadly. Yeah, yeah, exactly.";
// preComputeEmbedding(transcript, 'video2');
