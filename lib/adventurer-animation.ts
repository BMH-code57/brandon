import type Phaser from "phaser";

const SCALE = 1.65;
const TORCH = [
  [[55,22],[54,23],[50,22],[55,22]],
  [[12,18],[13,20],[13,20],[17,20]],
  [[53,20],[51,20],[50,20],[50,19]],
  [[53,16],[54,17],[51,17],[53,17]],
];

// Both side views share the complete left-facing walk cycle.
// Upright legs stay anchored under the tunic when standing or walking down.
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
    const side = facing === 1 || facing === 2;
    const mirrored = facing === 2;
    const sourceFacing = side ? 1 : facing;
    const rigged = !walking || facing === 0;
    const frame = rigged ? 0 : Math.floor(this.stride / (Math.PI / 2));
    const bob = motion ? (walking ? Math.abs(step)*2 : (1-Math.cos(time/270))*2.2) : 0;
    const bodyY = y-bob;
    this.body.setFrame(sourceFacing*4+frame).setFlipX(mirrored).setPosition(x,bodyY).setDepth(y);
    if (rigged) this.body.setCrop(0,0,64,50);
    else this.body.setCrop();

    // Include the entire shin and upper leg, with four pixels of overlap behind
    // the body. Change the reach from this fixed hip instead of moving a boot
    // away from the hem, which exposed transparent gaps in the previous rig.
    const crop = {x:28,y:44,w:9,h:16};
    this.legs.forEach((leg,index) => {
      leg.setVisible(rigged);
      if (!rigged) return;
      const swing = walking ? (index === 0 ? step : -step) : 0;
      const footX = side ? 27+index*7 : 32+index*7;
      const hipX = mirrored ? 64-footX : footX;
      leg.setFrame(0).setCrop(crop.x,crop.y,crop.w,crop.h)
        .setOrigin((crop.x+crop.w/2)/64,crop.y/64)
        .setPosition(x+(hipX-32)*SCALE,bodyY+(46-60)*SCALE)
        .setScale(SCALE,SCALE*(walking ? 0.875+swing*0.125 : 0.875))
        .setRotation(0)
        .setDepth(y-0.2+index*0.1)
        .setTint(index===0 ? 0xa58eaf : 0xffffff);
    });

    const [sourceTorchX,torchY] = TORCH[sourceFacing][frame];
    const torchX = mirrored ? 64-sourceTorchX : sourceTorchX;
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
