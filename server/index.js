import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Incident from "./models/Incident.js";
import Report from "./models/Report.js";
import { resourceTypes, sampleIncidents } from "./data/sampleData.js";
import { findDuplicate } from "./services/dedupService.js";
import { analyzeIncident } from "./services/llmService.js";
import { createRoute } from "./services/routingService.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const distDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const inMemoryIncidents = structuredClone(sampleIncidents);
const inMemoryReports = [];
let databaseMode = "memory";

app.use(cors());
app.use(express.json({ limit: "64kb" }));
if (existsSync(distDirectory)) app.use(express.static(distDirectory));

function serializeIncident(incident) {
  if (typeof incident.toObject === "function") {
    const value = incident.toObject();
    return { ...value, id: value.id, createdAt: value.createdAt };
  }
  return structuredClone(incident);
}

async function allIncidents() {
  return databaseMode === "mongodb" ? Incident.find().lean() : structuredClone(inMemoryIncidents);
}

async function findIncident(id) {
  if (databaseMode === "mongodb") return Incident.findOne({ id });
  return inMemoryIncidents.find((incident) => incident.id === id) ?? null;
}

async function persistIncident(incident) {
  if (databaseMode === "mongodb") return incident.save();
  return incident;
}

async function persistReport(report) {
  if (databaseMode === "mongodb") return Report.create(report);
  inMemoryReports.push(structuredClone(report));
  return report;
}

async function listReports(status) {
  if (databaseMode === "mongodb") return Report.find(status ? { status } : {}).sort({ receivedAt: -1 }).lean();
  return inMemoryReports
    .filter((report) => !status || report.status === status)
    .sort((left, right) => new Date(right.receivedAt) - new Date(left.receivedAt));
}

async function countUntriagedReports() {
  if (databaseMode === "mongodb") return Report.countDocuments({ status: "needs-triage" });
  return inMemoryReports.filter((report) => report.status === "needs-triage").length;
}

async function getDashboard() {
  const incidents = (await allIncidents()).map(serializeIncident);
  return {
    incidents,
    reportsReceived: incidents.reduce((total, incident) => total + incident.reportCount, 0),
    reportsMerged: incidents.length,
    resources: {
      dispatched: incidents
        .filter((incident) => incident.status === "Dispatched")
        .reduce((total, incident) => total + incident.response.units.length, 0)
    },
    untriagedReports: await countUntriagedReports(),
    resourceTypes,
    duplicates: incidents.flatMap((incident) => incident.duplicateReports.map((report) => ({
      ...report,
      incidentId: incident.id
    }))),
    mode: databaseMode,
    services: {
      llm: process.env.LLM_API_KEY ? "configured" : "local-demo",
      maps: process.env.MAPS_API_KEY ? "configured" : "local-demo",
      dedup: "text-embeddings+geo"
    }
  };
}

function dashboardError(res, error) {
  console.error(error);
  return res.status(500).json({ error: "The ResQ API could not complete this request." });
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: databaseMode });
});

app.get("/api/dashboard", async (_req, res) => {
  try {
    res.json(await getDashboard());
  } catch (error) {
    dashboardError(res, error);
  }
});

app.get("/api/reports", async (req, res) => {
  try {
    const { status } = req.query;
    if (status !== undefined && !["merged", "needs-triage"].includes(status)) {
      return res.status(400).json({ error: "Status must be merged or needs-triage." });
    }
    const reports = await listReports(status);
    res.json({ reports });
  } catch (error) {
    dashboardError(res, error);
  }
});

app.get("/api/incidents/:id/analyze", async (req, res) => {
  try {
    const incident = await findIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: "Incident not found." });
    res.json(await analyzeIncident(serializeIncident(incident)));
  } catch (error) {
    dashboardError(res, error);
  }
});

app.get("/api/incidents/:id/route", async (req, res) => {
  try {
    const incident = await findIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: "Incident not found." });
    res.json(await createRoute(serializeIncident(incident)));
  } catch (error) {
    dashboardError(res, error);
  }
});

