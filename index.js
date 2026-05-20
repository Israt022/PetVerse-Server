const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 8080


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGODB_URI;
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)
// console.log(JWKS);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async(req,res,next) =>{
  const {authorization} = req.headers;
  const token = authorization?.split(" ")[1];
  // console.log("AUTH HEADER:", req.headers.authorization);
  // console.log("TOKEN:", token);
  if(!token){
    return res.status(401).json({message : "Unauthorized"})
  }
   try {
    const { payload } = await jwtVerify(token, JWKS)
    req.user = payload;

    next();
  } catch (error) {
    console.error('Token validation failed:', error)
    return res.status(401).json({message : "Unauthorized"})
  }
  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
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
      const {search,category,sort} = req.query;
      let cursor;
      let query = {};
      // search
      if(search){
          query.petName = {
            $regex : search,
            $options : 'i',
          };
      }
      // Filter
      if(category){
          query.species = {
              $regex: `^${category}$`,
              $options: "i",
          };
      }
      // Find
      cursor = petsCollection.find(query);
      // sort
      if(sort === "low"){
        cursor = cursor.sort({
          adoptionFee : 1
        });
      }
      if(sort === "high"){
        cursor = cursor.sort({
          adoptionFee : -1
        });
      }
      // console.log(search);
      const result = await cursor.toArray();

      res.json(result);
      // console.log(result);
    })
    
    // get pets data by ID
    app.get('/pets/:petId',verifyToken,async(req,res)=>{
      console.log(req.user);
        const {petId} = req.params;
        const query = {_id : new ObjectId(petId)}
        const result = await petsCollection.findOne(query);

        res.json(result);
    })

    // Post pets
    app.post('/pets',async(req,res)=>{
      const petData = req.body;
      const newPet = {
        ...petData,
        adopted : false,
        createdAt : new Date(),
      }
      const result = await petsCollection.insertOne(newPet);

      res.json(result);
    })

    // get my pet list 
    app.get('/my-pets/:email',verifyToken, async (req, res) => {
      const {email} = req.params;
      //  const email = req.user.email; 

      // console.log("email->",email);
      const result = await petsCollection.find({
        ownerEmail: email
      }).toArray();

      res.json(result);
    });

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
