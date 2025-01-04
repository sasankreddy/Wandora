const Trip = require('../model/trips');
const { client } = require('../elasticsearch');

const getalltrips = async (req, res) => {
    try {
        const trips = await Trip.find({});
        res.status(200).json({ trips });
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'Failed to fetch trips', error });
    }
};

const getTripById = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid Trip ID format' });
        }

        const trip = await Trip.findById(id);
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        res.status(200).json({ message: 'Trip fetched successfully', trip });
    } catch (error) {
        console.error('Error fetching trip by ID:', error);
        res.status(500).json({ message: 'Failed to fetch trip', error: error.message });
    }
};

    
const searchTrips = async (req, res) => {
    try {
        const {
            searchQuery, // General search term (could be destination or hashtag)
            duration,
            gender_requirement,
            start_date,
            end_date,
            transport,
            age_requirement,
        } = req.query;

        // Constructing the query
        const query = {
            bool: {
                should: [],  // For matching either destination or hashtags (OR logic)
                filter: [],  // For exact or range matches
                must: [],    // For required filters (gender, transport)
                minimum_should_match: searchQuery ? 1 : 0, // Enforce at least one `should` match if searchQuery exists
            },
        };
        
        // Add dynamic "should" conditions for matching either destination or hashtags
        if (searchQuery) {
            query.bool.should.push(
                {
                    match: { 
                        destination: { 
                            query: searchQuery, 
                            fuzziness: "AUTO", // Allows fuzzy matching for spelling mistakes
                        },
                    },
                },
                {
                    match: { 
                        hashtags: { 
                            query: searchQuery, 
                            fuzziness: "AUTO", // Allows fuzzy matching for spelling mistakes
                        },
                    },
                }
            );
        }
        
        // Add filter conditions (if provided)
        if (duration) query.bool.filter.push({ range:{ duration:{ lte: duration } }});
        if (age_requirement) query.bool.filter.push({ range: { age_requirement: { gte: age_requirement } } });
        if (start_date) query.bool.filter.push({ range: { start_date: { gte: start_date } } });
        if (end_date) query.bool.filter.push({ range: { end_date: { lte: end_date } } });
        
        // Add must conditions (required matching fields)
        if (gender_requirement) query.bool.must.push({ match: { gender_requirement } });
        if (transport) query.bool.must.push({ match: { transport } });
        
        // Execute the search query in Elasticsearch
        const { hits } = await client.search({
            index: 'trips',  // Ensure the correct index is used
            body: { query }, // Send the body with the query
        });
        
        // Map and return results
        const trips = hits.hits.map((hit) => ({
            id: hit._id,
            ...hit._source,
        }));

        // Return the results as a JSON response
        res.status(200).json({ trips });
    } catch (error) {
        console.error('Error searching trips:', error);
        res.status(500).json({ message: 'Failed to search trips', error });
    }
};



const createTrip = async (req, res) => {
    try {
        const createdBy = req.user.id; 

        const {
            trip_name, destination, transport, trip_size, duration,
            start_date, end_date, age_requirement, gender_requirement,
            description, hashtags
        } = req.body;

        if (!trip_name || !destination || !transport || !trip_size || !duration ||
            !start_date || !end_date || !age_requirement || !gender_requirement || 
            !description || !hashtags) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        if (trip_size <= 0) {
            return res.status(400).json({ message: "Trip size must be a positive number." });
        }
        if (age_requirement < 0) {
            return res.status(400).json({ message: "Age requirement cannot be negative." });
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (startDate >= endDate) {
            return res.status(400).json({ message: "Start date must be before end date." });
        }

        const newTrip = new Trip({
            trip_name,
            destination,
            transport,
            trip_size,
            duration,
            start_date: startDate,
            end_date: endDate,
            age_requirement,
            gender_requirement,
            description,
            joined: [],
            hashtags,
            createdBy
        });

        const savedTrip = await newTrip.save();

        const documentBody = { ...savedTrip.toObject() };
        delete documentBody._id;

        await client.index({
            index: 'trips',
            id: savedTrip._id.toString(),
            document: documentBody,
        });

        res.status(201).json({ message: 'Trip created successfully', Trip: savedTrip });
    } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({ message: 'Failed to create trip', error: error.message });
    }
};

