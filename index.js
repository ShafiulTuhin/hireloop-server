const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");

dotenv.config();
const port = process.env.PORT;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    // await client.connect();
    const database = client.db("Hireloop");
    const jobCollections = database.collection("jobs");
    const companyCollections = database.collection("company");
    const seekerJobCollections = database.collection("seekerJob");
    const profileCollections = database.collection("profile");
    const planCollections = database.collection("plan");
    const subscriptionCollections = database.collection("subscription");
    const userCollections = database.collection("user");

    app.get("/jobs", async (req, res) => {
      const query = {};

      // ---------------- EXISTING FILTERS ----------------
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }

      if (req.query.status) {
        query.status = req.query.status;
      }

      // ---------------- SEARCH ----------------
      if (req.query.search) {
        query.$or = [
          {
            jobTitle: {
              $regex: req.query.search,
              $options: "i",
            },
          },
          {
            companyname: {
              $regex: req.query.search,
              $options: "i",
            },
          },
        ];
      }

      // ---------------- CATEGORY ----------------
      if (req.query.category) {
        query.jobCategory = {
          $in: req.query.category.split(","),
        };
      }

      // ---------------- LOCATION ----------------
      if (req.query.location) {
        query.location = {
          $in: req.query.location.split(","),
        };
      }
      // ---------------- SALARY ----------------

      if (req.query.minSalary || req.query.maxSalary) {
        const min = Number(req.query.minSalary);
        const max = Number(req.query.maxSalary);

        query.$and = [];

        if (req.query.minSalary) {
          query.$and.push({
            maxSalary: { $gte: String(min) },
          });
        }

        if (req.query.maxSalary) {
          query.$and.push({
            minSalary: { $lte: String(max) },
          });
        }
      }
      // console.log("REQ QUERY:", req.query);
      const cursor = jobCollections.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });
    // Create new job API
    app.post("/jobs", async (req, res) => {
      const job = req.body;
      const newJob = {
        ...job,
        createdAt: new Date(),
      };
      const result = await jobCollections.insertOne(newJob);
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
      const company = req.body;
      const newCompany = {
        ...company,
        createdAt: new Date(),
      };
      const result = await companyCollections.insertOne(newCompany);
      res.send(result);
    });
    // Get companies
    app.get("/company", async (req, res) => {
      const result = await companyCollections.find().toArray();
      res.send(result);
    });
    // Get company by email:
    // app.get("/my/company/:email", async (req, res) => {
    //   const { email } = req.params;

    //   const result = await companyCollections
    //     .find({ recruiterEmail: email })
    //     .toArray();

    //   res.send(result);
    // });

    app.get("/my/company/:id", async (req, res) => {
      const { id } = req.params;

      const result = await companyCollections.findOne({
        recruiterId: id,
      });

      res.send(result || {});
    });

    // Job seekers job Create API
    app.post("/seeker/jobs", async (req, res) => {
      const body = req.body;
      const result = await seekerJobCollections.insertOne(body);
      res.send(result);
    });
    //
    app.get("/seeker/jobs", async (req, res) => {
      const result = await seekerJobCollections.find().toArray();
      res.send(result);
    });
    // Get applicant jobs by companyId(FOr recruiter)
    app.get("/seeker/jobs/company/:id", async (req, res) => {
      const { id } = req.params;

      const result = await seekerJobCollections
        .find({ companyId: id })
        .toArray();

      res.send(result);
    });
    // Get applicants jobs(For seeker/applicant)
    app.get("/seeker/jobs/seeker/:id", async (req, res) => {
      const { id } = req.params;

      const result = await seekerJobCollections
        .find({ seekerId: id })
        .toArray();

      res.send(result);
    });
    // Create user profile:
    app.post("/profile", async (req, res) => {
      const profile = req.body;

      const result = await profileCollections.insertOne(profile);
      res.send(result);
    });
    // Get user profile
    app.get("/profile/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await profileCollections.findOne({ userId: id });

        if (!result) {
          return res.status(404).send({ message: "Profile not found" });
        }

        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    // Update Job:
    app.patch("/profile/:id", async (req, res) => {
      const { id } = req.params;

      const updateProfile = req.body;

      const result = await profileCollections.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updateProfile,
        },
      );

      res.send(result);
    });
    // Ge single plan
    // app.get("/plan", async (req, res) => {
    //   const query = {};
    //   if (req.query._id) {
    //     query.id = req.query._id;
    //   }
    //   const plan = await planCollections.findOne(query);
    //   res.send(plan);
    // });
    app.get("/plan", async (req, res) => {
      try {
        const id = req.query._id;

        const plan = await planCollections.findOne({ _id: id });

        if (!plan) {
          return res.status(404).json({
            success: false,
            message: "Plan not found",
          });
        }

        return res.json(plan); // ALWAYS JSON
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    });

    // Create subscription:
    app.post("/subscriptions", async (req, res) => {
      try {
        const data = req.body;

        const newSubscription = {
          ...data,
          createdAt: new Date(),
        };

        const result = await subscriptionCollections.insertOne(newSubscription);

        const filter = { email: data.email };

        const updateUserInfo = {
          $set: {
            plan: data.planId,
          },
        };

        const updateUser = await userCollections.updateOne(
          filter,
          updateUserInfo,
        );

        return res.json({
          success: true,
          insertedId: result.insertedId,
          userUpdated: updateUser.modifiedCount > 0,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to create subscription",
        });
      }
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(5000, () => {
  console.log(`Example app listening on port ${port}`);
});
