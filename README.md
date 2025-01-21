# aicademy-backend
production changes,
- [ ] use 'best' model insted of nano for speech to text, which is 34% slower and cost almost 10x but provide better accuracy
- [ ] increase the concurront ai preprocessing by increasing prefetch of rabbitmq
- [ ] change file cleanup after processing video and audio to async
- [ ] user production collection for qdrant
- [ ] ws authication, change auth protorol to https in `authenticate client.ts`
- [ ] use single thread for video tanscodin in `transcodeVideo.ts`
- [ ] if the app is converted to microservice then, use full thread for transcoding the video and promisify transoding for each resolution


# reports
- [ ] full-thread - 10500ms ~ 1.8min
- [ ] single thread with Promise.all - 33288ms ~ 5min
- [ ] single thread in sequence promise - 500795ms ~ 8min