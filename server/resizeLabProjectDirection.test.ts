import {describe,expect,it} from 'vitest';
import {preserveProjectDirections} from './resizeLabProjects.mjs';
const sourceHash='a'.repeat(64),record={sourceHash,version:1,seal:'immutable',plans:{first:{strategy:'existing plan'}}};
describe('server preservation of project direction records',()=>{
 it('keeps signed decisions when an older client omits the field or sends an empty map',()=>{expect(preserveProjectDirections({[sourceHash]:record},undefined)).toEqual({[sourceHash]:record});expect(preserveProjectDirections({[sourceHash]:record},{})).toEqual({[sourceHash]:record});});
 it('rejects a stale plan subset while accepting a complete new revision record intact',()=>{const newer={...record,seal:'new signature',plans:{...record.plans,second:{strategy:'revised'}}};expect(preserveProjectDirections({[sourceHash]:newer},{[sourceHash]:record})).toEqual({[sourceHash]:newer});expect(preserveProjectDirections({[sourceHash]:record},{[sourceHash]:newer})).toEqual({[sourceHash]:newer});});
 it('does not mutate records, discard another master or rewrite unknown versions',()=>{const otherHash='b'.repeat(64),other={...record,sourceHash:otherHash,version:99};expect(preserveProjectDirections({[sourceHash]:record},{[otherHash]:other})).toEqual({[sourceHash]:record,[otherHash]:other});expect(record.seal).toBe('immutable');});
});
