// require("dotenv").config({
//   path: "./env",
// });
import dotenv from 'dotenv'
import connectToDb from "./db/index.js";
dotenv.config({
  path:"./env"
})

connectToDb();

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
