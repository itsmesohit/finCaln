const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: 'redis-cluster-ip-service',
  port: 6379
});
const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

sub.on('message', (channel, message) => {
  redisClient.hSet('values', message, fib(parseInt(message)));
});
sub.subscribe('insert');
