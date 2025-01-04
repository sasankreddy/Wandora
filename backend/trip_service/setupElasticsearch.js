const { createIndexIfNotExists } = require('./elasticsearch'); 

const setupTripsIndex = async () => {
    const indexName = 'trips';
    const mappings = {
        properties: {
            trip_name: { type: 'text' },
            destination: { type: 'text' },
            transport: { type: 'keyword' },
            trip_size: { type: 'integer' },
            duration: { type: 'integer' },
            start_date: { type: 'date' },
            end_date: { type: 'date' },
            age_requirement: { type: 'integer' },
            gender_requirement: { type: 'keyword' },
            description: { type: 'text' },
            joined: { type: 'keyword' }, 
            hashtags: { type: 'text' }, 
            created_by: { type: 'keyword' }, 
        },
    };
    
    

    try {
        await createIndexIfNotExists(indexName, mappings);
        console.log('Trips index setup completed.');
    } catch (err) {
        console.error('Error setting up trips index:', err);
    }
};

// Execute the setup
setupTripsIndex();
