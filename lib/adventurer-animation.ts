import type Phaser from "phaser";

const SCALE = 1.65;
const TORCH = [
  [[55,22],[54,23],[50,22],[55,22]],
  [[12,18],[13,20],[13,20],[17,20]],
  [[53,20],[51,20],[50,20],[50,19]],
  [[53,16],[54,17],[51,17],[53,17]],
];

// Animate cropped limbs as separate sprites, preserving the original pixel art.
// The sheet's right-facing frames all have the same leading foot.
export class AdventurerAnimation {
  private legs: Phaser.GameObjects.Sprite[];
  private flame: Phaser.GameObjects.Graphics;
  private stride = 0;

  constructor(scene: Phaser.Scene, private body: Phaser.GameObjects.Sprite) {
    this.legs = [0,1].map(() => scene.add.sprite(0,0,"adventurer").setScale(SCALE));
    this.flame = scene.add.graphics().setScale(SCALE);
  }

  update(x:number, y:number, facing:number, distance:number, time:number, motion:boolean) {
    const walking = distance > 0.01;
    this.stride = walking ? (this.stride + distance * Math.PI * 2 / 120) % (Math.PI * 2) : 0;
    const step = Math.sin(this.stride);
    const rigged = !walking || facing === 0 || facing === 2;
    const frame = rigged ? 0 : Math.floor(this.stride / (Math.PI / 2));
    const bob = motion ? (walking ? Math.abs(step)*2 : (1-Math.cos(time/270))*2.2) : 0;
    const bodyY = y-bob;
    this.body.setFrame(facing*4+frame).setPosition(x,bodyY).setDepth(y);
    if (rigged) this.body.setCrop(0,0,64,50);
    else this.body.setCrop();

    const side = facing === 1 || facing === 2;
    const legFrame = side ? (facing === 1 ? 4 : 8) : facing === 3 ? 12 : 0;
    const crop = side ? {x:facing===1?20:34,y:48,w:13,h:12} : {x:28,y:50,w:9,h:10};
    this.legs.forEach((leg,index) => {
      leg.setVisible(rigged);
      if (!rigged) return;
      const swing = walking ? (index === 0 ? step : -step) : 0;
      const lift = Math.max(0,swing) * (side ? 2.5 : 1.8);
      const footX = side ? 35+(walking ? swing*6 : index===0?-1:1) : 32+index*7;
      const footY = side ? 48-lift : 49+swing*3;
      leg.setFrame(legFrame).setCrop(crop.x,crop.y,crop.w,crop.h)
        .setOrigin((crop.x+crop.w/2)/64,crop.y/64)
        .setPosition(x+(footX-32)*SCALE,bodyY+(footY-60)*SCALE)
        .setRotation(side ? -swing*0.28 : swing*0.05)
        .setDepth(y-0.2+index*0.1)
        .setTint(index===0 ? 0xa58eaf : 0xffffff);
    });

    const [torchX,torchY] = TORCH[facing][frame];
    const flameX = x+(torchX-32)*SCALE;
    const flameY = bodyY+(torchY-60)*SCALE;
    this.flame.setPosition(flameX,flameY).setDepth(y+0.5).clear();
    // Stepped pixel tongues and rising embers flicker even when the feet stop.
    const tick = motion ? Math.floor(time/90) : 0;
    const sway = motion ? [0,1,0,-1,1,-1][tick%6] : 0;
    const height = motion ? [7,9,6,8,10,7][tick%6] : 7;
    this.flame.fillStyle(0x8c37ed,0.85).fillRect(-3,-4,6,5);
    this.flame.fillStyle(0xbc6bff,0.9).fillRect(-2+sway,-height,3,height-1);
    this.flame.fillStyle(0xe4b3ff,0.95).fillRect(-2,-4,4,5);
    this.flame.fillStyle(0xffe4ff,1).fillRect(-1+sway,-4,2,4);
    if (motion) {
      for(let i=0;i<2;i++) {
        const age = (time/650+i*0.5)%1;
        this.flame.fillStyle(0xe0a2ff,(1-age)*0.8)
          .fillRect(Math.round(Math.sin(time/240+i*3)*3),-10-Math.floor(age*8),1,2);
      }
    }
    return {bob,flameX,flameY};
  }
}
