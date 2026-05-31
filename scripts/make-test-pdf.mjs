// Generates a minimal but valid single-page PDF resume for local journey testing.
import { writeFileSync } from "node:fs";

const lines = [
  "Jane Doe",
  "jane.doe@example.com  +1 555 123 4567  github.com/janedoe",
  "Senior Backend Engineer",
  "- Built scalable REST and GraphQL APIs in TypeScript and Node",
  "- Reduced p99 latency 40% using Redis caching and Postgres tuning",
  "- Led migration to Kubernetes on AWS, cutting deploy time 65%",
  "Skills: TypeScript, React, Node, AWS, Docker, Kubernetes, Kafka, SQL",
  "Education: BS Computer Science, MIT, 2018",
];

const text = [
  "BT",
  "/F1 12 Tf",
  "72 740 Td",
  ...lines.flatMap((l, i) => [
    `(${l.replace(/[()\\]/g, "\\$&")}) Tj`,
    i < lines.length - 1 ? "0 -18 Td" : "",
  ]),
  "ET",
]
  .filter(Boolean)
  .join("\n");

const objects = [
  "<</Type/Catalog/Pages 2 0 R>>",
  "<</Type/Pages/Kids[3 0 R]/Count 1>>",
  "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>",
  `<</Length ${text.length}>>\nstream\n${text}\nendstream`,
  "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
];

let pdf = "%PDF-1.4\n";
const offsets = [];
objects.forEach((body, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});

const xrefStart = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
offsets.forEach((off) => {
  pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
});
pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;

writeFileSync("scripts/test-resume.pdf", pdf, "latin1");
console.log("wrote scripts/test-resume.pdf", pdf.length, "bytes");
