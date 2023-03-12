// alamin_hossain
// KSwpZnHg9CNzCQWU

const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB Connect
const uri = `mongodb+srv://alamin_hossain:KSwpZnHg9CNzCQWU@cluster0.rfyyfuu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// jwt validation

const jsonwebtoken = (req, res, next) => {
  const { authorization } = req.headers;
  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, "aebealfaskaowoslakfanwdkadklaf");
    const { userName, userId } = decoded;
    req.userName = userName;
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({
      message: "Auth Failed",
    });
  }
};

// verify user validation

app.get("/jwt", jsonwebtoken, (req, res) => {
  res.json({
    Message: "Valid User",
  });
});

// Try function

async function run() {
  try {
    const productCollection = client.db("emaJohn").collection("products");
    const userCollection = client.db("emaJohn").collection("users");

    // Save New user Sign Up

    app.post("/signup", async (req, res) => {
      const encryptPassword = await bcrypt.hash(req.body.password, 10);
      const user = {
        name: req.body.name,
        userName: req.body.userName,
        password: encryptPassword,
      };
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // user login api

    app.post("/login", async (req, res) => {
      const user = await userCollection
        .find({
          userName: req.body.userName,
        })
        .toArray();

      if (user && user.length > 0) {
        const isPasswordValid = await bcrypt.compare(
          req.body.password,
          user[0].password
        );
        if (isPasswordValid) {
          const token = jwt.sign(
            {
              userName: user[0].userName,
              userId: user[0]._id,
            },
            "aebealfaskaowoslakfanwdkadklaf",
            {
              expiresIn: "1h",
            }
          );
          res.status(200).json({
            accesToken: token,
            message: "login success",
            userId: user[0]._id,
            name: user[0].name,
          });
        } else {
          res.json({
            error: "Authenticatin Failed",
          });
        }
      } else {
        res.json({
          error: "Authenticatin Failed",
        });
      }
    });

    // add product
    app.post("/add-product", async (req, res) => {
      const product = req.body;

      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    // get products all products or search products
    app.get("/products", async (req, res) => {
      const page = +req.query.page;
      const query = {
        $or: [
          {
            name: { $regex: new RegExp(".*" + req.query.search + ".*", "i") },
          },
          {
            seller: { $regex: new RegExp(".*" + req.query.search + ".*", "i") },
          },
          {
            category: {
              $regex: new RegExp(".*" + req.query.search + ".*", "i"),
            },
          },
        ],
      };
      const queryAll = {};

      const cursor = productCollection.find(
        req.query.search ? query : queryAll
      );

      const search = await productCollection.find(query).toArray();
      const products = await cursor
        .skip(page * 5)
        .limit(5)
        .sort({ _id: -1 })
        .toArray();

      let count = 0;
      if (req.query.search !== "") {
        count = search.length;
      } else {
        count = await productCollection.estimatedDocumentCount();
      }
      res.send({ products, count });
    });

    // get products by id

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };

      const cursor = await productCollection.findOne(query);

      res.send(cursor);
    });

    // edit product by id
    app.put("/edit/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const product = req.body;
      const option = { upsert: true };
      const updatedProduct = {
        $set: {
          name: product.name,
          category: product.category,
          seller: product.seller,
          price: product.price,
          ratings: product.ratings,
          stock: product.stock,
          img: product.img,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedProduct,
        option
      );
      res.send(result);
    });

    // delete product by id
    app.post("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send(`Server Running on port:${port} `);
});

app.listen(port, () => {
  console.log("server running port:", port);
});
