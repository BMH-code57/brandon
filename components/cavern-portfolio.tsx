"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, Check, Compass, Diamond, LockKeyhole, Map, Moon, RotateCcw, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import ChamberContentPanel from "@/components/chamber-content";
import {chamberCorners,type ChamberId} from "@/lib/chamber";
import PortfolioContent from "@/components/portfolio-content";
import SecretGate, { type SecretRoom } from "@/components/secret-gate";
import { nextBookCount } from "@/lib/secret-sequence";
import CaveGame, { type GameControls, type GameSnapshot } from "@/components/cave-game";
import { landmarks, sectionCopy, type SectionId } from "@/lib/portfolio";
export default function CavernPortfolio() {
  const [chamberSection,setChamberSection]=useState<ChamberId|null>(null);
  const [section, setSection] = useState<SectionId | null>(null);
  const [visited, setVisited] = useState<SectionId[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [help, setHelp] = useState(false);
  const [secretRoom, setSecretRoom] = useState<SecretRoom | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [rememberedRoom, setRememberedRoom] = useState<SecretRoom | null>(null);
  const [checkingPassage, setCheckingPassage] = useState(false);
  const checkingPassageRef = useRef(false);
  const [bookCount, setBookCount] = useState(0);
  const bookCountRef = useRef(0);
  const [passageNotice, setPassageNotice] = useState("");
  const [leaving, setLeaving] = useState(false);
  const lastBookTime = useRef(0);
  function resetBook() { if (bookCountRef.current) { bookCountRef.current = 0; setBookCount(0); } }
  function inspectBook() {
    if (secretRoom || gateOpen || checkingPassageRef.current || performance.now() - lastBookTime.current < 220) return;
    lastBookTime.current = performance.now();
    if (rememberedRoom) { void openPassage(); return; }
    bookCountRef.current = nextBookCount(bookCountRef.current, "book");
    setBookCount(bookCountRef.current);
    if (bookCountRef.current === 4) { resetBook(); void openPassage(); }
  }
  function enterSecret(room:SecretRoom) {
    setGateOpen(false);setSecretRoom(room);setRememberedRoom(room);setReady(false);setFailed(false);setPassageNotice("");resetBook();
    controls.current.x=0;controls.current.y=0;controls.current.interact=false;
  }
  function leaveSecret() {
    if(leaving)return;
    setSecretRoom(null);setChamberSection(null);setReady(false);setFailed(false);setPassageNotice("");
    controls.current.x=0;controls.current.y=0;controls.current.interact=false;
  }
  async function openPassage() {
    if(checkingPassageRef.current)return;
    checkingPassageRef.current=true;setCheckingPassage(true);setPassageNotice("");
    controls.current.x=0;controls.current.y=0;resetBook();
    try {
      const response=await fetch("/api/secret/session",{cache:"no-store",credentials:"same-origin"});
      if(response.status===401){setRememberedRoom(null);setGateOpen(true);return;}
      if(!response.ok)throw new Error();
      const room=await response.json() as Partial<SecretRoom>;
      if(typeof room.title!=="string"||typeof room.description!=="string")throw new Error();
      enterSecret({title:room.title,description:room.description});
    } catch {setPassageNotice("The passage couldn't be reached. Please try again.");}
    finally {checkingPassageRef.current=false;setCheckingPassage(false);}
  }
  async function forgetAccess() {
    if(leaving)return;setLeaving(true);
    controls.current.x=0;controls.current.y=0;controls.current.interact=false;
    try {
      const response=await fetch("/api/secret/leave",{method:"POST",credentials:"same-origin"});
      if(!response.ok)throw new Error();
      setSecretRoom(null);setChamberSection(null);setRememberedRoom(null);setReady(false);setFailed(false);resetBook();
      setPassageNotice("Access forgotten. The book will ask for the code next time.");
    } catch {setPassageNotice("Access couldn't be cleared. Please try again.");}
    finally {setLeaving(false);}
  }
  useEffect(()=>{
    const controller=new AbortController();
    fetch("/api/secret/session",{cache:"no-store",credentials:"same-origin",signal:controller.signal})
      .then(async response=>{
        if(!response.ok)return;
        const room=await response.json() as Partial<SecretRoom>;
        if(!controller.signal.aborted&&typeof room.title==="string"&&typeof room.description==="string")setRememberedRoom({title:room.title,description:room.description});
      }).catch(()=>{});
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!secretRoom||leaving)return;
    const controller=new AbortController();
    const interval=window.setInterval(async()=>{
      if(document.visibilityState!=="visible")return;
      try {
        const response=await fetch("/api/secret/session",{cache:"no-store",credentials:"same-origin",signal:controller.signal});
        if(!controller.signal.aborted&&response.status===401){setSecretRoom(null);setChamberSection(null);setRememberedRoom(null);setReady(false);setPassageNotice("The passage has closed. Inspect the book again to return.");}
      }catch{}
    },60000);
    return()=>{window.clearInterval(interval);controller.abort();};
  },[secretRoom,leaving]);
  const [snapshot, setSnapshot] = useState<GameSnapshot>({ player: { x: 768, y: 690 }, nearby: null, markers: [] });
  const controls = useRef<GameControls>({ x: 0, y: 0, interact: false, reset: false });
  const gameSurface = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches); sync();
    query.addEventListener("change", sync); return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => { if (!ready) setFailed(true); }, 18000);
    return () => window.clearTimeout(timeout);
  }, [ready]);
  function openSection(id: SectionId) {
    resetBook();setChamberSection(null);
    controls.current.x = 0; controls.current.y = 0;
    setSection(id); setVisited(current => current.includes(id) ? current : [...current, id]);
  }
  const lockChamber=useCallback(()=>{
    setSecretRoom(null);setChamberSection(null);setRememberedRoom(null);setReady(false);setFailed(false);
    setPassageNotice("The passage has closed. Inspect the book again to return.");
  },[]);
  function openChamber(id:ChamberId) {
    if(!secretRoom)return;
    controls.current.x=0;controls.current.y=0;controls.current.interact=false;
    setSection(null);setChamberSection(id);
  }
  const currentCorner=chamberCorners.find(corner=>corner.id===snapshot.chamberNear);
  const cornerInfo=chamberCorners.find(corner=>corner.id===chamberSection);
  const currentLandmark = landmarks.find(l => l.id === snapshot.nearby);
  const info = section ? sectionCopy[section] : null;
  return (
    <main className="portfolio-shell">
      <a href="#portfolio-navigation" className="skip-link">Skip exploration and browse portfolio</a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Brandon Holda, choose your experience">
          <span className="brand-mark"><Diamond size={22} strokeWidth={1.6} /></span>
          <span>BRANDON HOLDA<span className="brand-subtitle">A PERSONAL EXPEDITION</span></span>
        </a>
        <nav id="portfolio-navigation" aria-label="Portfolio sections" tabIndex={-1}>
          {landmarks.map(l => <button key={l.id} onClick={() => openSection(l.id)} className={section === l.id ? "nav-link active" : "nav-link"}>{l.id === "contact" ? "Contact" : l.title}</button>)}
        </nav>
        <a className="view-switch" href="/portfolio"><BookOpen size={17}/><span>Standard view</span></a>
      </header>
      <section className={`cave-stage ${secretRoom?"quiet-stage":""}`} aria-label="Explore Brandon's cavern">
        <div ref={gameSurface} tabIndex={0} role="application" aria-label="Cave exploration. Use WASD or arrow keys to move. Press E near a landmark to inspect it. Press Tab to leave the game and use the portfolio navigation." className="game-surface" onPointerDown={() => gameSurface.current?.focus()}>
          <CaveGame controls={controls} secret={!!secretRoom} paused={section !== null || chamberSection !== null || help || gateOpen || leaving || checkingPassage} onBook={inspectBook} onMove={resetBook} onLeave={leaveSecret} reducedMotion={reducedMotion} onUpdate={setSnapshot} onInteract={openSection} onChamber={openChamber} onReady={() => { setReady(true); setFailed(false); }} onError={() => setFailed(true)} />
        </div>
        <div className="cave-vignette" aria-hidden="true" />
        <div className="cave-intro"><p className="eyebrow"><span className="little-diamond" />{secretRoom ? "A HIDDEN CHAPTER" : "WELCOME, WANDERER"}</p>{secretRoom ? <><h1>The quiet<br/><em>chamber.</em></h1><p>{secretRoom.description}</p></> : <><h1>Follow your<br /><em>curiosity.</em></h1><p>A little cave. A few things about me.<br />Pick a path and see what you find.</p></>}</div>
        <div className="chapter-label"><span>{secretRoom ? "THE QUIET CHAMBER" : "THE CAVERN"}</span><span>{secretRoom ? "CHAPTER 02" : "CHAPTER 01"}</span></div>
        {secretRoom && <div className="chamber-actions"><button className="return-cavern" onClick={leaveSecret} disabled={leaving}><ArrowLeft size={15}/>Return to the cavern</button><button className="forget-access" onClick={forgetAccess} disabled={leaving}><LockKeyhole size={13}/>{leaving?"Forgetting...":"Forget access"}</button></div>}
        {secretRoom && <nav className="chamber-navigation" aria-label="Quiet chamber corners">{chamberCorners.map((corner,index)=><button key={corner.id} onClick={()=>openChamber(corner.id)} aria-label={`${corner.title}, ${index<2?"upper":"lower"} ${index%2===0?"left":"right"} corner`}><span>0{index+1}</span>{corner.title}</button>)}</nav>}
        {!secretRoom && rememberedRoom && <button className="return-cavern remembered-passage" onClick={openPassage} disabled={checkingPassage}><Sparkles size={15}/>{checkingPassage?"Opening...":"Return to the quiet chamber"}</button>}
        {checkingPassage && !rememberedRoom && <p className="passage-notice" role="status">Opening the passage...</p>}
        {ready && !failed && !secretRoom && snapshot.bookPoint && <button className={`secret-book-hit ${snapshot.bookNear ? "close-to-book" : ""}`} style={{left:snapshot.bookPoint.x,top:snapshot.bookPoint.y}} onClick={inspectBook} aria-label="Inspect the upside-down book"><span className="book-hint">{bookCount ? "A whisper answers..." : "An unusual book"}</span>{bookCount>0 && <span className="book-runes" aria-label={`${bookCount} consecutive interactions`}>{[1,2,3,4].map(number=><i key={number} className={number<=bookCount?"lit":""}/>)}</span>}</button>}
        {ready && !failed && secretRoom && snapshot.fairyNear && snapshot.fairyPoint && !chamberSection && !help && !leaving && <div className="fairy-speech" role="status" style={{left:snapshot.fairyPoint.x,top:snapshot.fairyPoint.y}}>Hey, Listen!</div>}
        {passageNotice && <p className="passage-notice" role="status">{passageNotice}</p>}
        {ready && !failed && secretRoom && <div className="landmark-layer">{snapshot.chamberMarkers?.map(marker=>{
          const corner=chamberCorners.find(item=>item.id===marker.id)!;
          return <button key={corner.id} className={`landmark chamber-landmark ${snapshot.chamberNear===corner.id?"nearby":""}`} style={{left:marker.x,top:marker.y}} onClick={()=>openChamber(corner.id)} aria-label={`Open ${corner.title}, ${corner.eyebrow}`}><span className="landmark-number">{corner.eyebrow.slice(0,2)}</span><span>{corner.title}</span><Diamond size={10}/></button>;
        })}</div>}
        {ready && !failed && !secretRoom && <div className="landmark-layer">{snapshot.markers.map(marker => {
          const l = landmarks.find(item => item.id === marker.id)!;
          return <button key={l.id} className={`landmark ${snapshot.nearby === l.id ? "nearby" : ""}`} style={{ left: marker.x, top: marker.y }} onClick={() => openSection(l.id)} aria-label={`Open ${l.title}`}><span className="landmark-number">{visited.includes(l.id) ? <Check size={12} /> : l.number}</span><span>{l.title}</span><span className="landmark-spark"><Diamond size={10} /></span></button>;
        })}</div>}
        {!ready && !failed && <div className="loading-card" role="status"><Diamond className="loading-crystal" size={30} /><span>Lighting the way...</span></div>}
        {failed && <div className="loading-card error-card"><Moon size={28} /><h2>The cave couldn't load.</h2><p>You can still explore every section using the menu above.</p><button onClick={() => window.location.reload()}>Try again</button></div>}
        {!secretRoom && <div className="exploration-status" aria-label={`${visited.length} of ${landmarks.length} places explored`}><span className="status-label">YOUR EXPEDITION</span><div className="discovery-count"><span>{String(visited.length).padStart(2, "0")}</span><span>/ {String(landmarks.length).padStart(2, "0")}</span></div><div className="discovery-track">{landmarks.map(l => <span key={l.id} className={visited.includes(l.id) ? "found" : ""} />)}</div><span className="status-caption">{visited.length === landmarks.length ? "Every corner has a story." : "places discovered"}</span></div>}
        {!secretRoom && <div className="mini-map" aria-hidden="true"><span className="map-title"><Map size={12} /> YOU ARE HERE</span><div className="map-field">{landmarks.map(l => <span key={l.id} className={`map-point ${visited.includes(l.id) ? "found" : ""}`} style={{ left: `${l.x / 1536 * 100}%`, top: `${l.y / 1024 * 100}%` }} />)}<span className="map-player" style={{ left: `${snapshot.player.x / 1536 * 100}%`, top: `${snapshot.player.y / 1024 * 100}%` }} /></div></div>}
        {ready && !failed && <div className="interaction-prompt" aria-live="polite">{snapshot.bookNear && !secretRoom ? <button onClick={inspectBook}><kbd>E</kbd> Inspect the upside-down book {bookCount>0 ? `${bookCount}/4` : ""}</button> : secretRoom ? (currentCorner ? <button onClick={()=>openChamber(currentCorner.id)}><kbd>E</kbd> Inspect {currentCorner.title.toLowerCase()}<ArrowUpRight size={15}/></button> : snapshot.exitNear ? <button onClick={leaveSecret}><kbd>E</kbd> Return to the cavern <ArrowRight size={15}/></button> : <span><Sparkles size={14}/> {secretRoom.title}</span>) : currentLandmark ? <button onClick={() => openSection(currentLandmark.id)}><kbd>E</kbd> Explore {currentLandmark.title.toLowerCase()}<ArrowUpRight size={15} /></button> : <span><Sparkles size={14} /> Walk toward a glowing landmark</span>}</div>}

        <div className="touch-controls" aria-label="Touch movement controls"><div className="direction-pad">{([{ label: "Move up", x: 0, y: -1, Icon: ArrowUp, cls: "up" }, { label: "Move left", x: -1, y: 0, Icon: ArrowLeft, cls: "left" }, { label: "Move down", x: 0, y: 1, Icon: ArrowDown, cls: "down" }, { label: "Move right", x: 1, y: 0, Icon: ArrowRight, cls: "right" }]).map(({ label, x, y, Icon, cls }) => <button key={label} className={cls} aria-label={label} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); controls.current.x = x; controls.current.y = y; }} onPointerUp={() => { controls.current.x = 0; controls.current.y = 0; }} onPointerCancel={() => { controls.current.x = 0; controls.current.y = 0; }} onLostPointerCapture={() => { controls.current.x = 0; controls.current.y = 0; }}><Icon size={20} /></button>)}</div><button className="touch-interact" disabled={!currentLandmark && !snapshot.bookNear && !snapshot.exitNear && !currentCorner} onClick={() => { if(secretRoom&&currentCorner)openChamber(currentCorner.id); else if(secretRoom && snapshot.exitNear)void leaveSecret(); else if(snapshot.bookNear)inspectBook(); else if(currentLandmark)openSection(currentLandmark.id); }} aria-label="Inspect nearby landmark">E</button></div>
      </section>
      <footer className="game-footer"><div className="control-hints"><span className="key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>move</span><span className="hint-divider" /><kbd>E</kbd><span>interact</span></div><span className="footer-note">Made of code, curiosity & a little magic.</span><div className="footer-actions"><button onClick={() => { controls.current.reset = true; gameSurface.current?.focus(); }} aria-label="Return to the starting point" title="Return to start"><RotateCcw size={17} /></button><button className={reducedMotion ? "selected" : ""} onClick={() => { resetBook(); setReducedMotion(value => !value); }} aria-pressed={reducedMotion} aria-label="Reduce ambient animation" title="Reduce motion"><Moon size={17} /></button><button onClick={() => { resetBook(); setHelp(true); }} aria-label="How to explore" title="How to explore"><Compass size={18} /></button></div></footer>
      <Dialog open={chamberSection!==null&&!!secretRoom} onOpenChange={open=>{if(!open)setChamberSection(null);}}><DialogContent className={`portfolio-dialog chamber-dialog ${chamberSection==="league"||chamberSection==="anime"?"collection-dialog":""}`} onCloseAutoFocus={event=>{event.preventDefault();gameSurface.current?.focus();}}>{cornerInfo&&chamberSection&&<><p className="eyebrow modal-eyebrow"><Diamond size={12}/>{cornerInfo.eyebrow}</p><DialogTitle className="modal-title">{cornerInfo.title}</DialogTitle><DialogDescription className="modal-intro">{cornerInfo.intro}</DialogDescription><ChamberContentPanel corner={chamberSection} onLocked={lockChamber}/><div className="modal-bottom"><span>The quiet chamber</span><button onClick={()=>setChamberSection(null)}>Back to exploring <ArrowRight size={15}/></button></div></>}</DialogContent></Dialog>
      <SecretGate open={gateOpen} onClose={()=>{setGateOpen(false);gameSurface.current?.focus();}} onUnlocked={enterSecret}/>
      <Dialog open={section !== null} onOpenChange={open => { if (!open) setSection(null); }}><DialogContent className="portfolio-dialog" onCloseAutoFocus={event => { event.preventDefault(); gameSurface.current?.focus(); }}>{section && info && <><p className="eyebrow modal-eyebrow"><Diamond size={12} />{info.eyebrow}</p><DialogTitle className="modal-title">{info.title}</DialogTitle><DialogDescription className="modal-intro">{info.intro}</DialogDescription>
        <PortfolioContent section={section}/>
        <div className="modal-bottom"><span><BookOpen size={14} /> {landmarks.find(l => l.id === section)?.place}</span><button onClick={() => setSection(null)}>Back to exploring <ArrowRight size={15} /></button></div>
      </>}</DialogContent></Dialog>
      <Dialog open={help} onOpenChange={setHelp}><DialogContent className="portfolio-dialog help-dialog" onCloseAutoFocus={event => { event.preventDefault(); gameSurface.current?.focus(); }}><p className="eyebrow"><Compass size={14} /> A FIELD GUIDE</p><DialogTitle className="modal-title">Find your own path.</DialogTitle><DialogDescription className="modal-intro">Move with WASD or the arrow keys. On a touch screen, use the direction buttons.</DialogDescription><p>Walk toward a glowing landmark and press E to discover its story. You can also click a landmark or use the navigation at the top to open any section.</p><p>The moon button reduces ambient motion. The return button brings you back to the center.</p><button className="primary-button" onClick={() => setHelp(false)}>Let's explore <ArrowRight size={16} /></button></DialogContent></Dialog>
    </main>
  );
}
