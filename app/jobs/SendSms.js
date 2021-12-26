const Queue = require('bee-queue');
const addQueue = new Queue('addition');

const subQueue = new Queue('subtraction', {
    redis: {
        host: `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    },
    isWorker: false,
});