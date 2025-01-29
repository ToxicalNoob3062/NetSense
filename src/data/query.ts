import { openDB, IDBPDatabase, DBSchema, IDBPObjectStore } from "idb";

// Use fake-indexeddb in Node.js environment
if (typeof indexedDB === "undefined") {
  const {
    indexedDB,
    IDBKeyRange,
    IDBRequest,
    IDBTransaction,
    IDBCursor,
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
  } = require("fake-indexeddb");
  global.indexedDB = indexedDB;
  global.IDBKeyRange = IDBKeyRange;
  global.IDBRequest = IDBRequest;
  global.IDBTransaction = IDBTransaction;
  global.IDBCursor = IDBCursor;
  global.IDBDatabase = IDBDatabase;
  global.IDBObjectStore = IDBObjectStore;
  global.IDBIndex = IDBIndex;
}

export type TopLink = {
  website: string;
  created: Date;
  sublinks: string[];
};

export type Sublink = {
  composite: string;
  url: string;
  created: Date;
  logging: boolean;
  scripts: string[];
};

export type Script = {
  created: Date;
  name: string;
  content: string;
};

interface DatabaseSchema extends DBSchema {
  toplinks: {
    key: string;
    value: TopLink;
  };
  sublinks: {
    key: string;
    value: Sublink;
  };
  scripts: {
    key: string;
    value: Script;
  };
}

export class Database {
  dbPromise: Promise<IDBPDatabase<DatabaseSchema>>;

  constructor(name: string) {
    this.dbPromise = openDB<DatabaseSchema>(name, 1, {
      upgrade(db) {
        db.createObjectStore("toplinks", {
          keyPath: "website",
          autoIncrement: false,
        });
        db.createObjectStore("sublinks", {
          keyPath: "composite",
          autoIncrement: false,
        });
        db.createObjectStore("scripts", {
          keyPath: "name",
          autoIncrement: false,
        });
      },
    });
  }

  async query(
    storeNames: ("toplinks" | "sublinks" | "scripts")[],
    q: (stores: {
      [K in "toplinks" | "sublinks" | "scripts"]: IDBPObjectStore<
        DatabaseSchema,
        ("toplinks" | "sublinks" | "scripts")[],
        "toplinks" | "sublinks" | "scripts",
        "readwrite"
      >;
    }) => Promise<any>
  ) {
    const db = await this.dbPromise;
    const tx = db.transaction(storeNames, "readwrite");
    const stores = storeNames.reduce(
      (acc, storeName) => {
        acc[storeName] = tx.objectStore(storeName);
        return acc;
      },
      {} as {
        [K in "toplinks" | "sublinks" | "scripts"]: IDBPObjectStore<
          DatabaseSchema,
          ("toplinks" | "sublinks" | "scripts")[],
          "toplinks" | "sublinks" | "scripts",
          "readwrite"
        >;
      }
    );
    let output = await q(stores);
    await tx.done;
    return output;
  }
}

export class TopLink_Queries {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAll() {
    return this.db.query(["toplinks"], async (stores) => {
      return stores.toplinks.getAll();
    }) as Promise<TopLink[]>;
  }

  async add(website: string) {
    return this.db.query(["toplinks"], async (stores) => {
      return stores.toplinks.add({
        website,
        created: new Date(),
        sublinks: [],
      });
    });
  }

  async remove(website: string) {
    return this.db.query(["sublinks", "toplinks"], async (stores) => {
      //delete all sublinksunder it first
      const tld = (await stores.toplinks.get(website)) as TopLink | undefined;
      if (!tld) throw new Error(`TLD with website ${website} not found`);
      await Promise.all(
        tld.sublinks.map((sublink) =>
          stores.sublinks.delete(`${website}_${sublink}`)
        )
      );
      return stores.toplinks.delete(website);
    });
  }

  async get(website: string) {
    return this.db.query(["toplinks"], async (stores) => {
      return stores.toplinks.get(website);
    }) as Promise<TopLink>;
  }
}

export class Sublink_Queries {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // Get all sublinks of a TLD
  async getAll(website: string, urls: string[]) {
    return this.db.query(["sublinks"], async (stores) => {
      return Promise.all(
        urls.map((url) => stores.sublinks.get(`${website}_${url}`))
      );
    }) as Promise<Sublink[]>;
  }

