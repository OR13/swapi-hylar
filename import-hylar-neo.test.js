const neo4j = require("neo4j-driver");
const uri = "neo4j://localhost";
const user = "neo4j";
const password = "test";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const exportedData = require("./hylar-export.json");

const deleteAll = async () => {
  const session = driver.session();
  await session.run(
    `MATCH (n:Planet)
       DELETE n`
  );
  await session.close();
};

const subjectIdToLabel = (id) => {
  // id: https://swapi.dev/api/planets/1/
  if (id.indexOf("/api/planets/") !== -1) {
    return "Planet";
  }
  return "UNKNOWN";
};

describe("importing a hylar export into neo4j", () => {
  beforeAll(async () => {
    await deleteAll();
  });
  afterAll(async () => {
    // on application exit:
    await driver.close();
  });

  const getOrCreateNode = async (s, p, o) => {
    const id = s;
    const session = driver.session();
    const label = subjectIdToLabel(id);
    if (label === "Planet") {
      const result = await session.run(
        `
MATCH
  (s:Planet {id: $subject}),
  (o:Planet {id: $object})
MERGE (s)-[:DIRECTED]->(p:Predicate)<-[:ACTED_IN]-(o)
RETURN p
        `,
        {
          subject: s,
          predicate: p,
          object: o,
        }
      );

      const singleRecord = result.records[0];
      const node = singleRecord.get(0);
      console.log(node);
    }

    await session.close();
  };

  //   MERGE (p:Planet {id: $subject})
  // ON CREATE
  //   SET p.created = timestamp()
  // ON MATCH
  // SET p["$predicate"] = "$object"
  // RETURN p.id, p.created

  it("can connect and write to database", async () => {
    // console.log(exportedData);
    await Promise.all(
      exportedData.map(async (entry) => {
        const { subject, predicate, object } = entry;
        const s = subject.nominalValue;
        const p = predicate.nominalValue;
        const o = object.nominalValue;
        // console.log(s, p, o);
        // await getOrCreateNode(s);
      })
    );
    // const entry = exportedData[0];
  });
});
