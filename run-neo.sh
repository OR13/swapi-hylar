

docker run \
    --name testneo4j \
    -p7474:7474 -p7687:7687 \
    -d \
    -v $(pwd)/data/neo4j/data:/data \
    -v $(pwd)/data/neo4j/logs:/logs \
    -v $(pwd)/data/neo4j/import:/var/lib/neo4j/import \
    -v $(pwd)/data/neo4j/plugins:/plugins \
    --env NEO4J_AUTH=neo4j/test \
    neo4j:latest