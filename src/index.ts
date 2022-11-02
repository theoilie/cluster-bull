import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { Queue, Worker } from 'bullmq'
import cluster from 'cluster'
import express from 'express'

const REDIS_HOST = '127.0.0.1'
const REDIS_PORT = 6379
const PORT = 5005
const CLUSTER_ENABLED = true
const NUM_CLUSTER_WORKERS = 2
const BULL_CONCURRENCY_PER_PROCESS = 5

const log = (msg: any) => {
  const worker = cluster.worker?.id ?? 'primary'
  console.log(`[worker ${worker}] ${msg}`)
}

const getRandomNum = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const addJobsToQueue = async (queue: Queue) => {
  while (true) {
    await queue.add('test job', { randomNumber: getRandomNum(0, 100) })
    await timeout(getRandomNum(1000, 10_000))
  }
}

const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// The primary process performs one-time validation and spawns worker processes that each run the Express app
const startAppForPrimary = async () => {
  log(`Primary process with pid=${process.pid} is running`)

  // Spawn cluster workers (child processes of the primary)
  log(`Spawning ${NUM_CLUSTER_WORKERS} processes to run the Express app. Each will have its own queue worker to process ${BULL_CONCURRENCY_PER_PROCESS} Bull jobs concurrently...`)
  for (let i = 0; i < NUM_CLUSTER_WORKERS; i++) {
    cluster.fork()
  }
}

// Workers don't share memory - each is its own process running its own Express app and Redis connections for Bull queues
const startAppForWorker = async () => {
  log(`Worker process with pid=${process.pid} and worker is running`)
  await startApp()
}

const startAppWithoutCluster = async () => {
  log(`Starting app with cluster mode disabled...`)
  await startApp()
}

const startApp = async () => {
  // Create Express server
  const app = express()
  app.listen(PORT)

  // Make a queue with a worker
  const queueName = 'test-queue'
  const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT
  } as any
  const queue = new Queue(queueName, { connection })
  await queue.obliterate({ force: true })
  new Worker(
    queueName,
    async (job) => {
      await timeout(getRandomNum(1000, 10_000))
      return { randomNumber: job.data.randomNumber }
    },
    {
      connection,
      concurrency: BULL_CONCURRENCY_PER_PROCESS
    }
  )

  // Setup `/dashboard` endpoint to view queue info
  const serverAdapter = new ExpressAdapter()
  createBullBoard({
    queues: [new BullAdapter(queue)],
    serverAdapter
  })
  serverAdapter.setBasePath('/dashboard')
  app.use('/dashboard', serverAdapter.getRouter())

  await addJobsToQueue(queue)
}

if (!CLUSTER_ENABLED) startAppWithoutCluster()
else if (cluster.isMaster) startAppForPrimary()
else if (cluster.isWorker) startAppForWorker()
else throw new Error("Can't determine if process is primary or worker in cluster")
