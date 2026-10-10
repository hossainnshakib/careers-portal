import Link from "next/link";

export function CareersInfo() {
  const steps = [
    ["Find your role", "Read the responsibilities and requirements, then choose a role that fits your work."],
    ["Tell us about yourself", "Complete the contact fields and role questions. Upload the files that role asks for."],
    ["Keep your reference", "Submit your application and keep the reference shown on the confirmation page."],
  ];
  const questions = [
    ["Do I need an account?", "No. Open a role, complete the application and submit it. You will get a reference number."],
    ["Which files can I upload?", "PDF, DOC or DOCX for your CV, up to 5 MB. Some roles also ask for a portfolio sample; each upload shows its accepted formats and size limit. Up to 8 files per application."],
    ["Can I write in Bengali?", "Yes. You can write your answers in Bengali or English."],
    ["Can I apply to more than one role?", "Yes. Submit a separate application for each role."],
    ["How is my data used?", "Only the internal hiring team can see your application. Read the privacy notice for details."],
  ];
  return <>
    <section id="how" aria-labelledby="how-title" className="ui-container scroll-mt-6 pb-6 pt-14">
      <h2 id="how-title" className="mb-6 text-[32px] font-extrabold tracking-[-.03em]">How applying works</h2>
      <ol className="grid gap-[18px] min-[900px]:grid-cols-3">{steps.map(([title, text], index) => <li key={title} className="ui-glass space-y-2.5 rounded-[24px] p-[26px]">
        <span className="text-[13px] font-extrabold text-ui-blue-text">0{index + 1}</span><h3 className="text-[19px] font-extrabold tracking-[-.01em]">{title}</h3><p className="text-[14.5px] leading-[1.6] text-ui-muted">{text}</p>
      </li>)}</ol>
    </section>
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-[760px] scroll-mt-6 px-6 pb-2 pt-14">
      <h2 id="faq-title" className="mb-3 text-[32px] font-extrabold tracking-[-.03em]">Frequently asked questions</h2>
      {questions.map(([title, answer]) => <details key={title} className="group border-b border-ui-border px-1 py-[18px]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-bold [&::-webkit-details-marker]:hidden">{title}<span aria-hidden="true" className="text-[22px] font-normal leading-none text-ui-muted group-open:hidden">+</span><span aria-hidden="true" className="hidden text-[22px] font-normal leading-none text-ui-muted group-open:block">−</span></summary>
        <p className="max-w-[640px] pt-2.5 text-[14.5px] leading-[1.65] text-ui-muted">{answer}{title === "How is my data used?" && <> <Link href="/privacy" className="underline underline-offset-4">Read the privacy notice</Link></>}</p>
      </details>)}
    </section>
  </>;
}
