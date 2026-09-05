import {describe,it,expect} from 'vitest';
import {FORMAT_PICKER_GROUPS,formatOptionsHtml,parseFormatValue} from './format-picker.js';
describe('Campaign Setup format picker',()=>{
 it('orders popular formats first',()=>expect(FORMAT_PICKER_GROUPS[0].items).toEqual([[240,400],[300,250],[728,90]]));
 it('separates desktop mobile SSP and special sizes',()=>expect(FORMAT_PICKER_GROUPS.map(g=>g.id)).toEqual(['popular','desktop','mobile','ssp','special']));
 it('renders optgroup separators and manual custom size',()=>{const html=formatOptionsHtml();for(const label of ['Popular / high coverage','Common desktop & display','Mobile & app','Extended SSP / publisher','Special / premium','Custom'])expect(html).toContain(label);expect(html).toContain('Custom size…')});
 it('parses a preset while custom stays manual',()=>{expect(parseFormatValue('240x400')).toEqual({width:240,height:400});expect(parseFormatValue('custom')).toBeNull()});
});
