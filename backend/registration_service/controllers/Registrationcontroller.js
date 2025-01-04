const Registration=require('../model/Registration')
const axios = require('axios');
const registerForTrip = async (req, res) => {
    const { tripId } = req.params;
    const userId = req.user.id;  

    try {
        // Fetch trip details from Trip microservice
        const tripResponse = await axios.get(`http://localhost:4001/api/routes/trips/gettripbyid/${tripId}`);
        const trip = tripResponse.data;
        console.log(trip)

        console.log("Token passed to User microservice:", req.user);

        // Fetch user details from User microservice
        const userResponse = await axios.get(
            'http://localhost:4000/api/routes/users/profile',
            { headers: { Authorization: `Bearer ${req.header('Authorization').split(' ')[1]}` } }
        );
        
        const user = userResponse.data;
        console.log(user)
        if (user.age < trip.age_requirement) {
            return res.status(400).json({ error: "User does not meet the age requirement" });
        }
        if (
            user.gender !== trip.gender_requirement &&
            trip.gender_requirement &&
            trip.gender_requirement.toLowerCase() !== 'any'
        ) {
            return res.status(400).json({ error: "User does not meet the gender requirement" });
        }
        console.log("meet requirements")
        

        // Check if user is already registered for this trip
        const existingRegistration = await Registration.findOne({
            user_id: userId,
            trip_id: tripId,
            status: { $ne: 'rejected' }, // Exclude registrations with a 'rejected' status
        });
        
        if (existingRegistration) {
            return res.status(400).json({ error: "User is already registered for this trip" });
        }

        // Check for conflicting trips
        // Fetch all registrations for the user with 'requested' or 'accepted' status
        // const conflictingRegistrations = await Registration.find({
        //     user_id: userId,
        //     status: { $in: ['requested', 'accepted'] },
        // }).exec();

        // if (conflictingRegistrations.length > 0) {
        //     // Check for date conflicts
        //     for (const reg of conflictingRegistrations) {
        //         const trip = await Trip.findById(reg.trip_id).exec(); 

        //         if (trip) {
        //             const tripStart = new Date(trip.start_date);
        //             const tripEnd = new Date(trip.end_date);

        //             // Check for date overlap
        //             if (
        //                 (tripStart <= new Date(end_date) && tripStart >= new Date(start_date)) || // Overlap start
        //                 (tripEnd >= new Date(start_date) && tripEnd <= new Date(end_date)) || // Overlap end
        //                 (tripStart <= new Date(start_date) && tripEnd >= new Date(end_date)) // Complete overlap
        //             ) {
        //                 return res.status(400).json({
        //                     error: `User is already registered for another trip (${trip.name}) that conflicts with this trip.`,
        //                 });
        //             }
        //         }
        //     }
        // }

        // return res.status(200).json({ message: 'No conflicting trips found' });


        // Create a new registration entry
        const registration = new Registration({
            user_id: userId,
            trip_id: tripId,
            status: 'requested', // Status can be 'requested' if manual approval is required
        });
        await registration.save();

        res.status(201).json({ message: "Successfully registered for the trip", registration });
    } catch (error) {
        console.error("Error registering for trip:", error);
        res.status(500).json({ error: "Failed to register for the trip" });
    }
};


const updateRegistrationStatus = async (req, res) => {
    const { registrationId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const userId = req.user.id; // Creator's ID

    try {
        // Find the registration
        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ message: "Registration not found" });
        }

        // Fetch the trip
        const tripResponse = await axios.get(`http://localhost:4001/api/routes/trips/gettripbyid/${registration.trip_id}`);
        const trip = tripResponse.data.trip; // Correctly accessing the nested trip object

        console.log("Trip Response:", tripResponse.data);

        console.log("Token User ID:", userId);
        console.log("Trip Creator ID:", trip.createdBy);

        // Check if the user is the trip creator
        if (!trip || !trip.createdBy || trip.createdBy.toString() !== userId) {
            console.log("Unauthorized Access:");
            console.log("Token User ID:", userId);
            console.log("Trip Creator ID:", trip?.createdBy);
            return res.status(403).json({ message: "Unauthorized: Only the trip creator can update the status" });
        }

        // Update registration status
        registration.status = status;
        await registration.save();

        // If status is 'accepted', append the user ID to the trip's joined list
        if (status === 'accepted') {
            const updateTripResponse = await axios.put(
                `http://localhost:4001/api/routes/trips/updatejoinedlist/${registration.trip_id}`,
                { joinerId: registration.user_id } // Sending joiner ID in the request body
            );

            if (updateTripResponse.status !== 200) {
                return res.status(500).json({ message: "Failed to update the trip's joined list" });
            }
        }

        res.status(200).json({ message: `Registration ${status} successfully`, registration });
    } catch (error) {
        console.error("Error updating registration status:", error);
        res.status(500).json({ error: "Failed to update registration status" });
    }
};


module.exports = {
    updateRegistrationStatus,
    registerForTrip
};
