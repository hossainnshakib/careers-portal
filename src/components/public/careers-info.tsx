import Link from "next/link";

export function CareersInfo() {
  const steps = [
    ["Find your role", "Read the responsibilities and requirements, then choose a role that fits your work."],
    ["Tell us about yourself", "Complete the contact fields and role questions. Upload the files requested by that role."],
    ["Keep your reference", "Submit your application and keep the reference shown on the confirmation page. The hiring team reviews applications in the portal."],
  ];
  const questions = [
    ["Do I need an account?", "No. You can browse and apply without signing up or creating an account."],
    ["Which files can I upload?", "CVs accept PDF, DOC or DOCX up to 5 MB. Other upload questions show their own accepted formats and limits, up to 10 MB per file, commonly PDF, PNG, JPG, WebP or ZIP. You can upload at most eight files in one application session."],
    ["Can I write in Bengali?", "Yes. Names and answers may be written in Bengali or English."],
    ["Can I apply to more than one role?", "Yes. Complete a separate application for each role so the hiring team has the answers and files relevant to that position."],
    ["How is my data used?", "Your contact details, answers and files are used for recruitment and are available only to the internal hiring team. Share only information relevant to the role."],
  ];
  return <div className="mt-20 space-y-20">
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-8 border-t-2 border-foreground pt-10">
      <h2 id="how-title" className="text-4xl font-black tracking-tight">How applying works</h2>
      <ol className="mt-8 grid gap-8 md:grid-cols-3">{steps.map(([title, text], index) => <li key={title}>
        <p className="font-black text-poster">0{index + 1}</p><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
      </li>)}</ol>
    </section>
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl scroll-mt-8">
      <h2 id="faq-title" className="text-4xl font-black tracking-tight">Frequently asked questions</h2>
      <div className="mt-6">{questions.map(([title, answer]) => <details key={title} className="border-b border-border py-5">
        <summary className="cursor-pointer font-black">{title}</summary><p className="mt-4 leading-relaxed text-muted-foreground">{answer}</p>
      </details>)}</div><Link href="/privacy" className="mt-6 inline-block font-bold underline">Read the privacy notice</Link>
    </section>
  </div>;
}