const deleteTrip = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid Trip ID format' });
        }

        // Find the trip and verify ownership
        const trip = await Trip.findById(id);
        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }
        if (trip.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized: You can only delete your own trips' });
        }

        // Delete the trip from MongoDB
        await Trip.findByIdAndDelete(id);

        // Delete the trip from Elasticsearch
        try {
            await client.delete({
                index: 'trips',
                id: id
            });
            console.log(`Deleted trip from Elasticsearch: ${id}`);
        } catch (elasticsearchError) {
            if (elasticsearchError.meta?.statusCode === 404) {
                console.warn(`Trip not found in Elasticsearch for ID: ${id}`);
            } else {
                throw elasticsearchError;
            }
        }

        res.status(200).json({ message: 'Trip deleted successfully' });
    } catch (error) {
        console.error('Error deleting trip:', error);
        res.status(500).json({ message: 'Failed to delete trip', error: error.message });
    }
};


const myTrips = async (req, res) => {
    try {
        // Ensure the user ID is available in the request (from authentication middleware)
        const userId = req.user.id;

        // Find all trips created by the current user
        const trips = await Trip.find({ createdBy: userId });

        // Check if the user has any trips
        if (trips.length === 0) {
            return res.status(404).json({ message: 'No trips found for the current user' });
        }

        // Return the trips
        res.status(200).json({ message: 'Trips retrieved successfully', trips });
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'Failed to fetch trips', error });
    }
};


const deleteAllTrips = async (req, res) => {
    try {
        // Delete all trips from the main database
        const dbResponse = await Trip.deleteMany({}); // Replace 'Trip' with your database model

        console.log(`Deleted ${dbResponse.deletedCount} trips from the database.`);

        // Execute delete_by_query to delete all documents from the 'trips' index in Elasticsearch
        const esResponse = await client.deleteByQuery({
            index: 'trips',
            body: {
                query: {
                    match_all: {}
                }
            }
        });

        console.log(`Deleted ${esResponse.deleted} trips from Elasticsearch.`);
        
        res.status(200).json({
            message: `Successfully deleted ${dbResponse.deletedCount} trips from the database and ${esResponse.deleted} trips from Elasticsearch.`
        });
    } catch (error) {
        console.error('Error deleting trips:', error);
        res.status(500).json({ message: 'Failed to delete trips', error });
    }
};

const updateTrip = async (req, res) => {
    const { id } = req.params; // Get trip ID from URL parameters
    const updates = req.body; // Get updates from the request body

    try {
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid Trip ID format' });
        }

        // Validate dates if they are being updated
        if (updates.start_date || updates.end_date) {
            const startDate = updates.start_date ? new Date(updates.start_date) : null;
            const endDate = updates.end_date ? new Date(updates.end_date) : null;

            if (startDate && endDate && startDate >= endDate) {
                return res.status(400).json({ message: "Start date must be before end date." });
            }
        }

        // Find and update the trip in MongoDB
        const updatedTrip = await Trip.findByIdAndUpdate(id, updates, {
            new: true, // Return the updated document
            runValidators: true, // Ensure schema validation is applied
        });

        if (!updatedTrip) {
            return res.status(404).json({ error: "Trip not found in MongoDB" });
        }

        // Update the trip in Elasticsearch
        const documentBody = { ...updatedTrip.toObject() };
        delete documentBody._id; // Elasticsearch does not store the `_id` field

        try {
            await client.update({
                index: 'trips',
                id: id,
                doc: documentBody,
            });
            console.log(`Updated trip in Elasticsearch: ${id}`);
        } catch (elasticsearchError) {
            console.error(`Error updating trip in Elasticsearch: ${elasticsearchError.message}`);
        }

        res.status(200).json({ message: 'Trip updated successfully', Trip: updatedTrip });
    } catch (error) {
        console.error('Error updating trip:', error);
        res.status(500).json({ message: 'Failed to update trip', error: error.message });
    }
};

const updatejoinerslist = async (req, res) => {
    const { id } = req.params; // Trip ID
    const { joinerId } = req.body;

    try {
        const trip = await Trip.findById(id);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        // Append the joiner ID if not already present
        if (!trip.joined.includes(joinerId)) {
            trip.joined.push(joinerId);
            await trip.save();
        }

        res.status(200).json({ message: "Trip updated successfully", trip });
    } catch (error) {
        console.error("Error updating trip:", error);
        res.status(500).json({ error: "Failed to update the trip" });
    }
};




module.exports = {
    createTrip,
    searchTrips,
    getalltrips,
    deleteTrip,
    deleteAllTrips,
    updateTrip,
    getTripById,
    myTrips,
    updatejoinerslist
};
