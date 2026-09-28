// Coordinates match the protected chamber artwork in the 1536 by 1024 world.
export const chamberCrystals = [
  {x:130,y:176},{x:254,y:49},{x:441,y:95},{x:657,y:93},
  {x:876,y:63},{x:1148,y:97},{x:1302,y:56},{x:1365,y:148},
  {x:1396,y:282},{x:1400,y:541},{x:1378,y:763},{x:1188,y:899},
  {x:915,y:904},{x:628,y:902},{x:270,y:840},{x:407,y:785},
  {x:103,y:711},{x:84,y:426},
];
export const chamberLanterns = [[178,145],[468,121],[1332,161],[1450,363],[1332,681],[191,667],[660,863],[880,862]];
export const chamberWater = {x:689,y:82,width:166,height:80};
const shoreline = [[729,100],[746,88],[791,88],[812,102],[831,111],[845,112],[849,127],[833,143],[810,153],[784,157],[750,154],[725,149],[707,139],[697,124],[703,110]];

export function paintChamberWater(context:CanvasRenderingContext2D,source:CanvasImageSource,time:number) {
  const {x,y,width,height}=chamberWater;
  context.clearRect(0,0,width,height);
  context.save();context.imageSmoothingEnabled=false;context.beginPath();
  shoreline.forEach(([px,py],i)=>{if(i===0)context.moveTo(px-x,py-y);else context.lineTo(px-x,py-y);});
  context.closePath();context.clip();
  // Refract only pixels already inside the pool, leaving its stone rim still.
  for(let row=0;row<height;row+=2){
    const offset=Math.sin(time/620+row*0.2)*1.4+Math.sin(time/1100-row*0.12)*0.7;
    context.drawImage(source,x+offset,y+row,width,2,0,row,width,2);
  }
  context.strokeStyle='#ead7ff';
  for(let i=0;i<4;i++){
    const phase=((time/2700+i/4)%1);
    context.globalAlpha=Math.sin(phase*Math.PI)*0.32;
    context.lineWidth=1.1;context.beginPath();
    context.ellipse(770-x,100-y+phase*20,7+phase*68,2+phase*22,0,0,Math.PI*2);context.stroke();
  }
  // Short moving highlights make the deeper water shimmer without flashing.
  for(let i=0;i<9;i++){
    const px=714+(i*37%120),py=116+(i*13%36);
    context.globalAlpha=(0.12+Math.sin(time/850+i)*0.1);
    context.beginPath();context.moveTo(px-x,py-y);context.lineTo(px-x+6+Math.sin(time/900+i)*3,py-y);context.stroke();
  }
  context.restore();
}
