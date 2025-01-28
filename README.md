# aicademy-backend
This repository contains the backend code for the AIcademy project. The backend is responsible for handling AI preprocessing, video and audio processing, authentication, and more. The project is primarily written in TypeScript and uses various third-party libraries for functionality.

## Table of Contents
- Introduction
- Features
- Setup
- Contributing
- License

## Features
- Authentication: Secure stateless authentication and authorization using JWT.
- AI Preprocessing: Utilizes advanced AI models for preprocessing video for AI services.
- Video and Audio Processing: Handles video transcoding and audio processing using ffmpeg.
- WebSocket Support: Real-time communication using WebSockets.

## Setup
### Binary dependency
1. FFmpeg - Ensure FFmegg is installed in your system
2. Rabbitmq - Either run a local rabbitmq in a container or user cloudAMPQ services


### Development environment
To set up the development environment, follow these steps:
1. Clone the repository:
```bash
git clone https://github.com/abhiram-ar/aicademy-backend.git
cd aicademy-backend
```
2. Install the dependencies
```bash
npm install
```
3. Set up environment variables:
Create a .env file in the root directory and add the necessary environment variables as specified in the .env.example file.
4. Start the development server:
```bash
npm run dev-ts
```

## Contributing
We welcome contributions to the AIcademy Backend project. To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Make your changes and commit them with a clear message.
4. Push your changes to your fork.
5. ubmit a pull request detailing your changes.

## License
This project is licensed under the MIT License.

## production changes,
- [ ] use 'best' model insted of nano for speech to text, which is 34% slower and cost almost 10x but provide better accuracy
- [ ] increase the concurront ai preprocessing by increasing prefetch of rabbitmq
- [ ] change file cleanup after processing video and audio to async
- [ ] user production collection for qdrant
- [ ] ws authication, change auth protorol to https in `authenticate client.ts`
- [ ] use single thread for video tanscodin in `transcodeVideo.ts`
- [ ] if the app is converted to microservice then, use full thread for transcoding the video and promisify transoding for each resolution


## reports - 10min video transcoding and ai preprocessing
- [ ] full-thread - 10500ms ~ 1.8min
- [ ] single thread with Promise.all - 33288ms ~ 5min
- [ ] single thread in sequence promise - 500795ms ~ 8min