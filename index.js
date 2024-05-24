
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId, MongoTailableCursorError } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

require("dotenv").config();
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.8srq6fs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    // await client.connect();

    const queriesCollection = client.db("queriesdb").collection("queries");
    const recommendationsCollection = client.db("queriesdb").collection("recommendations");


    // app.post('/jwt', async(req, res) => {
    //   const user = req.body;
    //   console.log('user token', user)
    //   // const token = jwt.sign(user, TOKEN_SECRET, {expiresIn: '1h'});

    //   res.send({token});
    // })

    // Get all queries
    app.get('/queries', async(req, res) => {
      const result = await queriesCollection.find().toArray();
      res.send(result);
    });

    // Get query by cost
    app.get("/find/:cost", async(req, res) => {
      const result = await queriesCollection.find({ cost: req.params.cost }).toArray();
      res.send(result);
    });


    app.get("/queries/:email", async (req, res) => {
      const result = await queriesCollection.find({ email: req.params.email }).toArray();
      res.send(result);
    });

    // Add a new query
    app.post("/queries", async (req, res) => {
      const queries = req.body;
      const result = await queriesCollection.insertOne(queries);
      res.send(result);
    });

    // Get query details by ID
    app.get("/update/:id", async (req, res) => {
      const result = await queriesCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    

    // Delete a query by ID
    app.delete('/delete/:id', async(req, res) => {
      const result = await queriesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      console.log(result);
      res.send(result);
    });


    app.get("/recommendations/:id", async(req, res) => {
      const result = await recommendationsCollection.find({ queryId: req.params.id }).toArray();
      res.send(result);
    });

    app.get("/myrecommendations/:email", async (req, res) => {
      const result = await recommendationsCollection.find({ recommenderEmail: req.params.email }).toArray();
      res.send(result);
    });

  
app.delete("/recommendation/:id", async (req, res) => {
  const recommendationId = req.params.id;

  // Find the recommendation to get the queryId
  const recommendation = await recommendationsCollection.findOne({ _id: new ObjectId(recommendationId) });
  if (!recommendation) {
    return res.status(404).send({ message: "Recommendation not found" });
  }

  // Delete the recommendation
  const result = await recommendationsCollection.deleteOne({ _id: new ObjectId(recommendationId) });

  // Decrement the recommendation count in the query document
  const queryId = recommendation.queryId;
  await queriesCollection.updateOne(
    { _id: new ObjectId(queryId) },
    { $inc: { Recommendation_Count: -1 } }
  );

  res.send(result);
});



app.get("/recommendationsforme/:email", async (req, res) => {
  const userEmail = req.params.email;
  const userQueries = await queriesCollection.find({ email: userEmail }).toArray();
  
  const queryIds = userQueries.map(query => query._id.toString());

  const recommendations = await recommendationsCollection.find({ queryId: { $in: queryIds } }).toArray();

  res.send(recommendations);
});



    // Add recommendation
    app.post("/recommendations", async (req, res) => {
      const recommendation = req.body;
      const result = await recommendationsCollection.insertOne(recommendation);
      const queryId = recommendation.queryId;
      await queriesCollection.updateOne(
        { _id: new ObjectId(queryId) },
        { $inc: { Recommendation_Count: 1 } }
      );

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("This is server site");
});

app.listen(port, (req, res) => {
  console.log(`The Port : ${port}`);
});
