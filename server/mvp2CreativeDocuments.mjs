import {promises as fs} from "node:fs";
import path from "node:path";

export class CreativeDocumentStore{
 constructor(filePath){this.filePath=filePath;this.db={version:1,documents:{}};this.loaded=false;this.writeQueue=Promise.resolve();}
 async load(){if(this.loaded)return this;try{this.db=JSON.parse(await fs.readFile(this.filePath,"utf8"));}catch(error){if(error?.code!=="ENOENT")throw error;await fs.mkdir(path.dirname(this.filePath),{recursive:true});await this.persist();}this.db.documents ||= {};this.loaded=true;return this;}
 async persist(){await fs.mkdir(path.dirname(this.filePath),{recursive:true});const payload=JSON.stringify(this.db),temp=`${this.filePath}.tmp`;this.writeQueue=this.writeQueue.then(async()=>{await fs.writeFile(temp,payload,{mode:0o600});await fs.rename(temp,this.filePath)});return this.writeQueue;}
 get(campaignId){return this.db.documents[campaignId]||null;}
 async set(campaignId,creativeDocument){this.db.documents[campaignId]=creativeDocument;await this.persist();return creativeDocument;}
 async remove(campaignId){delete this.db.documents[campaignId];await this.persist();}
}
