import {describe,it,expect} from 'vitest';
import {parseDelimited,placementsFromRows} from './deliveryPlan';
describe('real table normalization',()=>{
 it('reads separate dimensions and preserves false rules, URL roles and legal',()=>{
  const rows=parseDelimited('Platform;Placement;Width;Height;Duration;ClickTag;Tracking;Click URL;TT URL;Legal\nClient;ROS;300;250;5;no;false;https://example.test/click;https://example.test/tt;18+');
  const [p]=placementsFromRows(rows,'plan.xlsx');
  expect(p).toMatchObject({width:300,height:250,placement:'ROS',ttUrl:'https://example.test/tt',requirements:{maxDurationSec:5,clickTag:false,tracking:false,clickUrl:'https://example.test/click',legal:'18+'}});
 });
 it('handles quoted multiline legal without splitting the placement',()=>{
  const rows=parseDelimited('Platform,Size,Legal\nClient,300x250,"First line\nSecond line"');
  expect(rows).toHaveLength(2);expect(placementsFromRows(rows,'x')[0].requirements.legal).toBe('First line\nSecond line');
 });
 it('flags unknown bools and missing dimensions rather than inventing or dropping them',()=>{
  const [p]=placementsFromRows([['Platform','Size','Tracking'],['Client','','maybe']],'x');
  expect(p.width).toBe(0);expect(p.requirements.tracking).toBeUndefined();expect(p.reviewIssues?.length).toBeGreaterThan(0);
 });
 it('preserves two equal-size placements and distinct source provenance',()=>{
  const rows=[['Platform','Placement','Size'],['Client','Top','300x250'],['Client','Bottom','300x250']];
  expect(placementsFromRows(rows,'x')).toHaveLength(2);expect(placementsFromRows(rows,'x')[0].id).not.toBe(placementsFromRows(rows,'y')[0].id);
 });
});
