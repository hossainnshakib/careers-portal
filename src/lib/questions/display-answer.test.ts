import { expect, it } from "vitest";
import { displayAnswerValue } from "./display-answer";

const options = [{ value: "skill_0", label: "Beginner" }, { value: "skill_1", label: "অভিজ্ঞ" }];
it("maps single-choice values to labels and prefers supplied snapshots over edited options", () => {
  expect(displayAnswerValue({ typeSnapshot: "single_choice", value: "skill_0", questionOptions: options })).toBe("Beginner");
  expect(displayAnswerValue({ typeSnapshot: "single_choice", value: "skill_0", optionsSnapshot: options, questionOptions: [{ value: "skill_0", label: "Edited" }] })).toBe("Beginner");
});
it("maps multi-choice labels in submitted order and retains free-text Other/deleted values", () => {
  expect(displayAnswerValue({ typeSnapshot: "multiple_choice", value: ["skill_1", "skill_0", "Other text", "removed"], questionOptions: options })).toEqual(["অভিজ্ঞ", "Beginner", "Other text", "removed"]);
});
it("does not invent mappings when options are missing, malformed or intentionally empty", () => {
  expect(displayAnswerValue({ typeSnapshot: "single_choice", value: "skill_0" })).toBe("skill_0");
  expect(displayAnswerValue({ typeSnapshot: "single_choice", value: "skill_0", optionsSnapshot: [], questionOptions: options })).toBe("skill_0");
  expect(displayAnswerValue({ typeSnapshot: "single_choice", value: "skill_0", questionOptions: [{ value: 0, label: "Bad" }] })).toBe("skill_0");
});
it.each([[true, "Yes"], [false, "No"]] as const)("displays yes/no booleans correctly", (value, expected) => {
  expect(displayAnswerValue({ typeSnapshot: "yes_no", value })).toBe(expected);
});
it("leaves ordinary text/numbers and untrusted-looking labels as plain strings", () => {
  expect(displayAnswerValue({ typeSnapshot: "short_text", value: "skill_0", questionOptions: options })).toBe("skill_0");
  expect(displayAnswerValue({ typeSnapshot: "number", value: 0 })).toBe("0");
  expect(displayAnswerValue({ typeSnapshot: "single_choice", value: "x", questionOptions: [{ value: "x", label: "<script>text only</script>" }] })).toBe("<script>text only</script>");
});
