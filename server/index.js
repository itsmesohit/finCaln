const keys = require("./keys");

// Express App Setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error('Error creating table:', err));
});

pgClient.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

// Redis Client Setup
const redis = require("redis");
const redisClient = redis.createClient({
  host: 'redis-cluster-ip-service',
  port: 6379
});
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  try {
    const values = await pgClient.query("SELECT * FROM values");
    res.send(values.rows);
  } catch (err) {
    console.error('Error fetching values:', err);
    res.status(500).send('Internal server error');
  }
});

app.get("/values/current", (req, res) => {
  redisClient.hGetAll("values", (err, values) => {
    if (err) {
      console.error('Redis error:', err);
      res.status(500).send('Internal server error');
    } else {
      res.send(values);
    }
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  try {
    redisClient.hSet("values", index, "Nothing yet!");
    redisPublisher.publish("insert", index);
    await pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
    const res = redisClient.get(index);
    res.send({ working: true, message: "Index added!" , index: index});
    
  } catch (err) {
    console.error('Error processing value:', err);
    res.status(500).send('Internal server error');
  }
});

app.listen(5000, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log("Listening on port 5000");
});
