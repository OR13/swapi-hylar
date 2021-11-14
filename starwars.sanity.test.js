const fs = require("fs");
const path = require("path");
const agent = require("./agent");

const [episode_1, episode_2] = require("./films.json").results.sort((a, b) => {
  return a.episode_id >= b.episode_id ? 1 : -1;
});

jest.setTimeout(10 * 1000);

describe("Star Wars Knowledge", () => {
  describe(`after watching ${episode_1.title}`, () => {
    beforeAll(async () => {
      await agent.watchFilm(episode_1);
    });
    it("knows when film was released", async () => {
      const entity = await agent.getEntityByName("The Phantom Menace");
      expect(entity.release_date).toBe("1999-05-19");
    });
    it("knows that Coruscant is a planet", async () => {
      const entity = await agent.getEntityByName("Coruscant");
      expect(entity.type).toBe("Planet");
    });

    it("does not know about Kamino yet", async () => {
      const entity = await agent.getEntityByName("Kamino");
      expect(entity).toBeUndefined();
    });
  });
  describe(`after watching ${episode_2.title}`, () => {
    beforeAll(async () => {
      await agent.watchFilm(episode_2);
    });

    it("knows that Kamino is a planet", async () => {
      const entity = await agent.getEntityByName("Kamino");
      expect(entity.type).toBe("Planet");
    });
  });
});

describe("questions about star wars", () => {
  it("what planets are in the film released on 1999-05-19?", async () => {
    const results = await agent.h.query(`
    SELECT ?planet WHERE { 
      ?subject <https://swapi.dev/vocab/release_date> "1999-05-19" .
      ?subject <https://swapi.dev/vocab/planet> ?planet 
    } 
    `);
    const names = await Promise.all(
      results.map(async (r) => {
        const [{ name }] = await agent.h.query(`
      SELECT ?name WHERE { 
        <${r.planet.value}> <https://swapi.dev/vocab/name> ?name .
      } 
      `);
        return name.value;
      })
    );
    expect(names).toEqual(["Tatooine", "Naboo", "Coruscant"]);
    console.log();
  });
});

describe("export and interop", () => {
  it("can export database", async () => {
    const results = await agent.h.sm.getContent();
    fs.writeFileSync(
      path.resolve(__dirname, "./hylar-export.json"),
      JSON.stringify(results.triples, null, 2)
    );
  });
});
