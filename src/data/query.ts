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
      console.log("website", website);
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

  async get(composite: string) {
    return this.db.query(["sublinks"], async (stores) => {
      return stores.sublinks.get(composite);
    }) as Promise<Sublink>;
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

  //assoisate a script
  async associate(sublink: Sublink, file: string) {
    return this.db.query(["sublinks"], async (stores) => {
      sublink.scripts.push(file);
      return stores.sublinks.put(sublink);
    });
  }

  // diassociate a script
  async disassociate(sublink: Sublink, file: string) {
    return this.db.query(["sublinks"], async (stores) => {
      sublink.scripts = sublink.scripts.filter((script) => script !== file);
      return stores.sublinks.put(sublink);
    });
  }

  //change logging status
  async changeLogging(sublink: Sublink, status: boolean) {
    return this.db.query(["sublinks"], async (stores) => {
      sublink.logging = status;
      return stores.sublinks.put(sublink);
    });
  }
}

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

  //update script content
  async update(name: string, content: string) {
    return this.db.query(["scripts"], async (stores) => {
      const script = (await stores.scripts.get(name)) as Script | undefined;
      if (!script) throw new Error(`Script with name ${name} not found`);
      script.content = content;
      return stores.scripts.put(script);
    });
  }
}
