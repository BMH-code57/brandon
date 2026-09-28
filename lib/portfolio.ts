export type SectionId = "about" | "projects" | "experience" | "contact";
export const landmarks: { id: SectionId; title: string; place: string; x: number; y: number; labelX?: number; labelY?: number; glowX: number; glowY: number; number: string }[] = [
  { id: "about", title: "About me", place: "The story shrine", x: 375, y: 350, labelX: 290, labelY: 280, glowX: 240, glowY: 165, number: "01" },
  { id: "projects", title: "Projects", place: "The crystal workshop", x: 1190, y: 350, labelX: 1260, labelY: 285, glowX: 1200, glowY: 155, number: "02" },
  { id: "experience", title: "Experience", place: "The old archive", x: 480, y: 735, glowX: 260, glowY: 745, number: "03" },
  { id: "contact", title: "Get in touch", place: "The portal", x: 1130, y: 745, glowX: 1360, glowY: 795, number: "04" },
];
export const sectionCopy: Record<SectionId, { eyebrow: string; title: string; intro: string }> = {
  about: { eyebrow: "01 / THE STORY SHRINE", title: "I am Brandon.", intro: "A cybersecurity specialist and systems builder working across AI, data, risk, and product engineering." },
  projects: { eyebrow: "02 / THE CRYSTAL WORKSHOP", title: "Ideas taking shape.", intro: "Three concepts exploring movement, knowledge, and the world around us." },
  experience: { eyebrow: "03 / THE OLD ARCHIVE", title: "The path so far.", intro: "Computer science, practical leadership, and a growing focus on AI safety." },
  contact: { eyebrow: "04 / THE PORTAL", title: "Let's cross paths.", intro: "Interested in AI safety, a new idea, or something I've built? Get in touch." },
};
export const biography = "I am completing an M.S. in Information Systems and AI at the University of Maryland after earning a B.S. in Computer Science. My work spans AI red teaming, analytical systems, data design, and interfaces that make complex information usable.";
export const interests = ["Cybersecurity", "AI red teaming", "Data design", "Product engineering"];
export const contactLinks = [
  {id:"email",label:"Email",value:"brandonmholda@gmail.com",href:"mailto:brandonmholda@gmail.com",description:"Start a conversation"},
  {id:"github",label:"GitHub",value:"BMH-code57",href:"https://github.com/BMH-code57",description:"Projects, code, and experiments"},
  {id:"linkedin",label:"LinkedIn",value:"Brandon Holda",href:"https://www.linkedin.com/in/brandonholda/",description:"Connect professionally"},
];
export const projects = [
  { title: "Lean Lab", type: "INTERACTIVE SIMULATION", status: "Concept in development", body: "A hands-on cornering simulator where speed, grip, camber, and rider input become visible forces.", tags: ["Simulation", "Interaction", "Physics"] },
  { title: "Threadline", type: "APPLIED AI", status: "Concept in development", body: "A research companion that reveals useful connections across notes, unfinished thoughts, and saved ideas.", tags: ["AI", "Search", "Interface"] },
  { title: "Ambient Index", type: "DATA ART", status: "Concept in development", body: "A daily instrument that turns weather, sound, light, and movement into a portrait of a place.", tags: ["Data", "Creative code", "Sound"] },
];
export const experience = [
  { title: "AI safety and red teaming", label: "RESEARCH", body: "Exploring model behavior, evaluating risks, and communicating technical findings clearly." },
  { title: "M.S. Information Systems", label: "UNIVERSITY OF MARYLAND", body: "Connecting technical systems with the people and organizations that use them. Expected December 2026." },
  { title: "B.S. Computer Science", label: "UMGC / 2024", body: "A foundation in software engineering, algorithms, and building applications." },
  { title: "Team leadership", label: "OPERATIONS + PEOPLE", body: "Experience organizing event operations, training teammates, and keeping busy teams moving." },
];
