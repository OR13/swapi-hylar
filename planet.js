const planets = require("./planets.json").results;

const getPlanetById = (id) => {
  return planets.find((p) => p.url === id);
};

module.exports = { getPlanetById };
