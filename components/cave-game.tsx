"use client";
import { useEffect, useRef } from "react";
import { landmarks, QUEST_BOARD, type SectionId } from "@/lib/portfolio";
import { WORLD_WIDTH, WORLD_HEIGHT, movePlayer } from "@/lib/cave-physics";
import { chamberCorners, isChamberWalkable, nearbyChamberCorner, type ChamberId } from "@/lib/chamber";
import { SECRET_BOOK } from "@/lib/secret-sequence";
import { chamberCrystals, chamberLanterns, chamberWater, paintChamberWater } from "@/lib/chamber-atmosphere";
import { AdventurerAnimation } from "@/lib/adventurer-animation";
export type GameSnapshot = { fairyNear?: boolean; fairyPoint?: {x:number;y:number}; player: { x: number; y: number }; nearby: SectionId | null; markers: { id: SectionId; x: number; y: number }[]; bookNear?: boolean; bookPoint?: {x:number;y:number}; exitNear?: boolean; chamberNear?: ChamberId|null; chamberMarkers?: {id:ChamberId;x:number;y:number}[] };
export type GameControls = { x: number; y: number; interact: boolean; reset: boolean };
export default function CaveGame({ controls, paused, reducedMotion, secret = false, onUpdate, onInteract, onChamber, onBook, onMove, onLeave, onReady, onError }: {
  controls: React.MutableRefObject<GameControls>; paused: boolean; reducedMotion: boolean; secret?: boolean;
  onUpdate: (snapshot: GameSnapshot) => void; onInteract: (id: SectionId) => void; onChamber:(id:ChamberId)=>void; onBook:()=>void; onMove:()=>void; onLeave:()=>void; onReady: () => void; onError: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ paused, reducedMotion, onUpdate, onInteract, onChamber, onBook, onMove, onLeave, onReady, onError });
  latest.current = { paused, reducedMotion, onUpdate, onInteract, onChamber, onBook, onMove, onLeave, onReady, onError };
  useEffect(() => {
    let disposed = false;
    let game: import("phaser").Game | undefined;
    let observer: ResizeObserver | undefined;
    let cleanupKeys = () => {};
    import("phaser").then(({ default: Phaser }) => {
      if (disposed || !host.current) return;
      const held = new Set<string>();
      const press = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (latest.current.paused || target.closest("input,textarea,select,button,a,[role=dialog]")) return;
        const key = event.key.toLowerCase();
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "e"].includes(key)) {
          event.preventDefault(); held.add(key);
          if (key === "e" && !event.repeat) controls.current.interact = true;
        }
      };
      const release = (event: KeyboardEvent) => { held.delete(event.key.toLowerCase()); };
      const clear = () => { held.clear(); controls.current.x = 0; controls.current.y = 0; controls.current.interact = false; };
      window.addEventListener("keydown", press); window.addEventListener("keyup", release);
      window.addEventListener("blur", clear); document.addEventListener("visibilitychange", clear);
      cleanupKeys = () => { window.removeEventListener("keydown", press); window.removeEventListener("keyup", release); window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", clear); };
      class Cavern extends Phaser.Scene {
        player!: Phaser.GameObjects.Sprite;
        adventurer!: AdventurerAnimation;
        shadow!: Phaser.GameObjects.Ellipse;
        glow!: Phaser.GameObjects.Image;
        book?: Phaser.GameObjects.Image;
        bookGlow?: Phaser.GameObjects.Image;
        portal?: Phaser.GameObjects.Image;
        summoningRing?: Phaser.GameObjects.Graphics;
        summoningGlow?: Phaser.GameObjects.Image;
        sparks!: Phaser.GameObjects.Graphics;
        waterfall?: Phaser.GameObjects.Graphics;
        waterTexture?: Phaser.Textures.CanvasTexture;
        waterSurface?: Phaser.GameObjects.Image;
        waterFrameTime = -100;
        minion?: Phaser.GameObjects.Image;
        minionGlow?: Phaser.GameObjects.Image;
        fairy?: Phaser.GameObjects.Image;
        fairyGlow?: Phaser.GameObjects.Image;
        fairyNear = false;
        towerGlow?: Phaser.GameObjects.Image;
        towerGlints?: Phaser.GameObjects.Graphics;
        television?: Phaser.GameObjects.Graphics;
        televisionGlow?: Phaser.GameObjects.Image;
        fireflies: {glow:Phaser.GameObjects.Image;core:Phaser.GameObjects.Arc;x:number;y:number}[] = [];
        cornerLights: Phaser.GameObjects.Image[] = [];
        crystalCores: Phaser.GameObjects.Image[] = [];
        lanternCores: Phaser.GameObjects.Image[] = [];
        motes: Phaser.GameObjects.Arc[] = [];
        landmarkGlows: Phaser.GameObjects.Image[] = [];
        lanternGlows: Phaser.GameObjects.Image[] = [];
        position = {x:768,y:secret ? 655 : 690};
        facing = 0; snapshotTime = 0;
        preload() {
          this.load.image("cavern", secret ? "/api/secret/art" : "/assets/cavern.webp");
          this.load.spritesheet("adventurer", "/assets/adventurer.png", { frameWidth: 64, frameHeight: 64 });
          if (!secret) {
            this.load.image("secret-book", "/assets/secret-book.png");
            this.load.image("quest-board", "/assets/quest-board.png");
          }
          else {
            for(const asset of new Set(chamberCorners.map(corner=>corner.asset)))this.load.image(asset,`/assets/${asset}.png`);
            this.load.image("caster-minion","/assets/caster-minion.png");
            this.load.image("purple-orb-fairy","/assets/purple-orb-fairy.png");
          }
          this.load.on("loaderror", () => latest.current.onError());
        }
        create() {
          if (!this.textures.exists("cavern") || !this.textures.exists("adventurer")) return;
          this.add.image(0, 0, "cavern").setOrigin(0).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
          const makeLight = (key:string, color:string) => {
            const texture = this.textures.createCanvas(key,256,256);
            if (!texture) return;
            const gradient = texture.context.createRadialGradient(128,128,0,128,128,128);
            gradient.addColorStop(0,`${color},0.65)`);gradient.addColorStop(0.3,`${color},0.28)`);gradient.addColorStop(1,`${color},0)`);
            texture.context.fillStyle=gradient;texture.context.fillRect(0,0,256,256);texture.refresh();
          };
          makeLight("torch-light","rgba(172,87,255");makeLight("lantern-light","rgba(255,167,74");
          if (!secret) {
            this.add.image(QUEST_BOARD.x,QUEST_BOARD.y,"quest-board").setOrigin(0.5,1).setDisplaySize(QUEST_BOARD.width,QUEST_BOARD.height).setDepth(QUEST_BOARD.y);
            this.summoningGlow=this.add.image(768,690,"torch-light").setDisplaySize(310,170).setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.55);
            const ring=this.add.graphics();
            ring.lineStyle(7,0x984cea,0.12);ring.strokeCircle(0,0,111);
            ring.lineStyle(2,0xd5a4ff,0.85);ring.strokeCircle(0,0,111);
            ring.lineStyle(1.3,0xa66be6,0.72);ring.strokeCircle(0,0,101);ring.strokeCircle(0,0,80);
            for(let i=0;i<12;i++){
              const angle=i*Math.PI/6;
              const x=Math.cos(angle)*94,y=Math.sin(angle)*94;
              ring.lineStyle(1.5,0xe1b6ff,0.8);ring.strokePoints([{x,y:y-4},{x:x+3,y},{x,y:y+4},{x:x-3,y}],true);
              ring.lineBetween(Math.cos(angle)*117,Math.sin(angle)*117,Math.cos(angle)*123,Math.sin(angle)*123);
            }
            const corners=Array.from({length:6},(_,i)=>({x:Math.cos(i*Math.PI/3)*72,y:Math.sin(i*Math.PI/3)*72}));
            ring.lineStyle(1.3,0xb784ed,0.62);ring.strokePoints([corners[0],corners[2],corners[4]],true);ring.strokePoints([corners[1],corners[3],corners[5]],true);
            ring.lineStyle(1,0xd7aaff,0.45);ring.strokeCircle(0,0,39);
            this.add.container(768,690,[ring]).setScale(1,0.48);
            this.summoningRing=ring;
          }
          if(secret){
            this.minion=this.add.image(492,367,"caster-minion").setOrigin(0.5,1).setDisplaySize(62,85).setDepth(367);
            this.minionGlow=this.add.image(475,309,"torch-light").setDisplaySize(70,80).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(369);
            for(const corner of chamberCorners){
              this.add.image(corner.artX,corner.artY,corner.asset).setOrigin(0.5,1).setDisplaySize(corner.width,corner.height).setDepth(corner.artY);
              this.cornerLights.push(this.add.image(corner.artX,corner.artY-corner.height*0.65,"torch-light").setDisplaySize(180,180).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(corner.artY+1));
            }
            this.towerGlow=this.add.image(341,183,"torch-light").setDisplaySize(105,130).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(366);
            this.towerGlints=this.add.graphics().setDepth(366);
            this.television=this.add.graphics().setDepth(366);
            this.televisionGlow=this.add.image(1198,249,"torch-light").setDisplaySize(80,74).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(366);
            this.fairyGlow=this.add.image(768,171,"torch-light").setDisplaySize(105,87).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1001);
            this.fairy=this.add.image(768,171,"purple-orb-fairy").setDisplaySize(54,40).setDepth(1002);
            const water=this.textures.createCanvas("chamber-water",chamberWater.width,chamberWater.height);
            if(water){this.waterTexture=water;this.waterSurface=this.add.image(chamberWater.x,chamberWater.y,"chamber-water").setOrigin(0);}
            this.waterfall=this.add.graphics();
            for(const point of chamberCrystals)this.crystalCores.push(this.add.image(point.x,point.y,"torch-light").setDisplaySize(72,100).setBlendMode(Phaser.BlendModes.SCREEN));
          }
          const effects = secret ? chamberCrystals.map(point=>({glowX:point.x,glowY:point.y})) : landmarks;
          for (const l of effects) this.landmarkGlows.push(this.add.image(l.glowX,l.glowY,"torch-light").setDisplaySize(340,290).setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.26));
          const lanterns = secret ? chamberLanterns : [[1205,132],[1352,198],[71,193],[278,763]];
          for (const [x,y] of lanterns) this.lanternGlows.push(this.add.image(x,y,"lantern-light").setDisplaySize(105,120).setBlendMode(Phaser.BlendModes.SCREEN));
          if(secret)for(const [x,y] of chamberLanterns)this.lanternCores.push(this.add.image(x,y,"lantern-light").setDisplaySize(28,38).setBlendMode(Phaser.BlendModes.SCREEN));
          if (!secret) {
            this.bookGlow = this.add.image(SECRET_BOOK.x,SECRET_BOOK.y,"torch-light").setDisplaySize(140,100).setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.4);
            this.book = this.add.image(SECRET_BOOK.x,SECRET_BOOK.y-18,"secret-book").setDisplaySize(88,54).setRotation(Math.PI);
            // Rotate the existing painted vortex inside a fixed elliptical opening.
            const core = this.textures.createCanvas("portal-core",128,128);
            if (core) {
              const ctx=core.context;
              ctx.save();ctx.beginPath();ctx.arc(64,64,62,0,Math.PI*2);ctx.clip();
              ctx.drawImage(this.textures.get("cavern").getSourceImage() as HTMLImageElement,1328,737,74,107,0,0,128,128);
              ctx.restore();core.refresh();
              this.portal=this.add.image(0,0,"portal-core").setDisplaySize(74,74).setAlpha(0.84);
              this.add.container(1365,790,[this.portal]).setScale(1,1.44);
            }
          }
          this.sparks=this.add.graphics();
          this.glow=this.add.image(768,610,"torch-light").setDisplaySize(360,310).setBlendMode(Phaser.BlendModes.SCREEN);
          this.shadow=this.add.ellipse(this.position.x,this.position.y,45,15,0x08040e,0.5);
          this.player=this.add.sprite(this.position.x,this.position.y,"adventurer",0).setOrigin(0.5,60/64).setScale(1.65);
          this.adventurer=new AdventurerAnimation(this,this.player);
          for(let i=0;i<32;i++) this.motes.push(this.add.circle(220+(i*197%1100),180+(i*127%680),i%3===0?2:1,0xc79aef,0.28));
          for(let i=0;i<28;i++){
            const angle=i*Math.PI*2/28;
            const x=768+Math.cos(angle)*(secret?586:654),y=(secret?465:510)+Math.sin(angle)*(secret?325:363);
            const glow=this.add.image(x,y,i%3===0?"torch-light":"lantern-light").setDisplaySize(23,23).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1000);
            const core=this.add.circle(x,y,i%4===0?1.9:1.25,i%3===0?0xe5c7ff:0xffe6a6).setDepth(1001);
            this.fireflies.push({glow,core,x,y});
          }
          this.cameras.main.setBackgroundColor("#0b0810");this.resizeCamera();this.scale.on("resize",this.resizeCamera,this);
          latest.current.onReady();
        }
        resizeCamera() {
          const camera=this.cameras.main;
          const fit=Math.min(this.scale.width/WORLD_WIDTH,this.scale.height/WORLD_HEIGHT);
          camera.setZoom(Math.max(fit,this.scale.width<650?0.7:0.5));
          if(this.scale.width<650){camera.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);camera.startFollow(this.shadow,true,0.09,0.09);}
          else{camera.stopFollow();camera.removeBounds();camera.centerOn(WORLD_WIDTH/2,WORLD_HEIGHT/2);}
        }
        update(time:number,delta:number) {
          if(!this.player) return;
          if(latest.current.paused){held.clear();controls.current.interact=false;return;}
          if(controls.current.reset){this.position={x:768,y:secret?655:690};controls.current.reset=false;latest.current.onMove();}
          let dx=controls.current.x+(held.has("d")||held.has("arrowright")?1:0)-(held.has("a")||held.has("arrowleft")?1:0);
          let dy=controls.current.y+(held.has("s")||held.has("arrowdown")?1:0)-(held.has("w")||held.has("arrowup")?1:0);
          const length=Math.hypot(dx,dy), motion=!latest.current.reducedMotion;
          const previous={...this.position};
          if(length>0){
            latest.current.onMove();dx/=length;dy/=length;
            const distance=235*Math.min(delta,40)/1000;
            if(secret){
              const walkable=isChamberWalkable;
              let {x,y}=this.position;
              if(walkable(x+dx*distance,y))x+=dx*distance;
              if(walkable(x,y+dy*distance))y+=dy*distance;
              this.position={x,y};
            } else this.position=movePlayer(this.position.x,this.position.y,dx*distance,dy*distance);
            this.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
          }
          const distanceMoved=Math.hypot(this.position.x-previous.x,this.position.y-previous.y);
          const {bob,flameX,flameY}=this.adventurer.update(this.position.x,this.position.y,this.facing,distanceMoved,time,motion);
          this.shadow.setDepth(this.position.y-1);
          this.glow.setDepth(this.position.y+1);
          this.shadow.setPosition(this.position.x,this.position.y-1).setScale(1-bob*0.025);
          this.glow.setPosition(flameX,flameY);
          this.glow.setAlpha(motion?0.74+Math.sin(time/109)*0.05+Math.sin(time/263)*0.08:0.8);
          const closest=!secret?landmarks.map(l=>({id:l.id,distance:Math.hypot(l.x-this.position.x,l.y-this.position.y)})).sort((a,b)=>a.distance-b.distance)[0]:null;
          const nearby=closest&&closest.distance<180?closest.id:null;
          if(this.minion)this.minion.y=367-(motion?(1-Math.cos(time/430))*1.5:0);
          if(this.minionGlow)this.minionGlow.setAlpha(motion?0.55+Math.sin(time/420)*0.12:0.55);
          const chamberNear=secret?nearbyChamberCorner(this.position.x,this.position.y):null;
          this.cornerLights.forEach((light,i)=>{
            const corner=chamberCorners[i];
            const proximity=Math.max(0,1-Math.hypot(corner.x-this.position.x,corner.y-this.position.y)/240);
            light.setAlpha((motion?0.30+Math.sin(time/1300+i)*0.08:0.30)+proximity*0.55);
          });
          if(this.towerGlow){
            const pulse=motion?(1+Math.sin(time/900))/2:0.5;
            this.towerGlow.setAlpha(0.48+pulse*0.42+(chamberNear==="league"?0.2:0)).setDisplaySize(92+pulse*18,117+pulse*18);
            this.towerGlints?.clear();
            for(let i=0;i<3;i++){
              const angle=(motion?time/2100:0)+i*Math.PI*2/3;
              const x=341+Math.cos(angle)*22,y=187+Math.sin(angle)*12;
              this.towerGlints?.fillStyle(0xeacbff,0.45+pulse*0.3).fillRect(x,y,2,2);
            }
          }
          if(this.television){
            // Scan lines stay inside the perspective of the painted CRT glass.
            this.television.clear();
            this.television.fillStyle(0xd4a2ff,motion?0.1+(1+Math.sin(time/1300))*0.035:0.12);
            this.television.fillPoints([{x:1185,y:235},{x:1209,y:242},{x:1209,y:265},{x:1185,y:259}],true);
            if(motion)for(let i=0;i<3;i++){
              const progress=(time/3600+i/3)%1;
              this.television.lineStyle(1,0xeedbff,0.24*(1-Math.abs(progress-0.5)));
              this.television.lineBetween(1186,236+progress*22,1208,243+progress*21);
            }
            this.televisionGlow?.setAlpha(motion?0.48+Math.sin(time/1400)*0.12:0.48);
          }
          if(this.fairy&&this.fairyGlow){
            const x=768+(motion?Math.sin(time/2300)*78:0),y=171+(motion?Math.sin(time/1150)*22:0);
            this.fairy.setPosition(x,y).setDisplaySize(motion?51+Math.sin(time/85)*3:54,40).setRotation(motion?Math.sin(time/2300)*0.09:0);
            this.fairyGlow.setPosition(x,y+2).setAlpha(motion?0.65+Math.sin(time/570)*0.13:0.65);
            const distance=Math.hypot(this.position.x-768,this.position.y-205);
            this.fairyNear=distance<(this.fairyNear?165:140);
          }
          this.fireflies.forEach((fly,i)=>{
            const phase=motion?time/(1450+i*29):0;
            const x=fly.x+Math.sin(phase+i*2.1)*17,y=fly.y+Math.cos(phase*0.73+i)*12;
            const alpha=motion?0.28+(1+Math.sin(time/(800+i*31)+i))*0.29:0.45;
            fly.glow.setPosition(x,y).setAlpha(alpha*0.9);
            fly.core.setPosition(x,y).setAlpha(alpha);
          });
          this.landmarkGlows.forEach((light,i)=>{
            const target=secret?0:Math.max(0,1-Math.hypot(landmarks[i].x-this.position.x,landmarks[i].y-this.position.y)/260);
            const base=secret?(motion?0.30+Math.sin(time/(1500+i*31)+i)*0.12:0.3):(motion?0.20+Math.sin(time/1200+i)*0.06:0.2);
            light.setAlpha(base+target*0.95).setDisplaySize(secret?195:340+target*120,secret?235:290+target*95);
          });
          this.lanternGlows.forEach((light,i)=>{
            const base=secret?0.52:0.45;
            const flicker=secret?Math.sin(time/(93+i*13))*0.12+Math.sin(time/(171+i*17))*0.1:Math.sin(time/(70+i*13))*0.08+Math.sin(time/(173+i*17))*0.1;
            light.setAlpha(motion?base+flicker:base);
          });
          this.lanternCores.forEach((light,i)=>light.setAlpha(motion?0.7+Math.sin(time/(83+i*13))*0.15+Math.sin(time/(159+i*17))*0.08:0.7));
          this.crystalCores.forEach((light,i)=>light.setAlpha(motion?0.55+Math.sin(time/(1350+i*31)+i)*0.17:0.55));
          if(this.waterTexture&&this.waterSurface){
            this.waterSurface.setVisible(motion);
            if(motion&&time-this.waterFrameTime>50){
              paintChamberWater(this.waterTexture.context,this.textures.get("cavern").getSourceImage() as HTMLImageElement,time);
              this.waterTexture.refresh();this.waterFrameTime=time;
            }
          }
          if(this.waterfall){
            this.waterfall.clear();
            if(motion)for(let i=0;i<8;i++){
              const y=29+(time/(21+i%3*5)+i*8)%55;
              this.waterfall.lineStyle(i%3===0?2:1,0xe5c5ff,0.28+Math.sin(time/470+i)*0.08);
              this.waterfall.lineBetween(753+i*4.3,y,753+i*4.3,Math.min(89,y+8+i%3*3));
            }
          }
          if(this.portal&&motion)this.portal.setRotation(time/3200);
          if(this.summoningRing){this.summoningRing.setRotation(motion?time/42000:0).setAlpha(motion?0.7+Math.sin(time/1500)*0.12:0.75);}
          if(this.summoningGlow)this.summoningGlow.setAlpha(motion?0.45+Math.sin(time/1500)*0.08:0.45);
          const bookNear=!secret&&Math.hypot(SECRET_BOOK.x-this.position.x,SECRET_BOOK.y-this.position.y)<SECRET_BOOK.radius;
          if(this.book)this.book.y=SECRET_BOOK.y-18+(motion?Math.sin(time/650)*3:0);
          if(this.bookGlow)this.bookGlow.setAlpha(bookNear?0.95:0.36);
          // Small mineral glints, never a full-screen flash.
          this.sparks.clear();
          const glints=secret?chamberCrystals.map(point=>[point.x,point.y-20]):[[1174,85],[1078,183],[1504,146],[179,212],[1484,670]];
          glints.forEach(([x,y],i)=>{
            const alpha=motion?Math.max(0,Math.sin(time/790+i*2.3))**10*0.7:0.1;
            this.sparks.lineStyle(1.5,0xead6ff,alpha);this.sparks.lineBetween(x-5,y,x+5,y);this.sparks.lineBetween(x,y-7,x,y+7);
          });
          this.motes.forEach((mote,i)=>{mote.setVisible(motion);if(motion){mote.y=180+((i*127+time/50)%680);mote.setAlpha(0.1+(Math.sin(time/900+i)+1)*0.1);}});
          const exitNear=secret&&Math.hypot(this.position.x-768,this.position.y-680)<125;
          if(controls.current.interact){controls.current.interact=false;if(bookNear)latest.current.onBook();else if(chamberNear)latest.current.onChamber(chamberNear);else if(exitNear)latest.current.onLeave();else if(nearby)latest.current.onInteract(nearby);}
          if(time-this.snapshotTime>40){
            this.snapshotTime=time;const cam=this.cameras.main;
            const project=(x:number,y:number)=>({x:(x-cam.worldView.x)*cam.zoom,y:(y-cam.worldView.y)*cam.zoom});
            latest.current.onUpdate({fairyNear:this.fairyNear,fairyPoint:this.fairy?project(this.fairy.x,this.fairy.y-27):undefined,player:{...this.position},nearby,bookNear,exitNear,chamberNear,chamberMarkers:secret?chamberCorners.map(corner=>({id:corner.id,...project(corner.artX,corner.labelY)})):[],bookPoint:secret?undefined:project(SECRET_BOOK.x,SECRET_BOOK.y-18),markers:secret?[]:landmarks.map(l=>({id:l.id,...project(l.labelX??l.x,(l.labelY??l.y)+22)}))});
          }
        }
      }
      game=new Phaser.Game({type:Phaser.AUTO,parent:host.current,backgroundColor:"#0b0810",width:host.current.clientWidth,height:host.current.clientHeight,pixelArt:true,antialias:false,banner:false,audio:{noAudio:true},scene:Cavern,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH}});
      game.canvas.setAttribute("aria-hidden","true");
      observer=new ResizeObserver(()=>{if(host.current&&game)game.scale.resize(host.current.clientWidth,host.current.clientHeight);});observer.observe(host.current);
    }).catch(()=>{if(!disposed)latest.current.onError();});
    return()=>{disposed=true;cleanupKeys();observer?.disconnect();game?.destroy(true);};
  },[controls,secret]);
  return <div ref={host} className="game-canvas" />;
}
