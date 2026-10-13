import type { Job } from "@/db/schema";

/**
 * Realistic demo content for the 19 seeded jobs (`pnpm seed:demo`, dev only).
 *
 * Rules for this file:
 * - English, professional and brand-neutral (brand links change; text must not).
 * - No lorem ipsum, no raw HTML, no Markdown links — only plain paragraphs and
 *   simple "- " lists. Markdown sanitiser edge cases (bold, list, link,
 *   attempted raw HTML) are covered by `src/lib/markdown/render.test.ts`.
 * - `summary` is the card line (<= 160 chars); validation allows 200.
 * - Each job: 2-3 description paragraphs, 5 responsibilities, 5 requirements,
 *   2 nice-to-have items, 6-8 skills, 4 benefits; vacancies, experience text,
 *   a deadline and a salary range only on some jobs.
 */

export type DemoJobContent = {
  summary: string;
  descriptionMd: string;
  responsibilitiesMd: string;
  requirementsMd: string;
  niceToHaveMd: string;
  skills: string[];
  benefits: string[];
  vacancies?: number;
  experienceText?: string;
  /** Present => salaryMode "range" with this single-line text (max 80 chars). */
  salaryText?: string;
  /** Applied as a deadline this many days after the seed run; open jobs only. */
  deadlineInDays?: number;
};

const technicalBenefits = [
  "Flexible working hours after the first month",
  "Annual leave plus festival bonus",
  "Budget for courses, books and conferences",
  "Latest laptop and peripherals provided",
];
const creativeBenefits = [
  "Flexible working hours after the first month",
  "Annual leave plus festival bonus",
  "Paid time and materials for personal projects",
  "Latest hardware and software provided",
];
const productionBenefits = [
  "Project-based pay settled per completed shoot",
  "Annual leave plus festival bonus for retainers",
  "Gear, studio and edit-suite access",
  "Travel and on-location meals covered",
];
const contentBenefits = [
  "Flexible working hours after the first month",
  "Annual leave plus festival bonus",
  "Research budget and reference-library access",
  "Work-from-home days every week",
];
const marketingBenefits = [
  "Performance bonus tied to clear campaign targets",
  "Annual leave plus festival bonus",
  "Training budget for platform certifications",
  "Work-from-home days every week",
];
const operationsBenefits = [
  "Stable full-time hours with a clear process",
  "Annual leave plus festival bonus",
  "Transport allowance for office days",
  "Training budget for tools and certifications",
];

const list = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

