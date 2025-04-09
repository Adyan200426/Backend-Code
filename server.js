// Import everything
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
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
const uriLinkForMongodb = process.env.MONGODB_URI || "mongodb+srv://abdulla:Abdulla123@cluster0.h8xjc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const clientConnectionLink = new MongoClient(uriLinkForMongodb);

let theCollectionForLessons;
let theCollectionForOrders;

async function run() {
  try {
    await clientConnectionLink.connect();
    const databaseVariableForUsage = clientConnectionLink.db("After_School");
    theCollectionForLessons = databaseVariableForUsage.collection("lessons");
    theCollectionForOrders = databaseVariableForUsage.collection("orders");

    adyanApp.get("/", (req, res) => {
      res.send(`
    <h1>Welcome to the Adyan's Backend Server</h1>
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

    adyanApp.put('/lessons', async (req, res) => {
			try {

				const lessonsInBody = req.body;
				delete lessonsInBody._id;

				const { id, ...fieldsWeNeedToUpdate } = lessonsInBody;

				const resultsFromDatabase = await lessonsCollection.updateOne(
					{ id: id },
					{ $set: fieldsWeNeedToUpdate }
				);

				res.json({ message: 'successful' });
			} catch (error) {
				res.status(500).json({ error: 'Failed' });
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
                    input: { $toString: "price" },
                    regex: theSearchQuery,
                    options: "i",
                  },
                },
              },
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "space" },
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
