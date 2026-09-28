"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {ArrowUpRight,BookOpen,Check,LockKeyhole,Pencil,Plus,Trash2} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle} from "@/components/ui/alert-dialog";
import {isQuestArticle,type QuestArticle} from "@/lib/quest-board";

function ArticleCard({article,children}:{article:QuestArticle;children?:React.ReactNode}){
  return <article className="quest-article"><div className="quest-article-meta"><span>{new URL(article.url).hostname.replace(/^www\./,"")}</span><time dateTime={article.postedAt}>{new Date(article.postedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}</time></div><a href={article.url} target="_blank" rel="noopener noreferrer" className="quest-article-title"><h3>{article.title}</h3><ArrowUpRight size={20}/><span className="sr-only"> (opens in a new tab)</span></a>{article.note&&<p>{article.note}</p>}{children}</article>;
}
export default function QuestBoard({editor=false}:{editor?:boolean}){
  const [articles,setArticles]=useState<QuestArticle[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState("");
  const [authenticated,setAuthenticated]=useState(false),[checking,setChecking]=useState(editor);
  const [key,setKey]=useState("");
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const [draft,setDraft]=useState({id:"",title:"",url:"",note:""});
  const [removing,setRemoving]=useState<QuestArticle|null>(null);
  const load=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/quest-board",{cache:"no-store",signal});
      const body=await response.json();if(!response.ok)throw new Error(body.error||"The board couldn't be reached.");
      if(!Array.isArray(body.articles)||!body.articles.every(isQuestArticle))throw new Error("The board couldn't be read.");
      if(!signal?.aborted)setArticles(body.articles);
    }catch(error){if(!signal?.aborted)setError(error instanceof Error?error.message:"Please try again.");}
    finally{if(!signal?.aborted)setLoading(false);}
  },[]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort();},[load]);
  useEffect(()=>{
    if(!editor)return;const controller=new AbortController();
    fetch("/api/quest-board/session",{cache:"no-store",signal:controller.signal}).then(r=>r.json()).then(body=>{if(!controller.signal.aborted)setAuthenticated(body.authenticated===true);}).catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setChecking(false);});
    return()=>controller.abort();
  },[editor]);
  async function mutate(path:string,method:string,body?:unknown){
    const response=await fetch(path,{method,headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),credentials:"same-origin"});
    const data=await response.json();if(!response.ok){if(response.status===401)setAuthenticated(false);throw new Error(data.error||"Please try again.");}return data;
  }
  async function unlock(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");try{await mutate("/api/quest-board/session","POST",{key});setKey("");setAuthenticated(true);}catch(error){setMessage((error as Error).message);}finally{setBusy(false);}}
  async function save(event:FormEvent){
    event.preventDefault();setBusy(true);setMessage("");
    try{const body={...draft,id:draft.id||undefined};await mutate("/api/quest-board","POST",body);setDraft({id:"",title:"",url:"",note:""});setMessage(draft.id?"Article updated.":"Pinned to the quest board.");await load();}
    catch(error){setMessage((error as Error).message);}finally{setBusy(false);}
  }
  async function remove(){if(!removing)return;setBusy(true);setMessage("");try{await mutate("/api/quest-board","DELETE",{id:removing.id});if(draft.id===removing.id)setDraft({id:"",title:"",url:"",note:""});setRemoving(null);setMessage("Article removed.");await load();}catch(error){setMessage((error as Error).message);}finally{setBusy(false);}}
  async function signOut(){setBusy(true);setMessage("");try{await mutate("/api/quest-board/session","DELETE");setAuthenticated(false);setDraft({id:"",title:"",url:"",note:""});}catch(error){setMessage((error as Error).message);}finally{setBusy(false);}}
  return <div className="quest-board-content">
    {editor&&checking&&<p role="status">Opening the editor...</p>}
    {editor&&!checking&&!authenticated&&<form className="quest-editor-form" onSubmit={unlock}><LockKeyhole size={22}/><h2>Open your editor</h2><p>Your private editor key lets you pin articles. It is separate from the cave password.</p><label htmlFor="editor-key">Editor access key</label><Input id="editor-key" type="password" autoComplete="current-password" value={key} onChange={e=>setKey(e.target.value)} required maxLength={256}/><button className="primary-button" disabled={busy}>{busy?"Opening...":"Open editor"}</button></form>}
    {editor&&authenticated&&<form className="quest-editor-form" onSubmit={save}><div className="quest-editor-heading"><h2>{draft.id?"Edit pinned article":"Pin an article"}</h2><button type="button" className="text-link" onClick={signOut} disabled={busy}>Lock editor</button></div><label htmlFor="article-url">Article link</label><Input id="article-url" type="url" placeholder="https://" required maxLength={2048} value={draft.url} onChange={e=>setDraft({...draft,url:e.target.value})}/><label htmlFor="article-title">Title</label><Input id="article-title" required maxLength={160} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/><label htmlFor="article-note">Why it caught your eye <span>(optional)</span></label><Textarea id="article-note" maxLength={600} rows={3} value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})}/><div className="quest-editor-actions"><button className="primary-button" disabled={busy}>{draft.id?<Check size={17}/>:<Plus size={17}/>} {busy?"Saving...":draft.id?"Save changes":"Pin to board"}</button>{draft.id&&<button type="button" className="text-link" disabled={busy} onClick={()=>setDraft({id:"",title:"",url:"",note:""})}>Cancel edit</button>}</div><p className="quest-editor-hint">Saved articles appear in the cave and standard view immediately.</p></form>}
    {message&&<p role="status" className="quest-message">{message}</p>}
    {loading?<p role="status" className="quest-empty">Reading the board...</p>:error?<div className="quest-empty" role="status"><p>{error}</p><button className="text-link" onClick={()=>void load()}>Try again</button></div>:!articles.length?<div className="quest-empty"><BookOpen size={26}/><p>No articles pinned yet.</p><span>Check back for the next discovery.</span></div>:<div className="quest-article-list">{articles.map(article=><ArticleCard article={article} key={article.id}>{editor&&authenticated&&<div className="quest-editor-actions"><button className="text-link" disabled={busy} onClick={()=>{setDraft({...article});setMessage("");document.getElementById("article-url")?.focus();}}><Pencil size={15}/>Edit</button><button className="text-link" disabled={busy} onClick={()=>setRemoving(article)}><Trash2 size={15}/>Remove</button></div>}</ArticleCard>)}</div>}
    {!editor&&<a className="quest-manage" href="/quest-board/edit"><LockKeyhole size={13}/> Manage articles</a>}
    <AlertDialog open={!!removing} onOpenChange={open=>{if(!open&&!busy)setRemoving(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove this article?</AlertDialogTitle><AlertDialogDescription>{removing?.title} will disappear from the public board.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Keep article</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={event=>{event.preventDefault();void remove();}}>{busy?"Removing...":"Remove article"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
