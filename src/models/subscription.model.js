import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User", //one who is subscribing
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User", //one to whom subscription is subscribing
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
