import fs from "fs";

import config from "./config";
import utilities from "./utilities";

const googleMapsClient = require("@google/maps").createClient({
    key: config.apiKey,
});

const west = ["-34.0908521", "18.849207"]; // Somerset West
const central = ["-33.8014849", "25.3897589"]; // Port Elizabeth
const east = ["-26.1715172", "28.0049193"]; // Johannesburg
let localities = {
    west: false,
    central: false,
    east: false,
};
let placeIDs = {};

// PROBLEM: Need to subdivide west locality because those are where the majority are, ie. there could be more than 200

function getPlaceIDs(location, locality) {
    console.log("Fetching from", location, locality);
    googleMapsClient.placesRadar(
        {
            location,
            radius: 250000, // 250km
            keyword: "wine farm",
            language: "English",
            type: "establishment",
            name: "wine estate",
        },
        (error, data) => {
            console.log("Got data");
            if (error) {
                console.error(error);
            }
            const results = data.json.results;

            results.map((place, index) => {
                const placeID = place["place_id"];

                if (!placeIDs[placeID]) {
                    console.log("Adding", placeID);
                    placeIDs[placeID] = place;
                }
            });

            console.log("Place count:", utilities.getLengthOfObject(placeIDs));
            localities[locality] = true;

            if (!localities.central) {
                console.log("Sleeping for 2 seconds");

                setTimeout(() => {
                    getPlaceIDs(central, "central");
                }, 2000);
            } else if (localities.east) {
                // If we have east placeIDs, write all placeIDs to file
                try {
                    fs.writeFileSync("placeIDs.json", JSON.stringify(placeIDs));
                } catch (error) {
                    console.error(error);
                }
            } else {
                console.log("Sleeping for 2 seconds");
                setTimeout(() => {
                    getPlaceIDs(east, "east");
                }, 2000);
            }
        },
    );
}

getPlaceIDs(west, "west");
