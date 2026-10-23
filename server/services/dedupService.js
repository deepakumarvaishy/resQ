import { createHash } from "node:crypto";

const EMBEDDING_SIZE = 1024;
const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;
const STOPWORDS = new Set(["a", "an", "and", "are", "at", "by", "for", "from", "in", "is", "near", "of", "on", "the", "to", "up"]);
const ALIASES = new Map([
  ["andar", "inside"],
  ["bachche", "children"],
  ["bachon", "children"],
  ["ghar", "home"],
  ["gharon", "home"],
  ["paani", "water"],
  ["chat", "roof"]
]);

function embed(text) {
  const vector = new Float64Array(EMBEDDING_SIZE);
  const tokens = (text.toLocaleLowerCase().match(TOKEN_PATTERN) ?? [])
    .map((token) => ALIASES.get(token) ?? (token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token))
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
  const features = tokens.map((token) => [`word:${token}`, 1]);
  for (let index = 1; index < tokens.length; index += 1) {
    features.push([`pair:${tokens[index - 1]}:${tokens[index]}`, 0.5]);
  }
  for (const [feature, weight] of features) {
    const digest = createHash("sha256").update(feature).digest();
    const index = digest.readUInt32BE(0) % EMBEDDING_SIZE;
    vector[index] += weight;
  }
  const magnitude = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));
  return magnitude ? vector.map((value) => value / magnitude) : vector;
}

function cosineSimilarity(leftText, rightText) {
  const left = embed(leftText);
  const right = embed(rightText);
  return left.reduce((total, value, index) => total + value * right[index], 0);
}

function distanceKm(left, right) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latDelta = radians(right.lat - left.lat);
  const lngDelta = radians(right.lng - left.lng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(left.lat)) * Math.cos(radians(right.lat)) * Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function scoreDuplicate(report, incident) {
  const textSimilarity = Math.max(0, cosineSimilarity(report.text, incident.title));
  const distance = distanceKm(report.location, incident.location);
  const proximity = 1 - Math.min(distance / 5, 1);
  const score = Math.round((textSimilarity * 0.72 + proximity * 0.28) * 100);
  return { score, textSimilarity, distanceKm: Number(distance.toFixed(2)) };
}

export function findDuplicate(report, incidents) {
  return incidents
    .map((incident) => ({ incident, ...scoreDuplicate(report, incident) }))
    .filter((match) => match.distanceKm <= 5 && match.textSimilarity >= 0.1 && match.score >= 38)
    .sort((left, right) => right.score - left.score)[0] ?? null;
}
