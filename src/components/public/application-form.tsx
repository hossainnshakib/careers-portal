"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { submitApplication } from "@/app/(public)/jobs/[slug]/apply/actions";
import { QuestionFields } from "@/components/form-renderer/question-fields";
import { UploadWidget, type PrepareUpload } from "./upload-widget";
import { TurnstileWidget } from "./turnstile-widget";
import { PublicIcon } from "./public-icon";
import { contactSchema, validateApplicationAnswers } from "@/lib/validation/application";
import { humanize } from "@/lib/careers/filters";
import { mimeByExtension } from "@/lib/validation/uploads";
import { questionSectionEnum } from "@/db/schema";
import type { QuestionDefinition } from "@/lib/questions/definition";
import type { Answer } from "@/lib/validation/buildSchema";

type FormValues = { contact: { fullName: string; email: string; phone: string; location: string }; answers: Record<string, Answer>; cv: string[]; consent: boolean };
export function ApplicationForm({ jobSlug, questions, cvRequired }: { jobSlug: string; questions: QuestionDefinition[]; cvRequired: boolean }) {
  const { register, control, handleSubmit, getValues, setError, clearErrors, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({ defaultValues: { contact: { fullName: "", email: "", phone: "", location: "" }, answers: {}, cv: [], consent: false } });
  const [token, setToken] = useState("");
  const tokenRef = useRef(""); tokenRef.current = token;
  const sessionRef = useRef("");
  const sessionPromise = useRef<Promise<string> | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);
  const [uploadBusy, setUploadBusy] = useState(0);
  const [uploadGeneration, setUploadGeneration] = useState(0);
  const [other, setOther] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const honeypot = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const messageElement = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (message) messageElement.current?.focus(); }, [message]);
  const [securityActive, setSecurityActive] = useState(false);
  useEffect(() => {
    if (!form.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setSecurityActive(true); observer.disconnect(); }
    }, { rootMargin: "300px" });
    observer.observe(form.current);
    return () => observer.disconnect();
  }, []);
  const ensureSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    if (sessionPromise.current) return sessionPromise.current;
    if (!tokenRef.current) throw new Error("Complete the security check before uploading.");
    sessionPromise.current = (async () => {
      const response = await fetch("/api/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobSlug, turnstileToken: tokenRef.current }) });
      const result = await response.json();
      setToken(""); setWidgetKey((key) => key + 1);
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to start application.");
      sessionRef.current = result.data.sessionToken;
      return sessionRef.current;
    })();
    try { return await sessionPromise.current; } finally { sessionPromise.current = null; }
  }, [jobSlug]);
  useEffect(() => {
    if (token && !sessionRef.current) void ensureSession().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to start application."));
  }, [token, ensureSession]);
  const prepare: PrepareUpload = useCallback(async (file, slot, uploadId) => {
    const sessionToken = await ensureSession();
    const response = await fetch("/api/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobSlug, sessionToken, slot, fileName: file.name, mime: file.type || mimeByExtension[file.name.split(".").at(-1)?.toLowerCase() ?? ""], size: file.size, ...(uploadId ? { uploadId } : {}) }) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Unable to upload file.");
    return result.data;
  }, [ensureSession, jobSlug]);
  const busy = useCallback((delta: number) => setUploadBusy((count) => count + delta), []);
  function fileField(label: string, slot: string, onChange: (ids: string[]) => void, accept: string[], maxMb: number, multiple = false) {
    return <UploadWidget key={`${slot}:${uploadGeneration}`} label={label} slot={slot} prepare={prepare} onChange={onChange} onBusy={busy} accept={accept} maxMb={maxMb} multiple={multiple} />;
  }
  return <form ref={form} method="post" noValidate className="ui-application-form space-y-[34px]" onInputCapture={() => setSecurityActive(true)} onFocusCapture={() => setSecurityActive(true)} onSubmit={handleSubmit(async () => {
    setMessage("");
    // Keep inline errors current while preserving written answers across retries.
    clearErrors();
    try {
      if (uploadBusy) throw new Error("Wait for every upload to finish.");
      const values = getValues();
      const contact = contactSchema.safeParse(values.contact);
      if (!contact.success) {
        for (const issue of contact.error.issues) setError(`contact.${String(issue.path[0])}` as "contact.fullName", { message: issue.message });
        throw new Error("Check your contact details.");
      }
      const answers: Record<string, Answer> = {};
      for (const q of questions) {
        const value = values.answers[q.id]; const options = new Set(q.options?.map((o) => o.value));
        if (q.type.endsWith("choice")) {
          const chosen = typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
          if (chosen.some((v) => !options.has(v)) && !(other[q.id] ?? "").trim()) throw new Error(`${q.label}: Provide a nonempty Other answer.`);
          answers[q.id] = typeof value === "string" ? options.has(value) ? value : other[q.id] : Array.isArray(value) ? value.map((v) => options.has(v) ? v : other[q.id] ?? "") : value;
        } else answers[q.id] = value;
      }
      const validated = validateApplicationAnswers(questions, answers, values.cv, cvRequired);
      if (!values.consent) throw new Error("Consent to the privacy notice is required.");
      const sessionToken = await ensureSession();
      if (!tokenRef.current) throw new Error("Complete the security check before submitting.");
      const result = await submitApplication({ jobSlug, sessionToken, turnstileToken: tokenRef.current, honeypot: honeypot.current?.value ?? "", contact: contact.data, consent: values.consent, answers: validated.answers, cv: values.cv });
      setToken(""); setWidgetKey((key) => key + 1);
      if (!result.ok) setMessage(result.error);
    } catch (error) {
      if (error && typeof error === "object" && "issues" in error && Array.isArray(error.issues)) {
        const issues = error.issues as { path: string[]; message: string }[];
        for (const issue of issues) {
          if (questions.some(question => question.id === issue.path[0])) setError(`answers.${issue.path[0]}`, { message: issue.message });
          else if (issue.path[0] === "cv") setError("cv", { message: issue.message });
        }
        setMessage(issues.map((issue) => `${questions.find((q) => q.id === issue.path[0])?.label ?? "Application"}: ${issue.message}`).join("; "));
      } else setMessage(error instanceof Error ? error.message : "Unable to submit. Try again.");
    }
  })}>
    <fieldset disabled={isSubmitting}>
      <legend className="ui-label mb-[18px] text-ui-blue-text">Personal & contact</legend>
      <div className="ui-form-grid">
        {([ ["fullName", "Full name", "text"], ["email", "Email", "email"], ["phone", "Phone", "tel"], ["location", "Location (city/country)", "text"] ] as const).map(([name, label, type]) => <label key={name} className="flex min-w-0 flex-col gap-[7px] text-[13.5px] font-bold"><span>{label}<span className="text-ui-required"> *</span></span>
          <input aria-label={label} required aria-invalid={!!errors.contact?.[name]} aria-describedby={errors.contact?.[name] ? `contact-error-${name}` : undefined} type={type} autoComplete={name === "fullName" ? "name" : name === "phone" ? "tel" : name === "location" ? "address-level2" : "email"} {...register(`contact.${name}`)} className="ui-form-input" />
          {errors.contact?.[name] && <span id={`contact-error-${name}`} role="alert" className="text-[13px] font-medium text-red-700">{errors.contact[name]?.message}</span>}</label>)}
        <div className="ui-form-wide"><Controller name="cv" control={control} render={({ field }) => fileField(`CV${cvRequired ? " *" : " (optional)"}`, "cv", field.onChange, ["pdf", "doc", "docx"], 5)} />{errors.cv?.message && <p role="alert" className="mt-2 text-[13px] text-red-700">{errors.cv.message}</p>}</div>
      </div>
    </fieldset>
    {questionSectionEnum.enumValues.map((section) => {
      const grouped = questions.filter((q) => q.section === section);
      if (!grouped.length) return null;
      return <fieldset disabled={isSubmitting} key={section}><legend className="ui-label mb-[18px] text-ui-blue-text">{humanize(section)}</legend>
        <div className="ui-form-grid">{grouped.map((q) => <div key={q.id} className={`min-w-0 ${["long_text", "single_choice", "multiple_choice", "file_upload"].includes(q.type) ? "ui-form-wide" : ""}`}><Controller name={`answers.${q.id}`} control={control} render={({ field }) => q.type === "file_upload" ? <>
          {q.helpText && <p className="mb-2 text-[12.5px] text-ui-muted">{q.helpText}</p>}{fileField(`${q.label}${q.required ? " *" : ""}`, q.id, field.onChange, Array.isArray(q.config?.accept) ? q.config.accept as string[] : ["pdf", "png", "jpg", "webp", "zip"], typeof q.config?.maxSizeMb === "number" ? q.config.maxSizeMb : 10, true)}
          {errors.answers?.[q.id]?.message && <p role="alert" className="mt-2 text-[13px] text-red-700">{errors.answers[q.id]?.message}</p>}
        </> : <QuestionFields question={q} value={field.value} other={other[q.id] ?? ""} error={errors.answers?.[q.id]?.message} onChange={field.onChange} onOtherChange={(value) => setOther((current) => ({ ...current, [q.id]: value }))} /> } /></div>)}</div>
      </fieldset>;
    })}
    <div className="absolute -left-[10000px]" aria-hidden="true"><label>Company website<input ref={honeypot} name="companyWebsite" tabIndex={-1} autoComplete="off" /></label></div>
    <section className="space-y-[18px] border-t border-ui-border pt-[26px]">
      <label className="flex items-start gap-3 text-[14px] leading-[1.55] text-ui-body">
        <input type="checkbox" className="mt-[3px] h-[18px] w-[18px] shrink-0 accent-ui-blue" {...register("consent")} />
        <span>I have read the <Link href="/privacy" className="underline underline-offset-4">privacy notice</Link> and consent to my application being processed for this role.</span>
      </label>
      {securityActive ? <TurnstileWidget key={widgetKey} onToken={setToken} /> : <p className="text-[13px] text-ui-muted">The security check loads when you start this form.</p>}
      <button type="button" disabled={isSubmitting || uploadBusy > 0} onClick={async () => {
        await sessionPromise.current?.catch(() => undefined);
        sessionRef.current = ""; tokenRef.current = ""; setToken(""); setWidgetKey((key) => key + 1);
        setValue("cv", []);
        for (const q of questions) if (q.type === "file_upload") setValue(`answers.${q.id}`, []);
        setUploadGeneration((generation) => generation + 1);
        setMessage("Upload session restarted. Choose your files again; your written answers are preserved.");
      }} className="block text-sm underline disabled:opacity-50">Start fresh uploads</button>
      <div className="flex flex-wrap items-center gap-[18px]"><button type="submit" disabled={isSubmitting || uploadBusy > 0 || !token} className="ui-button shadow-[0_10px_30px_rgba(11,18,32,.22)] disabled:opacity-50">{isSubmitting ? "Submitting…" : "Submit application"}<PublicIcon name="arrow" /></button><p className="max-w-[360px] text-[13px] leading-[1.5] text-ui-muted">Your answers go straight to the internal hiring team. You will get a reference number after submitting.</p></div>
      <p ref={messageElement} tabIndex={-1} role="alert" aria-live="polite" className="text-[14px] text-red-700">{message}</p>
    </section>
  </form>;
}
