import test from 'node:test';
import assert from 'node:assert/strict';
import * as models from '../public/js/models.js';
const baseTransit={starRadius:1,planetRadius:0.1,inclination:90,period:365.25,stellarMass:1,samples:401};
test('central transit has Kepler scale, two dips, and no backside eclipse',()=>{
  const result=models.transitCurve(baseTransit);
  near(result.semiMajorAxisAU,1,0.0001); near(result.depth,0.01); near(result.impactParameter,0,1e-10);
  assert.equal(result.period,365.25); assert.equal(result.samples.length,401);
  for(const i of [0,200,400]) near(result.samples[i].flux,1);
  for(const i of [100,300]) near(result.samples[i].flux,0.99);
  near(result.samples[100].time,baseTransit.period/2);
  near(result.samples[400].time,baseTransit.period*2);
});
test('grazing equal disks use exact circle overlap and inclination misses',()=>{
  const a=models.transitCurve(baseTransit).semiMajorAxisAU*149597870700/695700000;
  const grazing=models.transitCurve({...baseTransit,planetRadius:1,inclination:Math.acos(1/a)*180/Math.PI});
  near(grazing.depth,(2*Math.PI/3-Math.sqrt(3)/2)/Math.PI);
  near(grazing.samples[100].flux,1-grazing.depth);
  const miss=models.transitCurve({...baseTransit,inclination:0});
  near(miss.depth,0); assert.ok(miss.samples.every(p=>p.flux===1));
  near(models.transitCurve({...baseTransit,planetRadius:2}).depth,1);
});
test('transit inputs and allocation are bounded and orbit cannot intersect star',()=>{
  for(const [key,values] of Object.entries({starRadius:[0,-1,Infinity],planetRadius:[0,-1,NaN],inclination:[-1,181,'90'],period:[0,-1,1e-10],stellarMass:[0,-1],samples:[0,1,2.5,10001,Infinity,'401']}))
    for(const value of values) assert.throws(()=>models.transitCurve({...baseTransit,[key]:value}));
  assert.throws(()=>models.transitCurve({...baseTransit,starRadius:1000,period:1}));
  const reverse=models.transitCurve({...baseTransit,inclination:180});
  assert.ok(reverse.samples.every(x=>x.flux===1));
  assert.equal(models.transitCurve({...baseTransit,samples:undefined}).samples.length,401);
});
const near = (a,b,t=1e-8) => assert.ok(Math.abs(a-b)<t, `${a} != ${b}`);
test('radiation applies inverse square flux and full redistribution equilibrium', () => {
  const earth=models.radiation({distance:1,luminosity:1,albedo:0.3});
  near(earth.flux,1361); near(earth.relativeFlux,1); near(earth.temperature,254.578,0.01);
  const far=models.radiation({distance:2,luminosity:1,albedo:0.3});
  near(far.flux,earth.flux/4); near(far.temperature,earth.temperature/Math.sqrt(2));
  near(models.radiation({distance:1,luminosity:1,albedo:1}).temperature,0);
});
test('radiation rejects nonphysical or nonfinite input', () => {
  const base={distance:1,luminosity:1,albedo:0.3};
  for (const [key,values] of Object.entries({distance:[0,-1,NaN,Infinity,'1',1e-300],luminosity:[0,-1,Infinity],albedo:[-0.1,1.1,null]})) {
    for (const value of values) assert.throws(()=>models.radiation({...base,[key]:value}));
  }
  assert.throws(()=>models.radiation());
});
