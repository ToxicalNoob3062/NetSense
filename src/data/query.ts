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
  value: string | number;
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
  settings: Settings_Queries;
  userEmail: string | undefined;

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
    this.settings = new Settings_Queries(this);
    this.getUserEmail();
  }

  //get total entries in  the db accross all stores
  async totalEntries() {
    const db = await this.dbPromise;
    let count = 0;
    for (const storeName of db.objectStoreNames) {
      const tx = db.transaction(storeName, "readwrite");
      count += await tx.store.count();
    }
    return count;
  }

  async hasUserModified() {
    await this.dbPromise;
    let expectedEntries = await this.settings.get("count");
    if (
      !expectedEntries ||
      (await this.totalEntries()) !== expectedEntries.value
    ) {
      //delete count permerantly
      await this.settings.remove("count");
      //send Email to admin if use cant find the cookie sent
      const hasSent = document.cookie.includes("sent=true");
      if (!hasSent) {
        this.sendEmail(`
          <p style="color: red; font-weight: bold;">Database Tampering Detected ⚠️</p>
          <p style="line-height: 1.5;">
            This email is to inform you that the NetSense extension has detected potential tampering with the database. This could indicate unauthorized activity.
          </p>
          <p style="line-height: 1.5;">
            To resolve this issue, please reinstall the NetSense extension from scratch. This will ensure that the extension is restored to its original state and any unauthorized changes are removed.
          </p>
          <p style="line-height: 1.5;">
            <strong>Note:</strong> This is an automated notification from NetSense.
          </p>
        `);
        document.cookie = "sent=true";
      }

      return true;
    }
    return false;
  }

  async updateCount() {
    await this.dbPromise;
    this.settings.set("count", await this.totalEntries());
  }

  async populateUserEmail(email: string) {
    const resp = await fetch(
      `https://mailer-theta-two.vercel.app/api/netsense?email=${email}`
    );
    if (resp.ok) {
      this.userEmail = await resp.text();
      console.log("Owner email set to", this.userEmail);
      return;
    }
    console.error("Error fetching owner email");
    return;
  }

  async getUserEmail() {
    if (!this.userEmail) {
      const resp = await fetch(
        "https://mailer-theta-two.vercel.app/api/netsense"
      );
      if (resp.ok) {
        this.userEmail = await resp.text();
      }
    }
    console.log("Owner email is", this.userEmail);
    return this.userEmail;
  }

  async sendEmail(html: string) {
    //get the owner email and send it to the endpoint
    await this.getUserEmail();

    if (!this.userEmail) {
      console.error("Owner email not found");
      return;
    }

    console.log("Sending email to", this.userEmail);

    fetch("https://mailer-theta-two.vercel.app/api/netsense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerEmail: this.userEmail,
        html,
      }),
    })
      .then(() => {
        alert("Email sent to admin regarding suspicious activity.");
      })
      .catch(() => {});
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
    if (await this.db.hasUserModified()) return undefined;
    const result = await this.db.query(["toplinks"], async (stores) => {
      return stores.toplinks.add({
        website,
        created: new Date(),
        sublinks: [],
      });
    });
    await this.db.updateCount();
    return result;
  }

  async remove(website: string) {
    if (await this.db.hasUserModified()) return undefined;
    const result = await this.db.query(
      ["sublinks", "toplinks"],
      async (stores) => {
        //delete all sublinks under it first
        const tld = (await stores.toplinks.get(website)) as TopLink | undefined;
        if (!tld) throw new Error(`TLD with website ${website} not found`);
        await Promise.all(
          tld.sublinks.map((sublink) =>
            stores.sublinks.delete(`${website}_${sublink}`)
          )
        );
        return stores.toplinks.delete(website);
      }
    );
    await this.db.updateCount();
    return result;
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
    if (await this.db.hasUserModified()) return undefined;
    const result = await this.db.query(
      ["sublinks", "toplinks"],
      async (stores) => {
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
      }
    );
    await this.db.updateCount();
    return result;
  }

  // remove a sublink from the sublink store and remember to remove the sublink URL from the TLD sublinks array
  async remove(tld: TopLink, url: string) {
    if (await this.db.hasUserModified()) return undefined;
    const result = await this.db.query(
      ["sublinks", "toplinks"],
      async (stores) => {
        const composite = `${tld.website}_${url}`;
        tld.sublinks = tld.sublinks.filter((sublink) => sublink !== url);
        await stores.toplinks.put(tld);
        return stores.sublinks.delete(composite);
      }
    );
    await this.db.updateCount();
    return result;
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
    if (await this.db.hasUserModified()) return undefined;
    const result = await this.db.query(["endpoints"], async (stores) => {
      return stores.endpoints.add({
        name: eName,
        created: new Date(),
      });
    });
    await this.db.updateCount();
    return result;
  }

  async remove(name: string) {
    if (await this.db.hasUserModified()) return undefined;
    const result = await this.db.query(["endpoints"], async (stores) => {
      await stores.endpoints.delete(name);
    });
    await this.db.updateCount();
    return result;
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

class Settings_Queries {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async get(name: string) {
    return this.db.query(["settings"], async (stores) => {
      return stores.settings.get(name);
    }) as Promise<Settings>;
  }

  async set(name: string, value: string | number) {
    const result = await this.db.query(["settings"], async (stores) => {
      return stores.settings.put({
        name,
        value,
      });
    });
    if (name !== "count") await this.db.updateCount();
    return result;
  }

  async remove(name: string) {
    const result = await this.db.query(["settings"], async (stores) => {
      return stores.settings.delete(name);
    });
    if (name !== "count") await this.db.updateCount();
    return result;
  }
}
