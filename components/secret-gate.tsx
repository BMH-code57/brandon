"use client";
import {useEffect,useState,type FormEvent} from "react";
import {ArrowRight,KeyRound,LoaderCircle} from "lucide-react";
import {Dialog,DialogContent,DialogDescription,DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
export type SecretRoom = {title:string;description:string};
export default function SecretGate({open,onClose,onUnlocked}:{open:boolean;onClose:()=>void;onUnlocked:(room:SecretRoom)=>void}) {
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{if(!open){setPassword("");setError("");setBusy(false);}},[open]);
  async function submit(event:FormEvent){
    event.preventDefault();if(busy)return;setBusy(true);setError("");
    try{
      const response=await fetch("/api/secret/unlock",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
      const data=await response.json() as {error?:string};
      if(!response.ok){setError(data.error??"The passage couldn't open. Please try again.");return;}
      setPassword("");
      const session=await fetch("/api/secret/session",{credentials:"same-origin",cache:"no-store"});
      if(!session.ok){setError("Your password was accepted, but the browser couldn't keep the session. Open the site in a separate tab and try again.");return;}
      const room=await session.json() as {title?:unknown;description?:unknown};
      if(typeof room.title!=="string" || typeof room.description!=="string")throw new Error();
      onUnlocked({title:room.title,description:room.description});
    }catch{setError("The connection faded. Please try again.");}finally{setBusy(false);}
  }
  return <Dialog open={open} onOpenChange={value=>{if(!value&&!busy)onClose();}}><DialogContent className="portfolio-dialog secret-dialog"><p className="eyebrow"><KeyRound size={14}/> A HIDDEN PASSAGE</p><DialogTitle className="modal-title">Some doors need<br/>a little trust.</DialogTitle><DialogDescription className="modal-intro">The book has revealed a passage. Enter its password to step inside. This browser remembers your access for seven days after your last visit.</DialogDescription><form onSubmit={submit} className="secret-form"><label htmlFor="passage-password">Passage password</label><Input id="passage-password" type="password" value={password} onChange={event=>{setPassword(event.target.value);setError("");}} autoComplete="current-password" maxLength={256} required disabled={busy} aria-invalid={!!error} aria-describedby={error?"passage-error":undefined} placeholder="Enter the password"/><p id="passage-error" role="alert" className="passage-error">{error}</p><button type="submit" disabled={busy||!password} className="primary-button">{busy?<><LoaderCircle size={17} className="spin"/>Opening the passage...</>:<>Enter the chamber <ArrowRight size={17}/></>}</button></form></DialogContent></Dialog>;
}
