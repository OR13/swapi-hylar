const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function fetchAllPages(url) {
  let res = await axios({
    url,
    method: "GET",
  });
  let list = [...res.data.results];
  let nextUrl = res.data.next;
  while (nextUrl) {
    console.log(nextUrl);
    res = await axios({
      url: nextUrl,
      method: "GET",
    });
    nextUrl = res.data.next;
    list = [...list, ...res.data.results];
  }
  return list;
}

(async () => {
  console.log("building local cache...");
  const results = await fetchAllPages("https://swapi.dev/api/planets/");
  fs.writeFileSync(
    path.resolve(__dirname, "./planets.json"),
    JSON.stringify({ results }, null, 2)
  );
  console.log("cache completed...");
})();
