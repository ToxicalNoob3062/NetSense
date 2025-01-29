import {
  Database,
  TopLink_Queries,
  Sublink_Queries,
  Script_Queries,
} from "./query";

const db = new Database("pgdata");
export const topLinkQueries = new TopLink_Queries(db);
export const sublinkQueries = new Sublink_Queries(db);
export const scriptQueries = new Script_Queries(db);