export const demoJobContent: Record<string, DemoJobContent> = {
  "web-developer": {
    summary: "Build and maintain fast, accessible websites and web apps for our brands and their clients.",
    descriptionMd:
      "You will work inside the web team, shipping marketing sites, campaign pages and small web applications for our own brands and external clients. Most work is planned in two-week cycles with a designer and a reviewer, so you always know what is due and who to ask.\n\nThe stack is modern and deliberately small: Next.js, TypeScript and Tailwind on the front end, a Postgres database and a headless CMS for content. We care about page speed, accessibility and clean handover more than about using every new library.\n\nThis role suits someone who enjoys finishing things: taking a design, building it properly, testing it on real devices and keeping it healthy after launch.",
    responsibilitiesMd: list([
      "Build new pages and features from Figma designs with review and tests",
      "Keep existing sites fast, secure and bug-free after launch",
      "Write accessible, responsive markup that works on low-end phones",
      "Work with the designer and content team on scope and estimates",
      "Document setups so another developer can take over without a call",
    ]),
    requirementsMd: list([
      "Solid HTML, CSS and JavaScript fundamentals",
      "Practical experience with React and a component workflow",
      "Comfort reading and writing TypeScript",
      "Experience with Git-based reviews and deploys",
      "Clear written English for tickets and handover notes",
    ]),
    niceToHaveMd: list([
      "Next.js App Router experience in production",
      "Familiarity with Postgres and query planning basics",
    ]),
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "REST APIs", "Git", "Web performance"],
    benefits: technicalBenefits,
    vacancies: 2,
    experienceText: "1-3 years of relevant work",
    salaryText: "৳ 45,000 - 65,000 / month",
    deadlineInDays: 21,
  },
  "wordpress-developer-analyst": {
    summary: "Own our WordPress estate: custom themes, plugin work, performance and honest reporting.",
    descriptionMd:
      "A large share of client work still runs on WordPress, and it needs a developer who treats it as an engineering platform rather than a pile of plugins. You will build and maintain custom themes, write small plugins where off-the-shelf tools fall short, and keep the estate fast and safe.\n\nYou will also analyse what the sites actually do: traffic patterns, funnel drop-offs and plugin bloat, then report findings in plain language with a short list of recommended fixes. The reporting side matters as much as the coding side.\n\nWorking alone on each site is normal here, so you should be comfortable choosing a boring, reliable solution and explaining the trade-off in writing.",
    responsibilitiesMd: list([
      "Build and maintain custom themes and small plugins",
      "Harden sites: updates, backups, access hygiene and uptime checks",
      "Investigate performance problems and fix the real cause",
      "Report traffic and funnel findings in plain language",
      "Migrate content and setups without breaking live URLs",
    ]),
    requirementsMd: list([
      "Professional PHP and WordPress theme development experience",
      "SQL comfort for reporting and data clean-up tasks",
      "Understanding of web server, cache and CDN basics",
      "Eye for detail in reports and a habit of double-checking numbers",
      "Ability to explain technical risk to non-technical clients",
    ]),
    niceToHaveMd: list([
      "WooCommerce or membership-site experience",
      "Experience with headless or decoupled WordPress setups",
    ]),
    skills: ["WordPress", "PHP", "MySQL", "WooCommerce", "Server administration", "Performance tuning", "Reporting"],
    benefits: technicalBenefits,
    vacancies: 1,
    experienceText: "2+ years with WordPress",
  },
  "ui-ux-designer": {
    summary: "Design clear product and campaign interfaces, from first wireframe to developer-ready handover.",
    descriptionMd:
      "You will design interfaces for web products and campaigns across our brands: flows, wireframes, prototypes and final screens, plus the small design systems that keep them consistent. The role sits between the brand team and the developers, so talking through decisions is part of the job.\n\nWe work in Figma with shared libraries and documented components. Designs are expected to include states, empty views and mobile behaviour, not only the happy path at one screen size.\n\nWe are looking for someone who can defend a simple choice, take review well, and would rather ship a clear screen than a fashionable one.",
    responsibilitiesMd: list([
      "Take briefs to wireframes, prototypes and final screens in Figma",
      "Design mobile-first flows and define their empty and error states",
      "Maintain shared components and document how to use them",
      "Review developer builds and fix visual drift before release",
      "Run short user checks and turn findings into concrete changes",
    ]),
    requirementsMd: list([
      "A portfolio showing shipped web or product work",
      "Strong Figma skills including components and auto-layout",
      "Understanding of layout, typography and accessibility basics",
      "Comfort giving and receiving direct design review",
      "Clear communication in English and Bangla",
    ]),
    niceToHaveMd: list([
      "Motion or prototyping skills for interactive previews",
      "Basic HTML/CSS knowledge for closer developer handover",
    ]),
    skills: ["Figma", "Wireframing", "Prototyping", "User research", "Design systems", "Accessibility", "Usability testing"],
    benefits: creativeBenefits,
    experienceText: "2-4 years of product or web design",
    salaryText: "৳ 40,000 - 55,000 / month",
    deadlineInDays: 30,
  },
  "web-backend-security-analyst": {
    summary: "Test and harden our websites, APIs and infrastructure against real-world attacks.",
    descriptionMd:
      "You will be responsible for finding weaknesses before someone else does. The work covers web applications, APIs, servers and the deployment pipeline: reconnaissance, testing, reporting and re-testing after fixes.\n\nFindings are written as short reports with reproduction steps, severity and a fix suggestion the developers can act on the same week. You will also review access, secrets and third-party dependencies on a regular schedule.\n\nThe tone of the team is calm and methodical. A well-written report that prevents an incident is worth more here than a dramatic exploit demo.",
    responsibilitiesMd: list([
      "Run application and API security tests on a regular schedule",
      "Write reports with severity, reproduction steps and fix suggestions",
      "Review access lists, secrets handling and dependency health",
      "Support developers with fixes and verify them after release",
      "Keep a short security checklist per brand and update it after incidents",
    ]),
    requirementsMd: list([
      "Understanding of web attacks: injection, XSS, CSRF, auth flaws",
      "Practical Linux and networking knowledge",
      "Experience with proxy-based testing tools such as Burp Suite",
      "Scripting ability for repeatable checks (Python or similar)",
      "Clear, factual report writing",
    ]),
    niceToHaveMd: list([
      "Cloud infrastructure security experience",
      "A public write-up or responsibly disclosed finding",
    ]),
    skills: ["Web security", "Penetration testing", "Burp Suite", "Linux", "Networking", "Python", "Security reporting"],
    benefits: technicalBenefits,
    experienceText: "3+ years in application security",
  },
  "brand-identity-logo-designer": {
    summary: "Design brand identities and logos that stay recognisable from a billboard to a favicon.",
    descriptionMd:
      "You will build identities for our own brands and external clients: logo marks, type and colour systems, layout rules and the small assets that make a brand usable day to day.\n\nProjects usually run four to six weeks: discovery, two directions, one refinement round and a handover package with usage guidelines. Presenting your reasoning to a client is part of the deliverable.\n\nWe value marks that survive real conditions: tiny sizes, one colour, bad printing and quick recognition on a phone screen.",
    responsibilitiesMd: list([
      "Develop logo concepts with sketching before digital refinement",
      "Build identity systems: type, colour, layout and usage rules",
      "Prepare production files for print and screen handover",
      "Present work with clear reasoning and handle review calmly",
      "Keep an organised archive of every identity asset",
    ]),
    requirementsMd: list([
      "A portfolio with at least three finished identities",
      "Excellent vector craft and typographic judgement",
      "Understanding of print production and file preparation",
      "Ability to explain design decisions to non-designers",
      "Fluency in English and Bangla for client communication",
    ]),
    niceToHaveMd: list([
      "Packaging or signage design experience",
      "Motion logo or intro animation skills",
    ]),
    skills: ["Illustrator", "Logo design", "Typography", "Brand guidelines", "Colour theory", "Print production", "Photoshop"],
    benefits: creativeBenefits,
    experienceText: "3+ years in brand or identity design",
    salaryText: "৳ 35,000 - 50,000 / month",
    deadlineInDays: 14,
  },
  "ad-social-creative-designer": {
    summary: "Produce scroll-stopping ad and social creatives in volume, without losing brand consistency.",
    descriptionMd:
      "This is a high-tempo design role. You will produce static and short motion creatives for advertising and social campaigns: feed posts, stories, banners, landing-page headers and the many sizes an campaign needs.\n\nCampaigns rotate quickly, so the job is about systems as much as taste: reusable templates, sensible variants and clean naming so a winning creative can be scaled the same day.\n\nYou will work directly with the marketing team, who provide the angle and the copy; you make it look inevitable.",
    responsibilitiesMd: list([
      "Design ad and social creatives across all required sizes",
      "Build reusable templates that keep variants consistent",
      "Adapt winning creatives quickly when campaigns scale",
      "Check final assets against platform and brand rules",
      "Keep an organised, dated archive of every campaign set",
    ]),
    requirementsMd: list([
      "Strong static design skills in Photoshop and Illustrator",
      "Understanding of what works in paid social placements",
      "Fast, reliable turnaround without quality drop",
      "Comfort working from written briefs and feedback",
      "Attention to file naming, colour modes and export settings",
    ]),
    niceToHaveMd: list([
      "After Effects skills for simple motion variants",
      "Basic copywriting instinct for headlines",
    ]),
    skills: ["Social media design", "Photoshop", "Illustrator", "Ad creatives", "Template systems", "Motion basics", "Campaign support"],
    benefits: creativeBenefits,
    vacancies: 2,
    experienceText: "1-3 years in advertising design",
  },
  "visual-communication-designer": {
    summary: "Create print and brand communication materials: reports, brochures, signage and event graphics.",
    descriptionMd:
      "You will handle the longer-form visual work: annual reports, brochures, presentation decks, signage and event graphics. Projects run for weeks rather than hours, and the finish quality has to hold up in print.\n\nLayout discipline matters most here: grid systems, tables, long Bengali and English text, and files a printer can actually use. You will also prepare presentations that non-designers can extend without breaking the layout.\n\nThe role suits a designer who enjoys structure, proofreading their own work and getting files right the first time.",
    responsibilitiesMd: list([
      "Lay out reports, brochures and multi-page documents on a grid",
      "Prepare press-ready files and check proofs with printers",
      "Design signage, banners and event graphics",
      "Build editable presentation templates for other teams",
      "Keep Bengali and English typography consistent and correct",
    ]),
    requirementsMd: list([
      "Excellent InDesign skills and strong Illustrator ability",
      "Understanding of print production, colour and paper",
      "Careful typography in both Bangla and English",
      "Portfolio showing multi-page and print projects",
      "Reliable proofreading and version discipline",
    ]),
    niceToHaveMd: list([
      "Photography retouching skills",
      "Experience with large-format or signage production",
    ]),
    skills: ["InDesign", "Print design", "Layout systems", "Typography", "Bengali typography", "Prepress", "Illustration"],
    benefits: creativeBenefits,
    experienceText: "2-4 years in visual communication",
  },
  "commercial-documentary-video-editor": {
    summary: "Edit commercial and documentary films: story first, clean cuts, colour and sound finishing.",
    descriptionMd:
      "You will edit commercials, brand films and documentary-style pieces from raw footage to final delivery. The role owns the story: structure, pacing, music choice and the discipline to cut anything that does not serve the film.\n\nFinishing is part of the job, not a hand-off: colour matching, sound cleanup, titles and correct exports for broadcast, cinema and web. Projects typically run two to five weeks with clear milestones.\n\nWe are looking for an editor who can take notes calmly and defend a cut with reasons.",
    responsibilitiesMd: list([
      "Assemble raw footage into a coherent story cut",
      "Colour match and grade footage to a consistent look",
      "Clean dialogue, add music and mix final audio",
      "Deliver correct exports and specs for each platform",
      "Organise projects, proxies and archives so anything is findable",
    ]),
    requirementsMd: list([
      "A showreel of edited commercial or documentary work",
      "Expert Premiere Pro or DaVinci Resolve editing skills",
      "Good musical judgement and rhythm in cuts",
      "Solid colour correction fundamentals",
      "Disciplined project and file organisation",
    ]),
    niceToHaveMd: list([
      "Sound design or mixing experience",
      "Basic motion graphics for titles and lower thirds",
    ]),
    skills: ["Premiere Pro", "DaVinci Resolve", "Colour grading", "Sound editing", "Storytelling", "After Effects", "Delivery specs"],
    benefits: productionBenefits,
    experienceText: "3+ years in professional editing",
    salaryText: "৳ 40,000 - 60,000 / month",
    deadlineInDays: 24,
  },
  "short-form-video-editor": {
    summary: "Edit short-form video for social: hooks in the first second, clean captions, fast turnaround.",
    descriptionMd:
      "Short-form video is where our audiences live, and it rewards editors who understand the format. You will cut vertical video for Reels, Shorts and TikTok: strong hooks, readable captions, tight pacing and variants for testing.\n\nTurnaround is measured in hours, so speed and consistency matter. You will keep a small library of reusable caption styles, transitions and sound trends, and retire them when they stop working.\n\nThis role is a strong fit for someone who watches the formats closely and edits every day.",
    responsibilitiesMd: list([
      "Cut vertical video with hooks that hold the first second",
      "Add accurate, readable captions and subtitles",
      "Produce variants for testing hooks and formats",
      "Track simple performance signals and apply them to edits",
      "Keep templates, assets and archives organised at speed",
    ]),
    requirementsMd: list([
      "Fast, confident Premiere Pro or Resolve editing",
      "A feel for short-form pacing and current formats",
      "Clean caption and subtitle craft",
      "Reliable same-day turnaround on small edits",
      "Comfortable working from creative direction in writing",
    ]),
    niceToHaveMd: list([
      "Motion graphics for text animation",
      "Bengali subtitling experience",
    ]),
    skills: ["Premiere Pro", "Short-form editing", "Captions", "Vertical video", "Sound trending", "Fast turnaround", "Social formats"],
    benefits: productionBenefits,
    vacancies: 3,
    experienceText: "1+ year editing short-form video",
    deadlineInDays: 10,
  },
  "motion-graphics-animation-artist": {
    summary: "Animate brand stories: logo animations, explainers and campaign motion in After Effects.",
    descriptionMd:
      "You will turn static brand assets into motion: logo animations, product explainers, campaign idents and social motion pieces. Work usually starts from a storyboard or a designer's frames and ends with delivered, correctly specced files.\n\nCraft matters: timing, easing and consistency between projects. You will also keep a small motion kit per brand so animations stay recognisable rather than reinvented each time.\n\nWe are looking for an animator who enjoys solving movement problems, not only applying presets.",
    responsibilitiesMd: list([
      "Animate storyboards and design frames in After Effects",
      "Build reusable motion kits for each brand",
      "Match animation to music and sound design cues",
      "Deliver correct formats, loops and transparent versions",
      "Collaborate with designers to keep motion on-brand",
    ]),
    requirementsMd: list([
      "Strong After Effects portfolio with explainers or idents",
      "Understanding of timing, easing and spacing",
      "Comfort with illustrator-to-After-Effects workflows",
      "Basic audio editing for timing and levels",
      "Organised project files another artist can reopen",
    ]),
    niceToHaveMd: list([
      "3D skills in Cinema 4D or Blender",
      "Character animation experience",
    ]),
    skills: ["After Effects", "Motion graphics", "Illustrator", "Storyboarding", "Expressions", "Sound design", "Render pipelines"],
    benefits: creativeBenefits,
    experienceText: "2-4 years in motion design",
    salaryText: "৳ 45,000 - 65,000 / month",
  },
  "cinematographer": {
    summary: "Shoot commercial and documentary footage: lighting, camera movement and consistent visual quality.",
    descriptionMd:
      "You will lead the camera department on commercial shoots, brand films and documentary-style productions: framing, lighting, movement and the technical settings that keep footage consistent between days and cameras.\n\nShoots are planned but reality always intervenes, so adaptability matters. You will work closely with the director and the producer on what is achievable in the available time and light, and keep kit lists and reports honest.\n\nThis role expects professional set behaviour: punctual, calm, and clear with the crew.",
    responsibilitiesMd: list([
      "Operate camera and plan shots from the treatment",
      "Light interviews, products and locations appropriately",
      "Keep settings, LUTs and footage consistent across a shoot",
      "Maintain and prepare kits before and after each shoot",
      "Mentor a camera assistant on safe, correct practice",
    ]),
    requirementsMd: list([
      "A reel showing commercial or documentary camera work",
      "Confident operation of cinema or mirrorless camera systems",
      "Strong lighting skills with small and large fixtures",
      "Gimbal and handheld movement control",
      "Valid licence and willingness to travel within Bangladesh",
    ]),
    niceToHaveMd: list([
      "Drone piloting licence and experience",
      "Second-camera or DOP experience on larger sets",
    ]),
    skills: ["Camera operation", "Lighting", "Gimbal work", "Shot planning", "Colour science", "Location sound", "Kit management"],
    benefits: productionBenefits,
    experienceText: "3+ years shooting professional video",
    deadlineInDays: 18,
  },
  "product-commercial-photographer": {
    summary: "Photograph products and commercial scenes: controlled lighting, accurate colour, clean retouching.",
    descriptionMd:
      "You will photograph products, campaign stills and catalogue work in our studio and on location: lighting setups, composition and the retouching that makes an image ready for print and web.\n\nAccuracy matters as much as style: colours that match the real product, consistent framing across a catalogue, and files named and delivered in the formats each channel needs.\n\nWe are looking for a photographer with a repeatable process who can shoot a hundred products in a day without a drop in quality.",
    responsibilitiesMd: list([
      "Plan and execute studio and location product shoots",
      "Build repeatable lighting setups for catalogues",
      "Retouch images to a consistent, natural standard",
      "Deliver correctly sized and named files per channel",
      "Maintain studio equipment and shooting schedules",
    ]),
    requirementsMd: list([
      "A strong product or commercial portfolio",
      "Expert studio lighting and camera control",
      "Professional Photoshop retouching skills",
      "Colour management discipline for accurate products",
      "Organised workflow for large image sets",
    ]),
    niceToHaveMd: list([
      "Liquid, reflection or composite product experience",
      "Short video capture alongside stills",
    ]),
    skills: ["Studio lighting", "Product photography", "Photoshop", "Colour accuracy", "Set styling", "E-commerce formats", "Retouching"],
    benefits: productionBenefits,
    vacancies: 1,
    experienceText: "2+ years in commercial photography",
  },
  "creative-director-production-lead": {
    summary: "Lead creative and production across brands: direction, teams, budgets and deadlines that hold.",
    descriptionMd:
      "You will lead creative output and production across our brands: setting the standard, directing projects, and making sure teams can do their best work on realistic schedules and budgets.\n\nThe role is half craft and half management. You will review design, film and content work before it ships, run kick-offs and retrospectives, and own the production plan from estimate to delivery.\n\nWe need someone senior enough to say no to bad scope, and hands-on enough to still direct the flagship projects personally.",
    responsibilitiesMd: list([
      "Direct creative across brands and hold the quality bar",
      "Plan productions: scope, budget, crew and schedule",
      "Run reviews and give feedback that improves the work",
      "Manage and develop a team of designers, editors and writers",
      "Report progress and risk honestly to leadership",
    ]),
    requirementsMd: list([
      "7+ years in creative agencies or production teams",
      "A portfolio you directed personally",
      "Experience owning budgets and client relationships",
      "Track record of running teams without burning them out",
      "Confident communication in English and Bangla",
    ]),
    niceToHaveMd: list([
      "Experience across film, design and content disciplines",
      "Existing network of reliable freelancers and crews",
    ]),
    skills: ["Creative direction", "Production planning", "Team leadership", "Budgeting", "Client pitching", "Brand strategy", "Mentoring"],
    benefits: productionBenefits,
    experienceText: "7+ years, at least 3 leading teams",
    salaryText: "৳ 90,000 - 130,000 / month",
  },
  "script-creative-content-writer": {
    summary: "Write scripts and creative content for video, campaigns and brand storytelling.",
    descriptionMd:
      "You will write the words behind our video and campaign work: scripts for commercials and brand films, video outlines, campaign concepts and the occasional long-form brand story.\n\nWriting for the ear is the core skill. Scripts have to be speakable, timed and clear, with a hook that earns the next thirty seconds. You will work from briefs, research the subject, and iterate with the director and editor.\n\nFluency in both Bangla and English is a real advantage: much of the work needs both versions to feel native.",
    responsibilitiesMd: list([
      "Write scripts and outlines for video and campaigns",
      "Develop concepts and hooks with the creative team",
      "Research subjects so the writing is accurate",
      "Deliver Bangla and English versions that both feel native",
      "Revise calmly on notes and keep version history clean",
    ]),
    requirementsMd: list([
      "A portfolio of published scripts or creative writing",
      "Excellent Bangla and English writing",
      "Understanding of timing and structure for video",
      "Ability to meet deadlines on parallel projects",
      "Comfortable taking and applying feedback",
    ]),
    niceToHaveMd: list([
      "Experience interviewing for documentary scripts",
      "Basic understanding of production constraints",
    ]),
    skills: ["Scriptwriting", "Bengali writing", "Storytelling", "Concept development", "Interviewing", "Research", "Video outlining"],
    benefits: contentBenefits,
    experienceText: "2+ years in creative writing",
  },
  "seo-brand-content-writer": {
    summary: "Write SEO-aware website and brand content that reads well and actually ranks.",
    descriptionMd:
      "You will write and improve website content: service pages, landing pages, blog articles and brand copy, guided by keyword research but never controlled by it.\n\nThe standard is simple: a person should finish the page convinced, and search engines should understand it clearly. You will audit existing pages, plan topics, and work with the web team to publish.\n\nWe measure this role by qualified traffic and enquiries, not by word count.",
    responsibilitiesMd: list([
      "Research keywords and plan a realistic content calendar",
      "Write and rewrite service pages, articles and landing pages",
      "Audit existing content and propose concrete improvements",
      "Optimise titles, headings and internal links properly",
      "Track rankings and traffic and report what changed",
    ]),
    requirementsMd: list([
      "Professional writing samples in English",
      "Solid on-page SEO understanding",
      "Comfort with analytics and search-console tools",
      "Bangla writing ability is a strong plus",
      "Reliable research and fact-checking habits",
    ]),
    niceToHaveMd: list([
      "Technical SEO knowledge (schema, redirects, speed)",
      "WordPress publishing experience",
    ]),
    skills: ["SEO writing", "Keyword research", "Content planning", "Analytics", "Bengali content", "Editing", "WordPress publishing"],
    benefits: contentBenefits,
    experienceText: "2+ years in SEO or content writing",
    salaryText: "৳ 30,000 - 45,000 / month",
    deadlineInDays: 25,
  },
  "social-media-community-manager": {
    summary: "Plan and run our social presence: content calendars, community replies and honest reporting.",
    descriptionMd:
      "You will own the day-to-day social presence of our brands: planning calendars, scheduling posts, replying to the community and reporting what is actually working.\n\nThe community side is taken seriously here. Replies should be fast, human and on-brand, escalations should reach the right person quickly, and recurring questions should turn into better content.\n\nYou will work with designers and writers to get content produced on time, and with marketing on campaign support.",
    responsibilitiesMd: list([
      "Plan and maintain monthly content calendars",
      "Schedule posts and keep publishing on time",
      "Reply to comments and messages in a human, on-brand voice",
      "Escalate sensitive issues to the right person quickly",
      "Report reach, engagement and community health monthly",
    ]),
    requirementsMd: list([
      "Experience running business social accounts",
      "Excellent Bangla and English written communication",
      "Comfort with native platform tools and schedulers",
      "Calm, judgement under public criticism",
      "Basic reporting ability with clear takeaways",
    ]),
    niceToHaveMd: list([
      "Paid social campaign support experience",
      "Simple graphic or reel editing skills",
    ]),
    skills: ["Content calendars", "Community management", "Social media strategy", "Analytics", "Bengali copywriting", "Escalation handling", "Scheduling tools"],
    benefits: marketingBenefits,
    vacancies: 2,
    experienceText: "1-3 years in community or social roles",
    deadlineInDays: 12,
  },
  "performance-marketing-specialist": {
    summary: "Plan and optimise paid campaigns across Meta and Google with clear targets and honest reporting.",
    descriptionMd:
      "You will plan, launch and optimise paid campaigns across Meta and Google for our brands: structure, targeting, creative testing and budget allocation against clear cost targets.\n\nThe working principle is measurable honesty. Every campaign has a stated goal and a stop-loss; reports say what worked, what did not and what changes next. Guessing in public is not acceptable.\n\nYou will work with designers on creative variants and with analytics on conversion tracking.",
    responsibilitiesMd: list([
      "Build and structure campaigns across Meta and Google",
      "Run creative and audience tests with clear hypotheses",
      "Watch budgets daily and reallocate against targets",
      "Maintain conversion tracking and verify its accuracy",
      "Write reports with findings and next actions",
    ]),
    requirementsMd: list([
      "Proven paid campaign experience with real budgets",
      "Deep knowledge of Ads Managers and their metrics",
      "Comfort with analytics and conversion tracking",
      "Numeric discipline in reporting",
      "Clear written communication in English",
    ]),
    niceToHaveMd: list([
      "Landing-page optimisation experience",
      "Marketing analytics or SQL skills",
    ]),
    skills: ["Meta Ads", "Google Ads", "Campaign optimisation", "A/B testing", "Conversion tracking", "Budget management", "Reporting"],
    benefits: marketingBenefits,
    experienceText: "3+ years in performance marketing",
  },
  "on-camera-presenter-host": {
    summary: "Present and host on camera for brand content, shows and live sessions with natural delivery.",
    descriptionMd:
      "You will present on camera for our brands: hosted explainers, interview segments, event coverage and occasional live sessions. The work is scripted but must never sound scripted.\n\nPreparation is part of the job: reading the brief, learning the subject well enough to improvise, and arriving ready to deliver clean takes efficiently.\n\nWe are looking for someone reliable on set, comfortable with direction, and equally strong in Bangla and English as the role requires.",
    responsibilitiesMd: list([
      "Present scripted and semi-scripted content on camera",
      "Prepare subjects so delivery is confident and accurate",
      "Host interviews and live sessions professionally",
      "Record clean pickup takes and alternate deliveries",
      "Collaborate with the director on tone and pacing",
    ]),
    requirementsMd: list([
      "A showreel of presenting or hosting work",
      "Clear Bangla diction; English as required by roles",
      "Comfortable learning technical subjects quickly",
      "Punctual and dependable on location",
      "Able to take direction and repeat takes consistently",
    ]),
    niceToHaveMd: list([
      "Voice-over experience for edits and idents",
      "Basic interviewing skills for talk-format content",
    ]),
    skills: ["Presenting", "On-camera delivery", "Interviewing", "Teleprompter", "Improvisation", "Bangla diction", "Live hosting"],
    benefits: operationsBenefits,
  },
  "production-coordinator": {
    summary: "Keep productions moving: schedules, call sheets, vendors and budgets tracked to the day.",
    descriptionMd:
      "You will coordinate the practical side of production: schedules, call sheets, locations, permits, vendor bookings and budget tracking. When a shoot runs smoothly, that is this role's work.\n\nOrganisation is the whole job. You will maintain the master schedule, chase confirmations before they become problems, and keep costs recorded as they happen rather than reconstructed afterwards.\n\nWe need someone calm under pressure who communicates clearly and never lets a detail quietly slip.",
    responsibilitiesMd: list([
      "Build and maintain production schedules and call sheets",
      "Book and confirm vendors, locations and transport",
      "Track budgets and flag overruns early",
      "Support shoots on location as production support",
      "Keep records, contracts and invoices filed correctly",
    ]),
    requirementsMd: list([
      "Experience coordinating projects or events",
      "Excellent organisation and follow-through",
      "Confident written communication for schedules and calls",
      "Spreadsheet comfort for budgets and tracking",
      "Available for occasional evening or weekend shoots",
    ]),
    niceToHaveMd: list([
      "Film or advertising production experience",
      "Familiarity with permits and location paperwork",
    ]),
    skills: ["Scheduling", "Vendor coordination", "Budget tracking", "Call sheets", "Logistics", "Communication", "Record keeping"],
    benefits: operationsBenefits,
    experienceText: "2+ years in coordination or production",
  },
};

