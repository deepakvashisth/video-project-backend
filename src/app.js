import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors());

//express middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ALL ROUTES ARE HERE

//ROUTES ARE IMPORTED HERE
import userRoute from "./routes/user.route.js";

//ROUTES ARE DECLARED HERE
app.use("/api/v1/users", userRoute);

export { app };
