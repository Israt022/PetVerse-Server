const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()
const app = express()
app.use(cors())
const port = process.env.PORT || 8080


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const db = client.db("petversedb");
    const petsCollection = db.collection("pets");

    // get feature data
    app.get('/features',async(req,res)=>{
        const cursor = petsCollection.find().limit(6);
        const result = await cursor.toArray();

        res.json(result);
    })
    // get pets data
    app.get('/pets',async(req,res)=>{
        const cursor = petsCollection.find();
        const result = await cursor.toArray();

        res.json(result);
    })
    // get pets data by ID
    app.get('/pets/:petId',async(req,res)=>{
        const {petId} = req.params;
        const query = {_id : new ObjectId(petId)}
        const result = await petsCollection.findOne(query);

        res.json(result);
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
