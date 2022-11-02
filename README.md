# cluster-bull
Minimal setup to reproduce bugs caused by combining NodeJS cluster with BullMQ queues. See https://github.com/taskforcesh/bullmq/issues/1507 for more info.

1. Make sure Redis is running on `localhost:6379`
2. `npm i && npm run start:dev`
3. Open http://localhost:5005/dashboard to view queue jobs

## Screenshots of issues

- Jobs intermittently get the "missing lock for job" error
![missing lock for job](https://github.com/theoilie/cluster-bull/blob/main/missing_lock_for_job.png?raw=true)
![missing lock for job dashboard](https://github.com/theoilie/cluster-bull/blob/main/missing_lock_for_job_dashboard.png?raw=true)

- ~~Every job on bull-board shows attempt #2 (reflecting `job.attemptsMade`)~~ (this actually shows up with cluster disabled as well - might be a bug with bull-board)
![attempt_2](https://github.com/theoilie/cluster-bull/blob/main/attempt_2.png?raw=true)


## Without cluster
You can verify that changing `CLUSTER_ENABLED` to `false` at the top of index.ts will resolve the first issue ("missing lock for job").