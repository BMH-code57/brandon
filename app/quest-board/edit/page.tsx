import type {Metadata} from "next";
import {ArrowLeft,ScrollText} from "lucide-react";
import QuestBoard from "@/components/quest-board";
export const metadata:Metadata={title:"Quest board editor | Brandon Holda",robots:{index:false,follow:false}};
export default function QuestEditor(){return <main className="quest-editor-page"><a className="text-link" href="/cave"><ArrowLeft size={16}/>Back to the cavern</a><header><p className="eyebrow"><ScrollText size={15}/> THE READING ALCOVE</p><h1>Your quest board.</h1><p>Interesting reads, shared a little at a time.</p></header><QuestBoard editor/></main>;}
