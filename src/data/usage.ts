import {
  Database,
  TLD_Queries,
  Sublink_Queries,
  Script_Queries,
} from "./query";

const db = new Database("pgdata");
const tld = new TLD_Queries(db);
const sublink = new Sublink_Queries(db);
const script = new Script_Queries(db);

async function main() {
  console.log((await tld.insertTLD("google.com")).rows);
  console.log((await tld.insertTLD("facebook.com")).rows);
  console.log((await tld.insertTLD("twitter.com")).rows);
  const tlds = await tld.getTLDs();
  console.log(tlds.rows);
  console.log((await tld.deleteTLD("facebook.com")).rows);

  //add 2 sublinks to google.com
  console.log(
    (await sublink.insertSublink("google.com", "google.com/search")).rows
  );
  console.log(
    (await sublink.insertSublink("google.com", "google.com/images")).rows
  );

  //search
  console.log((await tld.searchTLD("goo")).rows);

  //make 1 script
  console.log(
    (await script.insertScript("hllo.js", "console.log('hello')")).rows
  );

  //add script to sublink
  console.log(
    (await script.associateScript("google.com", "google.com/search", "hllo.js"))
      .rows
  );

  //print the sublink to see script count
  console.log((await sublink.getSublinks("google.com")).rows);
}

main();
