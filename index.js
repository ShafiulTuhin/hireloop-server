const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("Hireloop");
    const jobCollections = database.collection("jobs");
    const companyCollections = database.collection("company");
    // Get all job API
    app.get("/jobs", async (req, res) => {
      const query = {};
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const cursor = jobCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // Create new job API
    app.post("/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobCollections.insertOne(job);
      res.send(result);
    });
    // Get single job API
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await jobCollections.findOne(query);
      res.send(result);
    });
    // Update Job:
    app.patch("/jobs/:id", async (req, res) => {
      const { id } = req.params;

      const updateJob = req.body;

      const result = await jobCollections.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updateJob,
        },
      );

      res.send(result);
    });
    // Delete Job
    app.delete("/jobs/:id", async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };
      const result = jobCollections.deleteOne(query);
      res.send(result);
    });
    // Get all company API

    // Create new company API
    app.post("/company", async (req, res) => {
      const job = req.body;
      const result = await companyCollections.insertOne(job);
      res.send(result);
    });
    // Get company by email:
    app.get("/company/:email", async (req, res) => {
      const { email } = req.params;

      const result = await companyCollections
        .find({ userEmail: email })
        .toArray();

      res.send(result);
    });
    // Send a ping to confirm a successfl connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
