const neo4j = require("neo4j-driver");
const uri = "neo4j://localhost";
const user = "neo4j";
const password = "test";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const iriToLabel = (iri) => {
  if (iri === "did:example:789") {
    return "Organization";
  }
  if (iri === "did:example:123") {
    return "Person";
  }
  if (iri.includes("#key")) {
    return "Key";
  }
  if (iri.includes("authentication")) {
    return "authentication";
  }
  if (iri.includes("assertion")) {
    return "assertion";
  }
  if (iri.includes("issuer")) {
    return "issuer";
  }
  if (iri.includes("holder")) {
    return "holder";
  }

  if (iri.includes("verifiableCredential")) {
    return "verifiableCredential";
  }

  if (iri.includes("verificationMethod")) {
    return "verificationMethod";
  }

  if (iri.includes("proof")) {
    return "proof";
  }

  if (iri.includes("credentials")) {
    return "Credential";
  }
  if (iri.includes("presentations")) {
    return "Presentation";
  }
  return "UNKNOWN";
};

const getOrCreateSubject = async (s) => {
  const session = driver.session();
  const label = iriToLabel(s);
  await session.run(`MERGE (a:${label} { id: $id }) RETURN a`, {
    id: s,
  });
  await session.close();
};

const getOrCreateObject = async (o) => {
  const session = driver.session();
  const label = iriToLabel(o);
  await session.run(`MERGE (a:${label} { id: $id }) RETURN a`, {
    id: o,
  });
  await session.close();
};

const getOrCreatePredicate = async (s, p, o) => {
  const session = driver.session();
  const label = iriToLabel(p);

  await session.run(
    `
MATCH
  (s {id: '${s}'}),
  (o {id: '${o}'})
MERGE (s)-[:${label}]->(o)
RETURN s`
  );
  await session.close();
};

const handleTriple = async (s, p, o) => {
  console.log("handling: ", s, p, o);
  const subject = await getOrCreateSubject(s);
  const object = await getOrCreateObject(o);
  const predicate = await getOrCreatePredicate(s, p, o);
};

describe("neo4j", () => {
  beforeAll(async () => {
    const session = driver.session();
    await session.run(
      `
      MATCH (n)
      DETACH DELETE n
      `
    );
    await session.close();
  });
  afterAll(async () => {
    await driver.close();
  });

  it("can add assertion key", async () => {
    const s = "did:example:789";
    const p = "https://w3id.org/security#assertionMethod";
    const o = "did:example:789#key-0";
    await handleTriple(s, p, o);
  });

  it("can add authentication key", async () => {
    const s = "did:example:123";
    const p = "https://w3id.org/security#authentication";
    const o = "did:example:123#key-1";
    await handleTriple(s, p, o);
  });

  it("can add issued credential", async () => {
    const s = "https://vendor.example/credentials/123";
    const p = "https://trace.example/vocab/issuer";
    const o = "did:example:789";
    await handleTriple(s, p, o);
  });
  describe("can add proof for issued credential", () => {
    it("add blank node for the proof", async () => {
      const s = "https://vendor.example/credentials/123";
      const p = "https://trace.example/vocab/proof";
      const o = "https://vendor.example/credentials/123#blank-node-1-proof";
      await handleTriple(s, p, o);
    });
    it("add verificationMethod to blank node", async () => {
      const s = "https://vendor.example/credentials/123#blank-node-1-proof";
      const p = "https://trace.example/vocab/verificationMethod";
      const o = "did:example:789#key-0";
      await handleTriple(s, p, o);
    });
  });

  it("can add presented credential", async () => {
    const s = "https://vendor.example/presentations/456";
    const p = "https://trace.example/vocab/holder";
    const o = "did:example:123";
    await handleTriple(s, p, o);
  });

  describe("can add proof for presented credential", () => {
    it("add credentials presented", async () => {
      const s = "https://vendor.example/presentations/456";
      const p = "https://trace.example/vocab/verifiableCredential";
      const o = "https://vendor.example/credentials/123";
      await handleTriple(s, p, o);
    });
    it("add blank node for the proof", async () => {
      const s = "https://vendor.example/presentations/456";
      const p = "https://trace.example/vocab/proof";
      const o = "https://vendor.example/presentations/456#blank-node-2-proof";
      await handleTriple(s, p, o);
    });
    it("add verificationMethod to blank node", async () => {
      const s = "https://vendor.example/presentations/456#blank-node-2-proof";
      const p = "https://trace.example/vocab/verificationMethod";
      const o = "did:example:123#key-1";
      await handleTriple(s, p, o);
    });
  });
});
