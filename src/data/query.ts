import { PGlite, Results } from "@electric-sql/pglite";
import { readFile } from "fs/promises"; // Import fs module to read local files

// CREATE TABLE IF NOT EXISTS scripts (
//   name TEXT PRIMARY KEY,
//   created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   content TEXT NOT NULL
// );

// CREATE TABLE IF NOT EXISTS tld_links (
//   website TEXT PRIMARY KEY,
//   created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// CREATE TABLE IF NOT EXISTS sublinks (
//   tld_website TEXT NOT NULL,
//   url TEXT NOT NULL,
//   created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   logging BOOLEAN DEFAULT FALSE,
//   PRIMARY KEY (tld_website, url),
//   FOREIGN KEY (tld_website) REFERENCES tld_links(website)
// );

// CREATE TABLE IF NOT EXISTS sublink_scripts (
//   tld_website TEXT NOT NULL,
//   sublink_url TEXT NOT NULL,
//   script_name TEXT NOT NULL,
//   FOREIGN KEY (tld_website, sublink_url) REFERENCES sublinks(tld_website, url),
//   FOREIGN KEY (script_name) REFERENCES scripts(name),
//   PRIMARY KEY (tld_website, sublink_url, script_name)
// );

export class Database {
  db: PGlite;
  initialized: Promise<void>;

  constructor(database: string) {
    this.db = new PGlite(database);
    this.initialized = this.initialize();
  }

  private async getSQL(file: string) {
    const schema = await readFile(file, "utf-8");
    const sqlStatements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    return sqlStatements;
  }

  public async performTransaction(sqlStatements: string[]) {
    await this.db.transaction(async (tx) => {
      for (const statement of sqlStatements) {
        console.log("Executing statement:", statement);
        await tx.query(statement);
      }
    });
  }

  private async initialize() {
    // Check if the base table 'scripts' exists in public schema from pgtable
    const checkTable = (await this.db.query(
      `SELECT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
          AND tablename = 'scripts'
    );
    `
    )) as Results<{ exists: boolean }>;

    const exists = checkTable.rows[0].exists;

    if (exists) {
      console.log("Schema already exists");
      return;
    }

    // Perform schema initialization
    const sqlStatements = await this.getSQL("schema.sql");
    await this.performTransaction(sqlStatements);
  }

  // Example method to use the database after initialization
  public async query(sql: string, params?: any[]) {
    await this.initialized; // Ensure the schema is loaded before querying
    return this.db.query(sql, params);
  }
}

type TLD = {
  website: string;
  created: Date;
  num_sublinks: number;
};

export class TLD_Queries {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  //should insert and return the upddated table
  async insertTLD(website: string) {
    await this.db.query(
      `INSERT INTO tld_links (website) VALUES ($1) ON CONFLICT DO NOTHING`,
      [website]
    );
    return this.getTLDs();
  }

  //beside getting all TLDs, we will also get an extra field called number of sublinks associated with each tld
  async getTLDs() {
    return this.db.query(
      `SELECT tld_links.website, tld_links.created, COUNT(sublinks.url) as num_sublinks FROM tld_links LEFT JOIN sublinks ON tld_links.website = sublinks.tld_website GROUP BY tld_links.website, tld_links.created`
    ) as Promise<Results<TLD>>;
  }

  async deleteTLD(website: string) {
    await this.db.query(`DELETE FROM tld_links WHERE website = $1`, [website]);
    return this.getTLDs();
  }

  //prefix searching for websites and return including the number of sublinks
  async searchTLD(prefix: string) {
    return this.db.query(
      `SELECT tld_links.website, tld_links.created, COUNT(sublinks.url) as num_sublinks FROM tld_links LEFT JOIN sublinks ON tld_links.website = sublinks.tld_website WHERE tld_links.website LIKE $1 GROUP BY tld_links.website, tld_links.created`,
      [`${prefix}%`]
    ) as Promise<Results<TLD>>;
  }
}

type Sublink = {
  url: string;
  created: Date;
  num_scripts: number;
  logging: boolean;
};