app.post("/api/incidents/:id/dispatch", async (req, res) => {
  try {
    const incident = await findIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: "Incident not found." });
    if (incident.status === "Resolved") return res.status(409).json({ error: "A resolved incident cannot be dispatched." });
    incident.status = "Dispatched";
    incident.response.dispatchedAt = new Date();
    await persistIncident(incident);
    res.json({ dashboard: await getDashboard() });
  } catch (error) {
    dashboardError(res, error);
  }
});

app.post("/api/incidents/:id/override", async (req, res) => {
  try {
    const { steps } = req.body ?? {};
    if (!Array.isArray(steps) || steps.length < 1 || steps.length > 8
      || steps.some((step) => typeof step !== "string" || !step.trim() || step.length > 240)) {
      return res.status(400).json({ error: "Provide between 1 and 8 route instructions, each up to 240 characters." });
    }
    const incident = await findIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: "Incident not found." });
    incident.response.steps = steps.map((step) => step.trim());
    incident.response.overridden = true;
    await persistIncident(incident);
    res.json({ dashboard: await getDashboard() });
  } catch (error) {
    dashboardError(res, error);
  }
});

app.post("/api/reports", async (req, res) => {
  try {
    const { text, source = "Web report", location } = req.body ?? {};
    if (typeof text !== "string" || text.trim().length < 8 || text.length > 1000) {
      return res.status(400).json({ error: "Report text must be between 8 and 1000 characters." });
    }
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)
      || Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) {
      return res.status(400).json({ error: "Provide a valid latitude and longitude." });
    }
    if (typeof source !== "string" || source.length > 60) {
      return res.status(400).json({ error: "Report source must be 60 characters or fewer." });
    }

    const report = { text: text.trim(), location, source: source.trim() || "Web report" };
    const existingIncidents = await allIncidents();
    const duplicate = findDuplicate(report, existingIncidents);
    if (duplicate) {
      const incident = await findIncident(duplicate.incident.id);
      const reportId = `REP-${randomUUID().slice(0, 8).toUpperCase()}`;
      incident.reportCount += 1;
      incident.duplicateReports.push({
        id: reportId,
        match: duplicate.score,
        text: report.text,
        source: report.source,
        age: "just now",
        location: report.location
      });
      await persistIncident(incident);
      await persistReport({ ...report, id: reportId, status: "merged", incidentId: incident.id, similarity: duplicate.score });
      return res.status(200).json({
        disposition: "merged",
        reportId,
        incidentId: incident.id,
        similarity: duplicate.score,
        distanceKm: duplicate.distanceKm,
        dashboard: await getDashboard()
      });
    }

    const reportId = `REP-${randomUUID().slice(0, 8).toUpperCase()}`;
    const savedReport = await persistReport({
      ...report,
      id: reportId,
      status: "needs-triage",
      incidentId: null,
      similarity: null,
      receivedAt: new Date()
    });
    return res.status(202).json({
      disposition: "needs-triage",
      message: "No matching incident was found. The report is not dispatched automatically.",
      report: savedReport
    });
  } catch (error) {
    dashboardError(res, error);
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API endpoint not found." });
  if (!existsSync(distDirectory)) return res.status(404).send("Not found.");
  return res.sendFile(resolve(distDirectory, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error, _req, res, _next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body must contain valid JSON." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body exceeds the 64 KB limit." });
  }
  console.error(error);
  return res.status(500).json({ error: "An unexpected API error occurred." });
});

async function start() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    databaseMode = "mongodb";
    if (await Incident.countDocuments() === 0) {
      await Incident.insertMany(sampleIncidents);
      console.info("Seeded MongoDB with ResQ sample incidents.");
    }
    if (await Report.countDocuments() === 0) {
      console.info("MongoDB report intake is ready.");
    }
    console.info("Connected to MongoDB.");
  } else {
    console.info("MONGODB_URI is not set; using editable in-memory demo data.");
  }
  app.listen(port, () => console.info(`ResQ API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error("ResQ API startup failed:", error);
  process.exitCode = 1;
});
