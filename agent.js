const Hylar = require("hylar");
const jsonld = require("jsonld");
const h = new Hylar();

const { getPlanetById } = require("./planet");

const context = {
  "@vocab": "https://swapi.dev/vocab/",
  id: "@id",
};
const denyList = ["url", "created", "edited"];

const getRelationships = (list, type) => {
  return list
    .map((item) => {
      return `
    sw:${type} "${item}";`;
    })
    .join("");
};

const learnAboutPlanets = async (film) => {
  const planetEntries = await Promise.all(
    film.planets.map(async (planetId) => {
      const planet = await getPlanetById(planetId);
      let attrs = ``;
      // loop over planet attribute adding them to the planet entry
      Object.keys(planet).forEach((k) => {
        if (denyList.includes(k)) {
          return;
        }
        v = planet[k];
        if (Array.isArray(v)) {
          attrs += v
            .map((vi) => {
              `sw:${k} "${vi}";"`;
            })
            .join("\n");
        } else {
          attrs += `sw:${k} "${v}";\n`;
        }
      });
      // add a graph node for the planet and its attributes
      const planetEntry = `
      <${planet.url}>
        sw:type  "Planet";
        ${attrs}
       .
      `;
      return planetEntry;
    })
  );
  await h.query(`
    PREFIX sw: <https://swapi.dev/vocab/>
    INSERT DATA
    {
      ${planetEntries.join("\n")}
    }
    `);
};

const watchFilm = async (film) => {
  await learnAboutPlanets(film);
  const planetsInFilm = getRelationships(film.planets, "planet");
  const query = `
  PREFIX sw: <https://swapi.dev/vocab/>
  INSERT DATA
  {
    <${film.url}> 
    sw:name "${film.title}";
    sw:release_date "${film.release_date}";
    ${planetsInFilm}
    .
  }
  `;
  // console.log(query);
  await h.query(query);
};

const getEntityByName = async (name) => {
  const results = await h.query(
    `
SELECT ?subject ?predicate ?object WHERE { 
  ?subject <https://swapi.dev/vocab/name> "${name}" .
  ?subject ?predicate ?object 
}
`
  );
  if (!results.length) {
    return undefined;
  }
  const initialDoc = {
    "@id": results[0].subject.value,
  };
  const doc = results.reduce(
    (acc, r) => ({
      ...acc,
      [r.predicate.value]: r.object.value,
    }),
    initialDoc
  );
  const compacted = await jsonld.compact(doc, context);
  return compacted;
};

module.exports = { h, watchFilm, getEntityByName };
