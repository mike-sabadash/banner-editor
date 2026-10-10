import {describe,it,expect} from 'vitest';
import {restoreTypeStyle} from './resizeLabTypography';
describe('saved typography migration',()=>{
 it('keeps all legacy text faces visually unchanged until individually edited',()=>{const style=restoreTypeStyle({font:'Montserrat',headlineSize:120});expect(style.headlineFont).toBe('Montserrat');expect(style.sublineFont).toBe('Montserrat');expect(style.ctaFont).toBe('Montserrat');expect(style.headlineSize).toBe(120)});
 it('restores independent fonts ahead of the legacy fallback',()=>{const style=restoreTypeStyle({font:'Montserrat',headlineFont:'Oswald',sublineFont:'Lora',ctaFont:'Inter'});expect([style.headlineFont,style.sublineFont,style.ctaFont]).toEqual(['Oswald','Lora','Inter'])});
 it('does not introduce arbitrary font strings into exported CSS',()=>expect(restoreTypeStyle({headlineFont:'Inter;}</style>'}).headlineFont).toBe('Inter'));
});
