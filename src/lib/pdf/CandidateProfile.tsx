import React from "react";
import { Document, Font, Image as PdfImage, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { resolve } from "node:path";
import { pdfDate, pdfText, type PdfModel } from "./model";
import { safeApplicantUrl } from "@/lib/validation/review";
import { displayAnswerValue } from "@/lib/questions/display-answer";

let registered = false;
export function registerProfileFonts() {
  if (registered) return;
  Font.register({ family: "Profile", fonts: [
    { src: resolve("assets/fonts/HindSiliguri-Regular.ttf"), fontWeight: 400 },
    { src: resolve("assets/fonts/HindSiliguri-Bold.ttf"), fontWeight: 700 },
  ] });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
const style = StyleSheet.create({
  page: { paddingTop: 34, paddingHorizontal: 36, paddingBottom: 48, fontFamily: "Profile", fontSize: 10, color: "#202027" },
  header: { borderTopWidth: 5, paddingTop: 10, paddingBottom: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#dddddf" },
  name: { fontSize: 18, fontWeight: 700, marginTop: 4, marginBottom: 4 },
  title: { fontSize: 12, fontWeight: 700, marginBottom: 3 },
  section: { fontSize: 12, fontWeight: 700, marginTop: 10, marginBottom: 5 },
  label: { fontWeight: 700, marginBottom: 2 },
  answer: { marginBottom: 7 },
  muted: { color: "#555560", fontSize: 9 },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, height: 16 },
});
function displayAnswer(answer: PdfModel["answers"][number], model: PdfModel) {
  if (answer.type === "file_upload") {
    const ids = Array.isArray(answer.value) ? answer.value : [];
    return model.attachments.filter((file) => ids.includes(file.id)).map((file) => file.name).join("; ") || "Attachment unavailable";
  }
  const value = displayAnswerValue({ typeSnapshot: answer.type, value: answer.value,
    questionOptions: answer.questionOptions, optionsSnapshot: answer.optionsSnapshot });
  return Array.isArray(value) ? value.join(", ") : value;
}
export function CandidateProfile({ model }: { model: PdfModel }) {
  registerProfileFonts();
  return <Document title="Candidate Profile" author="Careers Portal" language="en">
    <Page size="A4" wrap style={style.page}>
      <View wrap={false} style={[style.header, { borderTopColor: model.accent }]}>
        {model.logo ? <PdfImage src={model.logo} style={{ width: 130, height: 40, objectFit: "contain", objectPosition: "left" }} /> : <Text style={style.muted}>{pdfText(model.primaryBrand)}</Text>}
        <Text style={style.name}>{pdfText(model.fullName)}</Text>
        <Text style={style.title}>{pdfText(model.title)}</Text>
        <Text>{pdfText(model.brands.join(" · "))}</Text>
        <Text>{pdfText(model.department)}</Text>
        <Text style={style.muted}>{model.reference} · {model.status.replaceAll("_", " ")} · Applied {pdfDate(model.appliedAt, model)}</Text>
      </View>
      <Text style={style.section} minPresenceAhead={45}>Personal & contact</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{[["Email", model.email], ["Phone", model.phone], ["Location", model.location]].map(([label, value]) => <View key={label} style={[style.answer, { width: "48%", marginRight: "2%" }]}><Text style={style.label}>{label}</Text><Text>{pdfText(value)}</Text></View>)}</View>
      {["professional", "experience", "skills", "portfolio", "role_specific"].map((section) => {
        const answers = model.answers.filter((answer) => answer.section === section);
        return answers.length ? <View key={section}>
          <Text style={style.section} minPresenceAhead={70}>{section.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())}</Text>
          {answers.map((answer, i) => {
            const value = displayAnswer(answer, model);
            return <View key={i} wrap={value.length > 600} style={style.answer}>
              <Text orphans={Math.ceil(answer.label.length / 60) + 2} widows={2}>
                <Text style={{ fontWeight: 700 }}>{`${pdfText(answer.label)}\n`}</Text>
                {answer.type === "url" && safeApplicantUrl(answer.value) ? <Link src={safeApplicantUrl(answer.value)!} style={{ color: "#202027" }}>{pdfText(value)}</Link> : pdfText(value)}
              </Text>
            </View>;
          })}
        </View> : null;
      })}
      <Text style={style.section} minPresenceAhead={35}>Attachments</Text>
      {model.attachments.length ? model.attachments.map((file) => <Text key={file.id}>{pdfText(file.name)} · {Math.ceil(file.size / 1024)} KB · {file.kind}</Text>) : <Text>No attachments.</Text>}
      {model.notes.length > 0 && <View><Text style={style.section} minPresenceAhead={70}>Internal notes — explicitly included</Text>{model.notes.map((note, i) => <View key={i} wrap={note.note.length > 600} style={style.answer}><Text orphans={3} widows={2}><Text style={style.muted}>{`${pdfText(note.author)} · ${pdfDate(note.createdAt, model)}\n`}</Text>{pdfText(note.note)}</Text></View>)}</View>}
      <Text fixed style={[style.footer, { height: 14, fontSize: 8, color: "#555560" }]} render={({ pageNumber, totalPages }) => `Generated ${pdfDate(model.generatedAt, model)} (${model.timezone}) · Page ${pageNumber} of ${totalPages}`} />
    </Page>
  </Document>;
}
