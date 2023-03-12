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
          });
        } else {
          res.status(401).json({
            error: "Authenticatin Failed",
          });
        }
      } else {
        res.status(401).json({
          error: "Authenticatin Failed",
        });
      }
    });

    // get products
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
      const products = await cursor
        .skip(page * 5)
        .limit(5)
        .toArray();
      res.send(products);
    });

    // app.get("/products", async (req, res) => {
    //   const page = +req.query.page;
    //   const size = +req.query.size;
    //   console.log(page, size);
    //   const query = {};
    //   const cursor = productCollection.find(query);
    //   const products = await cursor
    //     .skip(page * size)
    //     .limit(size)
    //     .toArray();
    //   const count = await productCollection.estimatedDocumentCount();
    //   res.send({ products, count });
    // });
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
