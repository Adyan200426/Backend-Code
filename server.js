import express from "express";
// import { MongoClient, ObjectId } from "mongodb";
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectId;
import path from "path";
import { fileURLToPath } from "url";

// Start the app
const adyanApp = express();
const openPortForApp = process.env.PORT || 3000;

// My middleware
adyanApp.use(express.json());

// Integrate CORS Middleware Policy
adyanApp.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Database Connection
let db;

MongoClient.connect("mongodb+srv://adyansyxd:adyan1234@cluster0.icjfw.mongodb.net/"); {
  if (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1); // Exit the process if the connection fails
    }
    db = client.db("Webstore");
    console.log("Connected to MongoDB!"); 
}
adyanApp.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve images with the help of this code
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
adyanApp.use("/images", express.static(path.join(__dirname, "images")));
adyanApp.use("/images", (req, res) => {
  res.status(404).send("Image not found. Please check the URL.");
});

// Configure mongodb connection
//const uriLinkForMongodb =
 // process.env.MONGODB_URI || "mongodb+srv://adyansyxd:adyan1234@cluster0.icjfw.mongodb.net/";
//const clientConnectionLink = new MongoClient(uriLinkForMongodb);//

// (Optional) Connect once before running the server to handle errors early
//await clientConnectionLink.connect();

// Example usage of an alternative database "webstore" if needed elsewhere
//const db = clientConnectionLink.db("webstore");
const orders = db.collection("orders");

let theCollectionForLessons;
let theCollectionForOrders;

async function run() {
  try {
    // Get the "webstore" database. If you need to use the "After_School" database,
    // update the string accordingly.
    const databaseVariableForUsage = clientConnectionLink.db("webstore");
    theCollectionForLessons = databaseVariableForUsage.collection("lessons");
    theCollectionForOrders = databaseVariableForUsage.collection("orders");

    adyanApp.get("/", (req, res) => {
      res.send(`
        <h1>Welcome to Adyan's Backend Server</h1>
        <ul>
          <li><a href="/orders">Go to Adyan's Orders</a></li>
          <li><a href="/lessons">Go to Adyan's Lessons</a></li>
        </ul>
      `);
    });

    adyanApp.get("/lessons", async (req, res) => {
      try {
        const findAllLessons = await theCollectionForLessons.find({}).toArray();
        res.json(findAllLessons);
      } catch (error) {
        res.status(500).json({ error: "Failure" });
      }
    });

    adyanApp.get("/orders", async (req, res) => {
      try {
        const findAllOrders = await theCollectionForOrders.find({}).toArray();
        res.json(findAllOrders);
      } catch (error) {
        res.status(500).json({ error: "Failure" });
      }
    });

    adyanApp.post("/orders", async (req, res) => {
      try {
        const order = req.body;
        const resultFromDatabaseVariable = await theCollectionForOrders.insertOne(order);
        res
          .status(201)
          .json({ message: "Order is created", orderId: resultFromDatabaseVariable.insertedId });
      } catch (error) {
        res.status(500).json({ error: "Failure" });
      }
    });

    adyanApp.put("/lessons", async (req, res) => {
      try {
        const lessonsInBody = req.body;
        // Remove _id if it exists
        delete lessonsInBody._id;

        // Extract id and remaining fields (assumes the body contains an "id" field)
        const { id, ...fieldsWeNeedToUpdate } = lessonsInBody;

        // Update the lesson document by matching its "id" field
        const resultsFromDatabase = await theCollectionForLessons.updateOne(
          { id: id },
          { $set: fieldsWeNeedToUpdate }
        );

        res.json({ message: "Update successful", results: resultsFromDatabase });
      } catch (error) {
        res.status(500).json({ error: "Failed" });
      }
    });

    adyanApp.get("/search", async (req, res) => {
      const theSearchQuery = (req.query.q || "").trim();

      try {
        if (!theSearchQuery) {
          const lessonsFromDatabase = await theCollectionForLessons.find({}).toArray();
          return res.json(lessonsFromDatabase);
        }

        const regexQueryOperation = new RegExp(theSearchQuery, "i");

        const resultsFromDatabase = await theCollectionForLessons
          .find({
            $or: [
              { subject: regexQueryOperation },
              { location: regexQueryOperation },
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$price" },
                    regex: theSearchQuery,
                    options: "i",
                  },
                },
              },
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$space" },
                    regex: theSearchQuery,
                    options: "i",
                  },
                },
              },
            ],
          })
          .toArray();

        res.json(resultsFromDatabase);
      } catch (err) {
        res.status(500).json({ error: "Failure" });
      }
    });

    // Continuously run the server
    adyanApp.listen(openPortForApp, () => {
      console.log(`Adyan's Server runs on port ${openPortForApp}`);
    });
  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);
