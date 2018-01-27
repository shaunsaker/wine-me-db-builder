import fs from "fs";

import config from "./config";
import utilities from "./utilities";

const googleMapsClient = require("@google/maps").createClient({
    key: config.apiKey,
});

const west = ["-34.0908521", "18.849207"]; // Somerset West
const central = ["33.8014849", "25.3897589"]; // Port Elizabeth
const east = ["26.1715172", "28.0049193"]; // Johannesburg
let localities = {
    west: false,
    central: false,
    east: false,
};
let placeIDs = {};

function getPlaceIDs(location, locality) {
    googleMapsClient.placesRadar(
        {
            location,
            radius: 50000,
            keyword: "wine farm",
            language: "English",
            type: "establishment",
            name: "wine estate",
        },
        (error, data) => {
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

            console.log("Place count:", utilities.getLengthOfObject(results));
            localities[locality] = true;

            if (!localities.central) {
                getPlaceIDs(central, "central");
            } else if (localities.east) {
                // If we have east placeIDs, write all placeIDs to file
                try {
                    fs.writeFileSync("placeIDs.json", JSON.stringify(placeIDs));
                } catch (error) {
                    console.error(error);
                }
            } else {
                getPlaceIDs(east, "east");
            }
        },
    );
}

getPlaceIDs(west, "west");
