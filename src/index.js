// require("dotenv").config({
//   path: "./env",
// });
import dotenv from "dotenv";
import connectToDb from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./env",
});

connectToDb()
  .then(() => {
    app.on('error', (err) => {
      console.log("error in app ",err)
    })
    app.listen(process.env.PORT || 8000, () => {
      console.log(`listening to port ${process.env.PORT || 8000}`);
    })
    
  })
  .catch((err) => {
    console.error("error in conencting to db and error is ", err);
  });

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.error("Error in app ", error);
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`app is listening to port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("ERROR", error);
//     throw error;
//   }
// })();
