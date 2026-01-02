import express from "express";
import cors from "cors";  
import initDefaultUser from "./src/config/defaultUser.js";
import indexrouter from "./src/routes/index.js";

const app = express();

const port = process.env.PORT || 4000;
app.use(express.json());
app.use(cors());


app.use("/api", indexrouter);

app.listen(port, async () => {
  console.log("app run at port : ", port);
  await initDefaultUser();
});
