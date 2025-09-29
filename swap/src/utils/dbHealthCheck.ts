// src/utils/dbHealthCheck.ts
import mongoose from "mongoose";

export const checkMongoHealth = () => {
  const status = mongoose.connection.readyState;

  switch (status) {
    case 0:
      return "Disconnected"; // Not connected
    case 1:
      return "Connected";    // ✅ All good
    case 2:
      return "Connecting";   // In progress
    case 3:
      return "Disconnecting";
    default:
      return "Unknown";
  }
};
