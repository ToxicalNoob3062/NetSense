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
  endpoints: string[];
};

export type Endpoint = {
  created: Date;
  name: string;
};

export type Settings = {
  name: string;
  value: string;
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
  endpoints: {
    key: string;
    value: Endpoint;
  };
  settings: {
    key: string;
    value: Settings;
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
        db.createObjectStore("endpoints", {
          keyPath: "name",
          autoIncrement: false,
        });
        db.createObjectStore("settings", {
          keyPath: "name",
          autoIncrement: false,
        });
      },
    });
  }

  //generate key for encrption using webcrypto
  async generateKey() {
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
    return key;
  }

  async query(
    storeNames: ("toplinks" | "sublinks" | "endpoints" | "settings")[],
    q: (stores: {
      [K in
        | "toplinks"
        | "sublinks"
        | "endpoints"
        | "settings"]: IDBPObjectStore<
        DatabaseSchema,
        ("toplinks" | "sublinks" | "endpoints" | "settings")[],
        "toplinks" | "sublinks" | "endpoints" | "settings",
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
        [K in
          | "toplinks"
          | "sublinks"
          | "endpoints"
          | "settings"]: IDBPObjectStore<
          DatabaseSchema,
          ("toplinks" | "sublinks" | "endpoints" | "settings")[],
          "toplinks" | "sublinks" | "endpoints" | "settings",
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
        endpoints: [],
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

  //assoisate a endpoint
  async associate(sublink: Sublink, eName: string) {
    return this.db.query(["sublinks"], async (stores) => {
      sublink.endpoints.push(eName);
      return stores.sublinks.put(sublink);
    });
  }

  // diassociate a endpoint
  async disassociate(sublink: Sublink, eName: string) {
    return this.db.query(["sublinks"], async (stores) => {
      sublink.endpoints = sublink.endpoints.filter(
        (ePoint) => ePoint !== eName
      );
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

export class EndPoint_Queries {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async add(eName: string) {
    return this.db.query(["endpoints"], async (stores) => {
      return stores.endpoints.add({
        name: eName,
        created: new Date(),
      });
    });
  }

  async remove(name: string) {
    return this.db.query(["endpoints"], async (stores) => {
      return stores.endpoints.delete(name);
    });
  }

  async getAll() {
    return this.db.query(["endpoints"], async (stores) => {
      return await stores.endpoints.getAll();
    }) as Promise<Endpoint[]>;
  }

  async get(eName: string) {
    return this.db.query(["endpoints"], async (stores) => {
      return stores.endpoints.get(eName);
    }) as Promise<Endpoint>;
  }
}

export class Settings_Queries {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async get(name: string) {
    return this.db.query(["settings"], async (stores) => {
      return stores.settings.get(name);
    }) as Promise<Settings>;
  }

  async set(name: string, value: string) {
    return this.db.query(["settings"], async (stores) => {
      return stores.settings.put({
        name,
        value,
      });
    });
  }
}
