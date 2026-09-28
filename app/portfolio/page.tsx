import { ArrowDown, ArrowRight, Compass, Diamond } from "lucide-react";
import PortfolioContent from "@/components/portfolio-content";
import { landmarks, sectionCopy } from "@/lib/portfolio";

export default function StandardPortfolio() {
  return <main className="standard-page" id="top">
    <a href="#about" className="skip-link">Skip to portfolio content</a>
    <header className="site-header standard-header"><a href="/" className="brand" aria-label="Brandon Holda, choose your experience"><span className="brand-mark"><Diamond size={22}/></span><span>BRANDON HOLDA<span className="brand-subtitle">CYBERSECURITY + SYSTEMS</span></span></a><nav aria-label="Portfolio sections">{landmarks.map(l=><a key={l.id} href={`#${l.id}`} className="nav-link">{l.id==="contact"?"Contact":l.title}</a>)}</nav><a href="/cave" className="view-switch"><Compass size={17}/> Explore the cave</a></header>
    <section className="standard-hero">
      <div className="standard-hero-copy"><p className="eyebrow"><span className="little-diamond"/> CYBERSECURITY / AI / SYSTEMS</p><h1>Curiosity.<br/>Built into <em>everything.</em></h1><p>{sectionCopy.about.title} {sectionCopy.about.intro}</p><a className="text-link" href="#projects">Explore my projects <ArrowDown size={17}/></a></div>
      <div className="standard-hero-art"><img src="/assets/cavern.webp" alt="A purple crystal cavern with a book shrine, workshop, and glowing portal"/><a href="/cave"><Compass size={18}/><span>There’s another way to explore.<strong>Step into the cavern</strong></span><ArrowRight size={20}/></a></div>
    </section>
    <div className="standard-content">{landmarks.map(l=><section key={l.id} id={l.id} className={`standard-section standard-${l.id}`} aria-labelledby={`heading-${l.id}`}><div className="standard-section-heading"><span className="section-number">{l.number}</span><p className="eyebrow">{l.id==="contact"?"GET IN TOUCH":l.title.toUpperCase()}</p><h2 id={`heading-${l.id}`}>{sectionCopy[l.id].title}</h2><p>{sectionCopy[l.id].intro}</p></div><PortfolioContent section={l.id}/></section>)}</div>
    <footer className="standard-footer"><a href="/" className="brand">BRANDON HOLDA</a><span>Made of code, curiosity & a little magic.</span><a href="#top">Back to top <ArrowUpIcon/></a></footer>
  </main>;
}
function ArrowUpIcon(){return <ArrowRight size={16} style={{transform:"rotate(-90deg)"}}/>;}
