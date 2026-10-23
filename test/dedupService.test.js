import assert from "node:assert/strict";
import test from "node:test";
import { sampleIncidents } from "../server/data/sampleData.js";
import { findDuplicate } from "../server/services/dedupService.js";

const floodIncident = sampleIncidents.find((incident) => incident.id === "INC-0412");

test("merges a nearby Hinglish report with the matching flood incident", () => {
  const match = findDuplicate({
    text: "Paani ghar ke andar aa gaya, bachche chat par hain.",
    location: { lat: 19.0762, lng: 72.8784 }
  }, [floodIncident]);

  assert.equal(match?.incident.id, floodIncident.id);
  assert.ok(match.score >= 38);
});

test("does not merge an unrelated nearby emergency based on location alone", () => {
  const match = findDuplicate({
    text: "Gas leak in a warehouse. Evacuating the north block now.",
    location: { lat: 19.0762, lng: 72.8784 }
  }, [floodIncident]);

  assert.equal(match, null);
});

test("does not merge a text match outside the geographic threshold", () => {
  const match = findDuplicate({
    text: floodIncident.title,
    location: { lat: 28.6139, lng: 77.209 }
  }, [floodIncident]);

  assert.equal(match, null);
});