  // Add or update sublink entry in the sublink store and remember to add sublink URL to the TLD sublinks array
  async add(tld: TopLink, url: string) {
    return this.db.query(["sublinks", "toplinks"], async (stores) => {
      const created = new Date();
      const composite = `${tld.website}_${url}`;
      tld.sublinks.push(url);
      await stores.toplinks.put(tld);
      return stores.sublinks.add({
        url,
        composite,
        created,
        logging: false,
        scripts: [],
      });
    });
  }

  // remove a sublink from the sublink store and remember to remove the sublink URL from the TLD sublinks array
  async remove(tld: TopLink, url: string) {
    return this.db.query(["sublinks", "toplinks"], async (stores) => {
      const composite = `${tld.website}_${url}`;
      tld.sublinks = tld.sublinks.filter((sublink) => sublink !== url);
      await stores.toplinks.put(tld);
      return stores.sublinks.delete(composite);
    });
  }
}

// //remove a sublink from the sublink store and remember to remove the sublink URL from the TLD sublinks array
// async deleteSublink(website: string, url: string) {
//   const db = await this.db.getDB();
//   const tx = db.transaction(["sublinks", "tlds"], "readwrite");
//   const sublinkStore = tx.objectStore("sublinks");
//   const tldStore = tx.objectStore("tlds");

//   try {
//     // Update the TLD's sublinks array
//     const tld = await tldStore.get(website);
//     if (!tld) {
//       console.error(`TLD with website ${website} not found`);
//       tx.abort();
//       return null;
//     }
//     tld.sublinks = tld.sublinks.filter((sublink) => sublink !== url);
//     await tldStore.put(tld);

//     // Remove the sublink entry from the sublink store
//     await sublinkStore.delete(`${website}_${url}`);

//     await tx.done;
//     return this.getSublinks(website, tld.sublinks);
//   } catch (error) {
//     console.error("Failed to delete Sublink:", error);
//     tx.abort();
//     return null;
//   }
// }

// //get single sublink
// async getSublink(composite: string) {
//   const db = await this.db.getDB();
//   const tx = db.transaction("sublinks");
//   const store = tx.objectStore("sublinks");
//   try {
//     const sublink = await store.get(composite);
//     await tx.done;
//     return sublink;
//   } catch (error) {
//     tx.abort();
//     console.error("Failed to get Sublink:", error);
//     return null;
//   }
// }

// add script to sublink
// async addScriptToSublink(sublink: Sublink, script: string) {
//   const db = await this.db.getDB();
//   const tx = db.transaction("sublinks", "readwrite");
//   const store = tx.objectStore("sublinks");
//   try {
//     sublink.scripts.push(script);
//     await store.put(sublink);
//     await tx.done;
//     return sublink;
//   } catch (error) {
//     console.error("Failed to add Script to Sublink:", error);
//     tx.abort();
//     return null;
//   }
// }

// // remove script from sublink
// async removeScriptFromSublink(sublink: Sublink, script: string) {
//   const db = await this.db.getDB();
//   const tx = db.transaction("sublinks", "readwrite");
//   const store = tx.objectStore("sublinks");
//   try {
//     sublink.scripts = sublink.scripts.filter((s) => s !== script);
//     await store.put(sublink);
//     await tx.done;
//     return sublink;
//   } catch (error) {
//     console.error("Failed to remove Script from Sublink:", error);
//     tx.abort();
//     return null;
//   }
// }

export class Script_Queries {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async add(name: string) {
    return this.db.query(["scripts"], async (stores) => {
      return stores.scripts.add({
        name,
        created: new Date(),
        content: "",
      });
    });
  }

  async remove(name: string) {
    return this.db.query(["scripts"], async (stores) => {
      return stores.scripts.delete(name);
    });
  }

  async getAll() {
    return this.db.query(["scripts"], async (stores) => {
      return await stores.scripts.getAll();
    }) as Promise<Script[]>;
  }

  async get(name: string) {
    return this.db.query(["scripts"], async (stores) => {
      return stores.scripts.get(name);
    }) as Promise<Script>;
  }
}
