import {describe,it,expect} from 'vitest';
import {createScene,restoreScenes,sceneAt,sequenceDuration,sequenceMarkup} from './resizeLabScenes';
import {defaultMotion} from './resizeLabEditing';
const first={...createScene({headline:'First',subline:'',cta:'Go'},0),duration:1000};
const second={...createScene({headline:'Second',subline:'',cta:'Buy'},1),duration:2000};
describe('banner scenes',()=>{
 it('restores legacy projects without creating or altering scenes',()=>expect(restoreScenes(undefined)).toEqual([]));
 it('keeps scene copies independent',()=>{const copy={headline:'Original',subline:'Sub',cta:'CTA'};const scene=createScene(copy,0);copy.headline='Changed';expect(scene.copy.headline).toBe('Original');expect(scene.motion).not.toBe(defaultMotion)});
 it('normalizes corrupt durations, identifiers and motion before CSS generation',()=>{const scenes=restoreScenes([{id:'<script>',duration:-3,motion:{preset:'invalid',duration:Infinity}},{id:'same'},{id:'same'}]);expect(scenes[0].duration).toBe(500);expect(scenes[0].motion.duration).toBe(600);expect(new Set(scenes.map(s=>s.id)).size).toBe(3);expect(scenes[0].motion.preset).toBe('fade')});
 it('uses ordered durations, handles exact boundaries, end and looping',()=>{expect(sequenceDuration([first,second])).toBe(3000);expect(sceneAt([first,second],999)).toEqual({index:0,localTime:999});expect(sceneAt([first,second],1000)).toEqual({index:1,localTime:0});expect(sceneAt([first,second],4000)).toEqual({index:1,localTime:2000});expect(sceneAt([first,second],3500,true)).toEqual({index:0,localTime:500})});
 it('exports all copies with a shared pausable clock and preserves manual transforms',()=>{const html=sequenceMarkup([first,second],s=>`<div>${s.copy.headline}</div>`,{loop:true,time:1500});expect(html).toContain('First');expect(html).toContain('Second');expect(html).toContain('3000ms linear');expect(html).toContain('--rl-sequence-delay:-1500ms');expect(html).toContain('infinite');expect(html).toContain('animation-play-state:var(--rl-sequence-state)');expect(html).not.toContain('transform:')});
 it('bounds all timing keyframes for scenes shorter than entrance and stagger',()=>{const html=sequenceMarkup([{...first,duration:500,motion:{...first.motion,delay:10000,duration:2000,stagger:400}}],()=>'',{});const percentages=[...html.matchAll(/([\d.]+)%\{/g)].map(m=>Number(m[1]));expect(percentages.every(n=>n>=0&&n<=100)).toBe(true)});
});
