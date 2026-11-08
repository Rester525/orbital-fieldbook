// Pure, dependency-free educational models. SI outputs unless documented.
function number(value,name,min,max) {
  if (!Number.isFinite(value) || value<min || value>max) throw new RangeError(`${name} must be finite in [${min}, ${max}]`);
}
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
// Fraction of a unit stellar disk covered by a disk of radius r.
function overlap(d,r) {
  if (d>=1+r) return 0;
  if (d<=Math.abs(1-r)) return Math.min(1,r*r);
  const a=Math.acos(clamp((d*d+1-r*r)/(2*d),-1,1));
  const b=Math.acos(clamp((d*d+r*r-1)/(2*d*r),-1,1));
  const lens=Math.sqrt(Math.max(0,(-d+1+r)*(d+1-r)*(d-1+r)*(d+1+r)))/2;
  return clamp((a+r*r*b-lens)/Math.PI,0,1);
}
export function transitCurve({starRadius,planetRadius,inclination,period,stellarMass,samples=401}) {
  number(starRadius,'starRadius (solar)',1e-4,1000);
  number(planetRadius,'planetRadius (solar)',1e-6,100);
  number(inclination,'inclination (degrees)',0,180);
  number(period,'period (days)',1e-3,1e6);
  number(stellarMass,'stellarMass (solar)',1e-3,1000);
  number(samples,'samples',5,10000);
  if (!Number.isInteger(samples)) throw new RangeError('samples must be an integer');
  const semiMajorAxisAU=Math.cbrt(stellarMass*(period/365.25)**2);
  const orbit=semiMajorAxisAU*149597870700/695700000/starRadius;
  if (orbit<=1+planetRadius/starRadius) throw new RangeError('Orbit must lie outside both disks');
  const cosI=Math.cos(inclination*Math.PI/180);
  const impactParameter=Math.abs(orbit*cosI);
  const ratio=planetRadius/starRadius;
  const points=Array.from({length:samples},(_,i)=>{
    const time=2*period*i/(samples-1);
    const phase=2*Math.PI*(time/period-0.5);
    const separation=orbit*Math.hypot(Math.sin(phase),cosI*Math.cos(phase));
    return {time,flux:1-(Math.cos(phase)>0 ? overlap(separation,ratio) : 0)};
  });
  return {samples:points,depth:overlap(impactParameter,ratio),impactParameter,semiMajorAxisAU,period};
}
export function radiation({distance,luminosity,albedo}) {
  number(distance,'distance (AU)',1e-6,1e6);
  number(luminosity,'luminosity (solar)',1e-9,1e9);
  number(albedo,'albedo',0,1);
  const relativeFlux=luminosity / distance ** 2;
  const flux=1361 * relativeFlux;
  return {flux,relativeFlux,temperature:(flux*(1-albedo)/(4*5.670374419e-8))**0.25};
}
