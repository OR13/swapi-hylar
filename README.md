### Star Wars API + HyLar

- https://swapi.dev/
- https://github.com/ucbl/HyLAR-Reasoner

This repo is for learning SPARQL, messing with linked data queries, and semantic reasoners.

#### Develop

```
npm i
npm run build
npm run test
```

#### Curls

Beware that pagination may be required to get everything...

```
curl -s https://swapi.dev/api/films/ > ./films.json
curl -s https://swapi.dev/api/planets/ > ./planets.json
```
