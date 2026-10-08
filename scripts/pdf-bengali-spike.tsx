// Credentials-free visual spike; never loads environment/database/applicant data.
import React from "react";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Document, Font, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";

Font.register({ family: "Hind", fonts: [
  { src: fileURLToPath(new URL("../assets/fonts/HindSiliguri-Regular.ttf", import.meta.url)), fontWeight: 400 },
  { src: fileURLToPath(new URL("../assets/fonts/HindSiliguri-Bold.ttf", import.meta.url)), fontWeight: 700 },
] });
const samples = [
  "ক্ষ ঞ্জ দ্ব স্ত্র ন্ধ শ্রী",
  "শ্রীময়ী দত্ত — কর্মক্ষেত্রে গবেষণা ও সৃজনশীল প্রকল্পে আমার অভিজ্ঞতা রয়েছে।",
  "শিক্ষার্থী, দৃষ্টিভঙ্গি, বন্ধুত্ব, জ্ঞান, স্বাধীনতা, স্ত্রী, শ্রদ্ধা",
  "বাংলা ও English mixed text: শ্রী ক্ষিতিশ, Web Developer, Dhaka 2026.",
];
const buffer = await renderToBuffer(<Document><Page size="A4" style={{ padding: 36, fontFamily: "Hind", fontSize: 18 }}>
  <Text style={{ fontWeight: 700, marginBottom: 18 }}>Bengali shaping — static Hind Siliguri</Text>
  {samples.map((text) => <View key={text} style={{ marginBottom: 18 }}><Text>{text}</Text><Text style={{ fontWeight: 700 }}>{text}</Text></View>)}
  <Text style={{ fontSize: 11 }}>Compare conjunct formation, vowel positioning and mixed text with the same font rendered in Chromium. Successful font embedding alone does not prove correct shaping.</Text>
</Page></Document>);
const target = "C:/Users/Hossa/AppData/Local/Temp/opencode/bengali-spike.pdf";
await writeFile(target, buffer);
console.info("Bengali visual spike generated in the approved temporary directory.");