/**
 * The original Phase 0 demo placeholder content, kept ONLY so an untouched
 * dev database can be recognised and upgraded in place. Never rendered.
 */
export function legacyDemoPlaceholders(title: string) {
  return {
    summary: `Demo description for ${title}. Work with a small team on thoughtful projects.`,
    descriptionMd: `Demo description for **${title}**.\n\n- Collaborate with a small team\n- Develop practical work\n\n[Example project](https://example.com)\n\n<script>alert('demo HTML must not render')</script>`,
    responsibilitiesMd: "- Understand briefs\n- Deliver careful work\n- Communicate progress",
    requirementsMd: "- Relevant skills\n- A portfolio or practical examples\n- Clear communication",
  };
}

/**
 * Conservative in-place upgrade: only a demo job that was never edited (same
 * timestamps) and still carries the original placeholder text is rewritten.
 * Any admin edit or earlier customisation preserves the row untouched.
 */
export function mayUpgradeDemoContent(
  job: Pick<Job, "id" | "createdAt" | "updatedAt" | "summary" | "descriptionMd" | "responsibilitiesMd" | "requirementsMd">,
  expectedJobId: string,
  title: string,
) {
  const legacy = legacyDemoPlaceholders(title);
  return (
    job.id === expectedJobId &&
    job.createdAt.getTime() === job.updatedAt.getTime() &&
    job.summary === legacy.summary &&
    job.descriptionMd === legacy.descriptionMd &&
    job.responsibilitiesMd === legacy.responsibilitiesMd &&
    job.requirementsMd === legacy.requirementsMd
  );
}
