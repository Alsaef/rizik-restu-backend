const express = require('express')
const app = express()
const port = 4000
var cors = require('cors')
require('dotenv').config()
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://rizik-restaurant.vercel.app',
  'https://rizik-dashboard.vercel.app',
  "https://www.rizikrestaurant.com"
];

const corsOptions = {
  origin: function (origin, callback) {

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200
};


app.use(cors(corsOptions))
app.use(express.json())




const { MongoClient, ServerApiVersion, Db, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB}:${process.env.password}@cluster0.ng93ysh.mongodb.net/?appName=Cluster0`;

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
    // await client.connect();

    // code start....

    const DB = client.db('rizik-resturant-DB')
    const foodcollection = DB.collection('foods')
    const foodcollectionTwo = DB.collection('foodsTwo')
    const userCollection = DB.collection('users')
    const categoryCollection = DB.collection('category')
    const servicesCollection = DB.collection('services')
    app.get('/foods', async (req, res) => {
      try {
        const result = await foodcollectionTwo.find({ status: 'In Stock' }).sort({ price: -1, createdAt: -1 }).toArray()
        res.status(200).send(result)

      } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message)
      }

    })


    app.get('/foods-latest', async (req, res) => {
      try {
        const result = await foodcollectionTwo.find({ status: 'In Stock' }).sort({ createdAt: -1 }).toArray()
        res.status(200).send(result)

      } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message)
      }

    })


    app.post('/foods', async (req, res) => {
      try {
        const foodData = req.body;

        // Direct object assembly without managing any extra lookups
        const newFood = {
          ...foodData,
          createdAt: new Date(),
          updateAt: new Date()
        };

        const result = await foodcollectionTwo.insertOne(newFood);
        res.status(200).send(result);

      } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
      }
    });


    // GET: Get item by ID
    app.get('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          console.log(id);
          return res.status(400).send({ error: "Invalid ID" });
        }

        const result = await foodcollectionTwo.findOne({ _id: new ObjectId(id) });

        if (!result) {
          return res.status(404).send({ message: "Item not found" });
        }

        res.send(result);

      } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
      }
    });



    app.patch('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = req.body;

        const newFood = {
          ...updateData,
          createdAt: new Date(),
          updateAt: new Date()
        };
        const result = await foodcollectionTwo.updateOne(
          { _id: new ObjectId(id) },
          { $set: newFood }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Item not found to update" });
        }

        res.send({ message: "Item updated successfully" });

      } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
      }
    });


    app.put('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const result = await foodcollectionTwo.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status, updateAt: new Date() } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Item not found to update" });
        }

        res.send({ message: "Item status updated successfully" });

      }

      catch (error) {
        console.error("Patch error details:", error);
        res.status(500).send({ error: error.message });
      }
    });


    app.get('/foods-stock', async (req, res) => {
      try {
        const result = await foodcollectionTwo.find({ status: 'Out Of Stock' }).toArray()
        res.status(200).send(result)

      } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message)
      }

    })


    app.delete('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;


        const result = await foodcollectionTwo.deleteOne({ _id: new ObjectId(id) });

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Item not found to update" });
        }

        res.send({ message: "Item Delete successfully" });

      } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
      }
    });



    app.post('/register', async (req, res) => {
      try {
        const userData = req.body;


        if (!userData.email) {
          return res.status(400).send({ error: "Email is required" });
        }


        const existingUser = await userCollection.findOne({ email: userData.email });

        if (existingUser) {
          return res.status(409).send({ error: "User already exists" });
        }


        const result = await userCollection.insertOne(userData);

        res.status(201).send({
          message: "User registered successfully",
          insertedId: result.insertedId
        });

      } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      }
    });


    app.get('/admin', async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res.status(400).send({ message: 'Email is required' });
        }

        const result = await userCollection.findOne({ email });

        if (!result) {
          return res.status(404).send({ message: 'User not found' });
        }

        if (result.role !== "admin") {
          return res.status(403).send({ message: 'Access denied' });
        }

        if (!email) {
          return res.status(400).send({ message: 'Email is required' });
        }

        res.status(200).send({ role: 'admin' });

      } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      }
    });


    app.get('/user-list', async (req, res) => {
      try {
        const result = await userCollection.find({ role: 'user' }).toArray()
        if (!result) {
          return res.status(404).send({ message: 'User not found' });
        }
        res.send(result)
      } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      }
    })

    app.patch('/users/:id/role', async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;

      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { role } };
        const result = await userCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'User not found' });
        }

        res.send({ message: 'Role updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
      }
    });


    app.delete('/users/:id', async (req, res) => {
      const { id } = req.params;

      try {
        const filter = { _id: new ObjectId(id) };
        const result = await userCollection.deleteOne(filter);

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'User not found' });
        }

        res.send({ message: 'User deleted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
      }
    });



    app.post('/categories', async (req, res) => {
      try {
        const { name } = req.body;

        if (!name) {
          return res.status(400).send({ message: "Category name is required" });
        }

        // 1. Find the category with the highest count value
        const lastCategory = await categoryCollection
          .find({})
          .sort({ count: -1 }) // Sort in descending order to get the highest count first
          .limit(1)
          .toArray();

        // 2. Calculate the next count sequence (default to 1 if the collection is empty)
        const nextCount = lastCategory.length > 0 ? lastCategory[0].count + 1 : 1;

        // 3. Insert the new document with the calculated sequential count
        const result = await categoryCollection.insertOne({
          name,
          count: nextCount,
          createdAt: new Date()
        });

        res.status(201).send(result);

      } catch (error) {
        console.error(error.message);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
      }
    });

    app.get('/categories', async (req, res) => {
      try {
        const result = await categoryCollection
          .find().sort({ count: 1 })
          .toArray();

        res.status(200).send(result);

      } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      }
    });

    app.delete('/categories/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await categoryCollection.deleteOne(query);
        res.status(200).send(result);

      } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
      }
    });

    app.get('/services', async (req, res) => {

      const result = await servicesCollection.find().toArray()
      if (!result) {
        return res.status(404).send({ message: "services not found" })
      }
      res.status(200).send(result)
    })

    app.get('/services/:id', async (req, res) => {
      const { id } = req.params
      if (!id) {
        return res.status(404).send({ message: "id not found" })
      }
      const result = await servicesCollection.findOne({ _id: new ObjectId(id) })
      if (!result) {
        return res.status(404).send({ message: "services not found" })
      }
      res.status(200).send(result)
    })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
