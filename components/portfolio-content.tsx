import { ArrowUpRight, GitBranch, BriefcaseBusiness, Mail } from "lucide-react";
import { biography, contactLinks, experience, interests, projects, type SectionId } from "@/lib/portfolio";

export default function PortfolioContent({section}:{section:SectionId}) {
  if (section === "about") return <div className="about-content"><p>{biography}</p><div className="interest-tags">{interests.map(interest=><span key={interest}>{interest}</span>)}</div></div>;
  if (section === "projects") return <div className="project-list">{projects.map((project,i)=><article key={project.title} className="project-card"><span className="project-index">0{i+1}</span><div><span className="card-eyebrow">{project.type}</span><span className="concept-status">{project.status}</span><h3>{project.title}</h3><p>{project.body}</p><div className="tech-tags">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div></article>)}<a className="text-link" href={contactLinks[1].href} target="_blank" rel="noreferrer">Explore my GitHub <ArrowUpRight size={17}/></a></div>;
  if (section === "experience") return <div className="experience-list">{experience.map(item=><article key={item.title}><span className="timeline-dot"/><span className="card-eyebrow">{item.label}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>;
  return <div className="contact-content"><div className="contact-links">{contactLinks.map(link=>{
    const Icon=link.id==="email"?Mail:link.id==="github"?GitBranch:BriefcaseBusiness;
    return <a key={link.id} className="contact-link" href={link.href} {...(link.id!=="email"?{target:"_blank",rel:"noreferrer"}:{})}><Icon size={24}/><span><small className="contact-label">{link.label}</small><strong>{link.value}</strong><small>{link.description}</small></span><ArrowUpRight size={19}/></a>;
  })}</div><p>Thanks for stopping by.</p></div>;
}
