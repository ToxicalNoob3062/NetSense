CREATE TABLE IF NOT EXISTS scripts (
    name TEXT PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tld_links (
    website TEXT PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sublinks (
    tld_website TEXT NOT NULL,
    url TEXT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logging BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (tld_website, url),
    FOREIGN KEY (tld_website) REFERENCES tld_links(website)
);

CREATE TABLE IF NOT EXISTS sublink_scripts (
    tld_website TEXT NOT NULL,
    sublink_url TEXT NOT NULL,
    script_name TEXT NOT NULL,
    FOREIGN KEY (tld_website, sublink_url) REFERENCES sublinks(tld_website, url),
    FOREIGN KEY (script_name) REFERENCES scripts(name),
    PRIMARY KEY (tld_website, sublink_url, script_name)
);