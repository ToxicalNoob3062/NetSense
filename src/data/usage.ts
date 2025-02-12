import {
  Database,
  TopLink_Queries,
  Sublink_Queries,
  EndPoint_Queries,
} from "./query";

const db = new Database("pgdata");
export const topLinkQueries = new TopLink_Queries(db);
export const sublinkQueries = new Sublink_Queries(db);
export const endpointQueries = new EndPoint_Queries(db);
export const settingsQueries = db.settings;
