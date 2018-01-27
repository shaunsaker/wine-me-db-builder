import fs from "fs";

import config from "./config";
import utilities from "./utilities";

const googleMapsClient = require("@google/maps").createClient({
    key: config.apiKey,
});

let placeIDs = JSON.parse(fs.readFileSync("placeIDs.json"));
let places = JSON.parse(fs.readFileSync("places.json"));
const initialPlaceCount = utilities.getLengthOfObject(placeIDs);

function writeFile(file, data) {
    console.log("Writing to", file);
    try {
        fs.writeFileSync(file, JSON.stringify(data));
    } catch (error) {
        console.error(error);
    }
}

function findNextArea() {
    for (let area in areas) {
        if (!areas[area].havePlaces) {
            return areas[area].coords;
        }
    }
}

function getPlaceIDs(location) {
    console.log("Fetching from", location);
    googleMapsClient.placesRadar(
        {
            location,
            radius: 50000, // metres
            keyword: "wine farm",
            language: "English",
            type: "establishment",
            name: "wine estate",
        },
        (error, data) => {
            if (error) {
                console.error(error);
                if (error === "timeout") {
                    // Retry
                    getPlaceIDs(location);
                }
            }
            const results = data.json.results;

            results.map((place, index) => {
                const placeID = place["place_id"];

                if (!placeIDs[placeID]) {
                    console.log("Adding", placeID);
                    placeIDs[placeID] = place;
                }
            });

            console.log(
                "Initial place count:",
                initialPlaceCount,
                "Final place count:",
                utilities.getLengthOfObject(placeIDs),
            );
            writeFile("placeIDs.json", placeIDs);

            // Mark havePlaces
            for (let area in areas) {
                if (!areas[area].havePlaces) {
                    areas[area].havePlaces = true;
                }
            }

            // Find next area
            getPlaceIDs(findNextArea());
        },
    );
}

function findNextPlaceID() {
    let count = 0;

    for (let placeID in placeIDs) {
        count += 1;

        if (!places[placeID]) {
            return placeID;
        }
    }
}

function getPlace(placeID) {
    console.log("Getting", placeID);
    googleMapsClient.place(
        {
            placeid: placeID,
        },
        (error, data) => {
            if (error) {
                console.error(error);
                if (error === "timeout") {
                    // Retry
                    getPlace(placeID);
                }
            }
            const place = data.json.results;

            console.log("Adding", place.name);
            places[placeID] = place;
            writeFile("places.json", places);

            // find next placeID
            getPlace(findNextPlaceID());
        },
    );
}

const areas = {
    somersetWest: { coords: ["-34.0908521", "18.849207"], havePlaces: true },
    city: { coords: ["-33.9743927", "18.4443331"], havePlaces: true },
    durbanville: { coords: ["-33.8299247", "18.643526"], havePlaces: true },
    stellenbosch: { coords: ["-33.9466715", "18.7743746"], havePlaces: true },
    malmesbury: { coords: ["-33.4617513", "18.7069095"], havePlaces: false },
    worcester: { coords: ["-33.644465", "19.4138484"], havePlaces: false },
    paarl: { coords: ["-33.7357876", "18.9583942"], havePlaces: false },
    franshoek: { coords: ["-33.8994186", "19.1485305"], havePlaces: false },
    tulbagh: { coords: ["-33.291523", "19.1323892"], havePlaces: false },
};

if (process.argv[2] === "getPlaceIDs") {
    getPlaceIDs(findNextArea());
}
if (process.argv[2] === "getPlaces") {
    // find next placeID
    getPlace(findNextPlaceID());
}
