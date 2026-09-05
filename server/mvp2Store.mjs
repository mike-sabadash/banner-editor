import {promises as fs} from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DAY=24*60*60*1000;
const cleanEmail=value=>String(value||"").trim().toLowerCase();
const id=prefix=>`${prefix}_${crypto.randomUUID()}`;
const now=()=>new Date().toISOString();

function hashPassword(password,salt=crypto.randomBytes(16).toString("hex")){
 const hash=crypto.scryptSync(String(password),salt,64).toString("hex");
 return{salt,hash};
}
function verifyPassword(password,user){const next=hashPassword(password,user.passwordSalt).hash;return crypto.timingSafeEqual(Buffer.from(next,"hex"),Buffer.from(user.passwordHash,"hex"));}
function emptyDb(){return{version:1,users:[],workspaces:[],memberships:[],sessions:[],campaigns:[]};}

export class BannermaticStore{
 constructor(filePath){this.filePath=filePath;this.db=emptyDb();this.loaded=false;this.writeQueue=Promise.resolve();}
 async load(){if(this.loaded)return this;try{this.db=JSON.parse(await fs.readFile(this.filePath,"utf8"));}catch(error){if(error?.code!=="ENOENT")throw error;await fs.mkdir(path.dirname(this.filePath),{recursive:true});await this.persist();}this.loaded=true;this.pruneSessions();return this;}
 async persist(){await fs.mkdir(path.dirname(this.filePath),{recursive:true});const payload=JSON.stringify(this.db,null,2),temp=`${this.filePath}.tmp`;this.writeQueue=this.writeQueue.then(async()=>{await fs.writeFile(temp,payload,{mode:0o600});await fs.rename(temp,this.filePath);});return this.writeQueue;}
 pruneSessions(){const cutoff=Date.now();this.db.sessions=this.db.sessions.filter(s=>new Date(s.expiresAt).getTime()>cutoff);}
 publicUser(user){return{id:user.id,email:user.email,name:user.name,createdAt:user.createdAt};}
 membershipFor(userId,workspaceId){return this.db.memberships.find(m=>m.userId===userId&&m.workspaceId===workspaceId);}
 async register({email,password,name}){await this.load();email=cleanEmail(email);if(!email||!email.includes("@"))throw Object.assign(new Error("Valid email required"),{status:400});if(String(password||"").length<8)throw Object.assign(new Error("Password must be at least 8 characters"),{status:400});if(this.db.users.some(u=>u.email===email))throw Object.assign(new Error("Account already exists"),{status:409});const passwordData=hashPassword(password),user={id:id("usr"),email,name:String(name||email.split("@")[0]).slice(0,80),passwordSalt:passwordData.salt,passwordHash:passwordData.hash,createdAt:now()},workspace={id:id("ws"),name:`${user.name}'s workspace`,createdAt:now(),createdBy:user.id};this.db.users.push(user);this.db.workspaces.push(workspace);this.db.memberships.push({id:id("mem"),userId:user.id,workspaceId:workspace.id,role:"owner",createdAt:now()});const session=this.createSession(user.id,workspace.id);await this.persist();return{user:this.publicUser(user),workspace,role:"owner",token:session.token,expiresAt:session.expiresAt};}
 createSession(userId,workspaceId){const session={id:id("ses"),token:crypto.randomBytes(32).toString("base64url"),userId,workspaceId,createdAt:now(),expiresAt:new Date(Date.now()+30*DAY).toISOString()};this.db.sessions.push(session);return session;}
 async login({email,password}){await this.load();email=cleanEmail(email);const user=this.db.users.find(u=>u.email===email);if(!user||!verifyPassword(password,user))throw Object.assign(new Error("Invalid email or password"),{status:401});const membership=this.db.memberships.find(m=>m.userId===user.id);if(!membership)throw Object.assign(new Error("No workspace membership"),{status:403});const workspace=this.db.workspaces.find(w=>w.id===membership.workspaceId),session=this.createSession(user.id,membership.workspaceId);await this.persist();return{user:this.publicUser(user),workspace,role:membership.role,token:session.token,expiresAt:session.expiresAt};}
 async logout(token){await this.load();this.db.sessions=this.db.sessions.filter(s=>s.token!==token);await this.persist();}
 async authenticate(token){await this.load();this.pruneSessions();const session=this.db.sessions.find(s=>s.token===token);if(!session)return null;const user=this.db.users.find(u=>u.id===session.userId),workspace=this.db.workspaces.find(w=>w.id===session.workspaceId),membership=this.membershipFor(session.userId,session.workspaceId);if(!user||!workspace||!membership)return null;return{session,user:this.publicUser(user),workspace,role:membership.role};}
 requireRole(auth,allowed){if(!auth||!allowed.includes(auth.role))throw Object.assign(new Error("Forbidden"),{status:403});}
 listCampaigns(auth){return this.db.campaigns.filter(c=>c.workspaceId===auth.workspace.id).map(c=>({...c})).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));}
 getCampaign(auth,campaignId){const c=this.db.campaigns.find(x=>x.id===campaignId&&x.workspaceId===auth.workspace.id);if(!c)throw Object.assign(new Error("Campaign not found"),{status:404});return{...c};}
 async createCampaign(auth,input){this.requireRole(auth,["owner","admin","designer","producer"]);const created=now(),campaign={id:id("cmp"),workspaceId:auth.workspace.id,name:String(input.name||"Untitled campaign").slice(0,140),status:"draft",locale:input.locale==="ru"?"ru":"en",placements:[],formats:[],creativeVersion:0,mediaPlanVersion:0,ttSnapshotVersion:0,createdAt:created,updatedAt:created,createdBy:auth.user.id};this.db.campaigns.push(campaign);await this.persist();return{...campaign};}
 async updateCampaign(auth,campaignId,input){this.requireRole(auth,["owner","admin","designer","producer"]);const i=this.db.campaigns.findIndex(c=>c.id===campaignId&&c.workspaceId===auth.workspace.id);if(i<0)throw Object.assign(new Error("Campaign not found"),{status:404});const current=this.db.campaigns[i];const next={...current,...input,id:current.id,workspaceId:current.workspaceId,createdAt:current.createdAt,createdBy:current.createdBy,updatedAt:now()};this.db.campaigns[i]=next;await this.persist();return{...next};}
 listMembers(auth){return this.db.memberships.filter(m=>m.workspaceId===auth.workspace.id).map(m=>{const user=this.db.users.find(u=>u.id===m.userId);return{id:m.id,role:m.role,user:user?this.publicUser(user):null}});}
 async updateMemberRole(auth,membershipId,role){this.requireRole(auth,["owner","admin"]);if(!["owner","admin","designer","producer","viewer"].includes(role))throw Object.assign(new Error("Invalid role"),{status:400});const m=this.db.memberships.find(x=>x.id===membershipId&&x.workspaceId===auth.workspace.id);if(!m)throw Object.assign(new Error("Member not found"),{status:404});if(m.role==="owner"&&auth.role!=="owner")throw Object.assign(new Error("Only owner can change owner role"),{status:403});m.role=role;await this.persist();return m;}
}

export const passwordInternals={hashPassword,verifyPassword};
