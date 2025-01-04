const { Client } = require('@elastic/elasticsearch');

// Elasticsearch configuration
const client = new Client({
    node: 'http://localhost:9200', // Elasticsearch node URL
});

const checkElasticsearchHealth = async () => {
    const health = await client.cluster.health();
    console.log('Elasticsearch Cluster Health:', health);
};


// Utility function to create an index with mappings
const createIndexIfNotExists = async (indexName, mappings) => {
    try {
        const exists = await client.indices.exists({ index: indexName });
        if (!exists.body) {
            await client.indices.create({
                index: indexName,
                body: { mappings }
            });
            console.log(`Index "${indexName}" created successfully with mappings.`);
        } else {
            console.log(`Index "${indexName}" already exists.`);
        }
    } catch (err) {
        console.error(`Error creating index "${indexName}":`, err);
    }
};

// Export the client and utility functions
module.exports = {
    client,
    createIndexIfNotExists,
};
