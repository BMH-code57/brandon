import { ArrowRight, Compass, Diamond, FileText, GitBranch, BriefcaseBusiness, Mail } from "lucide-react";
import { contactLinks } from "@/lib/portfolio";

export default function Welcome() {
  return <main className="welcome-page">
    <header className="welcome-header"><a href="/" className="brand"><span className="brand-mark"><Diamond size={22}/></span><span>BRANDON HOLDA<span className="brand-subtitle">CYBERSECURITY + SYSTEMS</span></span></a><span className="welcome-location">A PERSONAL EXPEDITION</span></header>
    <div className="welcome-body">
      <p className="eyebrow"><span className="little-diamond"/> WELCOME, WANDERER</p>
      <h1>Choose your <em>path.</em></h1>
      <p className="welcome-intro">A little about me, the things I build, and where I’m headed.<br/>How would you like to explore?</p>
      <div className="experience-choices">
        <a className="experience-choice immersive-choice" href="/cave">
          <div className="choice-cave-art" aria-hidden="true"/>
          <div className="choice-top"><span>01 / THE SCENIC ROUTE</span><Compass size={23}/></div>
          <div className="choice-copy"><h2>Enter the cave</h2><p>Take a torch. Wander around.<br/>Discover a story in every corner.</p><span className="choice-action">Immersive experience <ArrowRight size={19}/></span></div>
          <div className="choice-foot"><span>WASD + E</span><span>Keyboard or touch</span></div>
        </a>
        <a className="experience-choice standard-choice" href="/portfolio">
          <div className="choice-top"><span>02 / THE DIRECT ROUTE</span><FileText size={23}/></div>
          <div className="choice-copy"><h2>Browse the portfolio</h2><p>The same story, at your pace.<br/>A familiar page to scroll through.</p><span className="choice-action">Standard website <ArrowRight size={19}/></span></div>
          <div className="choice-foot"><span>ABOUT / PROJECTS / EXPERIENCE / CONTACT</span></div>
        </a>
      </div>
      <p className="choice-reassurance">You can switch views whenever you like.</p>
    </div>
    <footer className="welcome-footer"><span>Made of code, curiosity & a little magic.</span><nav aria-label="Contact Brandon">{contactLinks.map(link=>{const Icon=link.id==="email"?Mail:link.id==="github"?GitBranch:BriefcaseBusiness;return <a key={link.id} href={link.href} aria-label={link.label} {...(link.id!=="email"?{target:"_blank",rel:"noreferrer"}:{})}><Icon size={18}/><span>{link.label}</span></a>;})}</nav></footer>
  </main>;
}