export class Sublink_Queries {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async insertSublink(tld_website: string, url: string) {
    await this.db.query(
      `INSERT INTO sublinks (tld_website, url) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [tld_website, url]
    );
    return this.getSublinks(tld_website);
  }

  async getSublinks(tld_website: string) {
    return this.db.query(
      `SELECT sublinks.url, sublinks.created, COUNT(sublink_scripts.script_name) as num_scripts, sublinks.logging FROM sublinks LEFT JOIN sublink_scripts ON sublinks.tld_website = sublink_scripts.tld_website AND sublinks.url = sublink_scripts.sublink_url WHERE sublinks.tld_website = $1 GROUP BY sublinks.url, sublinks.created, sublinks.logging`,
      [tld_website]
    ) as Promise<Results<Sublink>>;
  }

  async deleteSublink(tld_website: string, url: string) {
    await this.db.query(
      `DELETE FROM sublinks WHERE tld_website = $1 AND url = $2`,
      [tld_website, url]
    );
    return this.getSublinks(tld_website);
  }

  //prefix searching for sublinks and return including the number of scripts
  async searchSublink(tld_website: string, prefix: string) {
    return this.db.query(
      `SELECT sublinks.url, sublinks.created, COUNT(sublink_scripts.script_name) as num_scripts, sublinks.logging FROM sublinks LEFT JOIN sublink_scripts ON sublinks.tld_website = sublink_scripts.tld_website AND sublinks.url = sublink_scripts.sublink_url WHERE sublinks.tld_website = $1 AND sublinks.url LIKE $2 GROUP BY sublinks.url, sublinks.created, sublinks.logging`,
      [tld_website, `${prefix}%`]
    ) as Promise<Results<Sublink>>;
  }

  //set logging for a sublink
  async setSublinkLogging(tld_website: string, url: string, logging: boolean) {
    await this.db.query(
      `UPDATE sublinks SET logging = $3 WHERE tld_website = $1 AND url = $2`,
      [tld_website, url, logging]
    );
    return this.getSublinks(tld_website);
  }
}

type Script = {
  name: string;
  created: Date;
  content: string;
};

export class Script_Queries {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async insertScript(name: string, content: string) {
    await this.db.query(
      `INSERT INTO scripts (name, content) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [name, content]
    );
    return this.getScripts();
  }

  async getScripts() {
    return this.db.query(`SELECT * FROM scripts`) as Promise<Results<Script>>;
  }

  async deleteScript(name: string) {
    await this.db.query(`DELETE FROM scripts WHERE name = $1`, [name]);
    return this.getScripts();
  }

  //prefix searching for scripts
  async searchScript(prefix: string) {
    return this.db.query(`SELECT * FROM scripts WHERE name LIKE $1`, [
      `${prefix}%`,
    ]) as Promise<Results<Script>>;
  }

  async associateScript(
    tld_website: string,
    sublink_url: string,
    script_name: string
  ) {
    await this.db.query(
      `INSERT INTO sublink_scripts (tld_website, sublink_url, script_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [tld_website, sublink_url, script_name]
    );
    return this.getScripts();
  }

  async dissociateScript(
    tld_website: string,
    sublink_url: string,
    script_name: string
  ) {
    await this.db.query(
      `DELETE FROM sublink_scripts WHERE tld_website = $1 AND sublink_url = $2 AND script_name = $3`,
      [tld_website, sublink_url, script_name]
    );
    return this.getScripts();
  }

  //get script content
  async getScriptContent(name: string) {
    return this.db.query(`SELECT content FROM scripts WHERE name = $1`, [
      name,
    ]) as Promise<Results<{ content: string }>>;
  }

  //set script content and name
  async setScriptContent(name: string, content: string) {
    await this.db.query(`UPDATE scripts SET content = $2 WHERE name = $1`, [
      name,
      content,
    ]);
    return this.getScripts();
  }

  //get all scripts name associated with a sublink aand return a set for
  async getSublinkScripts(tld_website: string, sublink_url: string) {
    return new Set(
      (
        (await this.db.query(
          `SELECT script_name FROM sublink_scripts WHERE tld_website = $1 AND sublink_url = $2`,
          [tld_website, sublink_url]
        )) as Results<{ script_name: string }>
      ).rows.map((row) => row.script_name)
    );
  }
}
