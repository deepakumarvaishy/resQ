import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true, maxlength: 1000 },
  source: { type: String, required: true, maxlength: 60 },
  location: {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },
  status: { type: String, enum: ["merged", "needs-triage"], required: true },
  incidentId: { type: String, default: null },
  similarity: { type: Number, min: 0, max: 100, default: null },
  receivedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Report ?? mongoose.model("Report", reportSchema);
