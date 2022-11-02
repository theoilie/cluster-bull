# cluster-bull
Minimal setup to reproduce bugs caused by combining NodeJS cluster with BullMQ queues. See https://github.com/taskforcesh/bullmq/issues/1507 for more info.

1. Make sure Redis is running on `localhost:6379`
2. `npm i && npm run start:dev`
3. Open http://localhost:5005/dashboard to view queue jobs