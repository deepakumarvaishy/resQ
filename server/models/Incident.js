import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  severity: { type: String, enum: ["Critical", "High", "Medium", "Low"], required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  status: { type: String, enum: ["Active", "Dispatched", "Resolved"], default: "Active" },
  summary: { type: String, required: true },
  atRisk: { type: Number, min: 0, default: 0 },
  eta: { type: String, default: "Pending" },
  confidence: { type: Number, min: 0, max: 100, default: 0 },
  reportCount: { type: Number, min: 1, default: 1 },
  createdAt: { type: Date, default: Date.now },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  mapPosition: {
    x: { type: Number, min: 0, max: 100, default: 50 },
    y: { type: Number, min: 0, max: 100, default: 50 }
  },
  factors: [{
    name: String,
    points: Number,
    description: String
  }],
  duplicateReports: [{
    id: String,
    match: Number,
    text: String,
    source: String,
    age: String,
    location: { lat: Number, lng: Number }
  }],
  response: {
    units: [{ name: String, code: String }],
    steps: [String],
    alternate: String,
    mapsUrl: String,
    dispatchedAt: Date,
    overridden: { type: Boolean, default: false }
  }
}, { timestamps: true, minimize: false });

export default mongoose.models.Incident ?? mongoose.model("Incident", incidentSchema);
