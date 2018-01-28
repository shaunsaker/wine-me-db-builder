import fs from "fs";
import readlineSync from "readline-sync";

import config from "./config";
import utilities from "./utilities";

const googleMapsClient = require("@google/maps").createClient({
    key: config.apiKey,
});

let placeIDs = JSON.parse(fs.readFileSync("placeIDs.json"));
let places = JSON.parse(fs.readFileSync("places.json"));
const initialPlaceCount = utilities.getLengthOfObject(placeIDs);

function findNextArea() {
    for (let area in areas) {
        if (!areas[area].havePlaces) {
            return areas[area].coords;
        }
    }
}

function writeFile(file, data) {
    console.log("\nWriting to", file);
    try {
        fs.writeFileSync(file, JSON.stringify(data));
    } catch (error) {
        console.error(error);
    }
}

function getPlaceIDs(location, radius) {
    console.log("Fetching from", location);
    googleMapsClient.placesRadar(
        {
            location,
            radius: radius * 1000, // metres
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

            for (let area in areas) {
                if (!areas[area].havePlaces) {
                    areas[area].havePlaces = true;
                    break;
                }
            }

            const nextAreaCoords = findNextArea();

            if (nextAreaCoords) {
                console.log("Sleeping for 2 seconds");

                setTimeout(() => {
                    getPlaceIDs(nextAreaCoords, process.argv[3]); // 3 = radius in km
                }, 2000);
            }
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
            const place = data.json.result;

            console.log("Adding", place.name);
            places[placeID] = place;
            writeFile("places.json", places);

            console.log("Sleeping for 2 seconds");

            // find next placeID
            setTimeout(() => {
                const nextPlaceID = findNextPlaceID();

                nextPlaceID && getPlace(findNextPlaceID());
            }, 2000);
        },
    );
}

const areas = {
    somersetWest: { coords: ["-34.0908521", "18.849207"], havePlaces: false },
    city: { coords: ["-33.9743927", "18.4443331"], havePlaces: false },
    durbanville: { coords: ["-33.8299247", "18.643526"], havePlaces: false },
    stellenbosch: { coords: ["-33.9466715", "18.7743746"], havePlaces: false },
    malmesbury: { coords: ["-33.4617513", "18.7069095"], havePlaces: false },
    worcester: { coords: ["-33.644465", "19.4138484"], havePlaces: false },
    paarl: { coords: ["-33.7357876", "18.9583942"], havePlaces: false },
    franshoek: { coords: ["-33.8994186", "19.1485305"], havePlaces: false },
    tulbagh: { coords: ["-33.291523", "19.1323892"], havePlaces: false },
    darling: { coords: ["-33.368283", "18.392086"], havePlaces: false },
};

if (process.argv[2] === "getPlaceIDs") {
    const nextAreaCoords = findNextArea();

    nextAreaCoords && getPlaceIDs(nextAreaCoords, process.argv[3]); // 3 = radius in km
}

if (process.argv[2] === "getPlaces") {
    const nextPlaceID = findNextPlaceID();

    nextPlaceID && getPlace(findNextPlaceID());
}

if (process.argv[2] === "cleanPlaces") {
    let cleanedPlaces = {};
    let otherPlaces = {};

    for (let placeID in places) {
        //console.log(places[placeID].name);

        if (places[placeID].name.toLowerCase().match(/wine|estate|farm/)) {
            console.log("\nAdding", places[placeID].name);
            // Condition to automatically add it in
            cleanedPlaces[placeID] = places[placeID];
        } else {
            // Otherwise, ask me to add it in and keep a list of approved names for later on
            console.log("\nChecking", places[placeID].name);

            otherPlaces[placeID] = places[placeID].name;

            const answer = readlineSync.question(
                "\nAdd " + places[placeID].name + "? (y/n) ",
            );

            if (answer === "y") {
                cleanedPlaces[placeID] = places[placeID];
            } else {
                // Don't add it as cleaned
            }

            writeFile("cleanPlaces.json", cleanedPlaces);
            writeFile("otherPlaces.json", otherPlaces);
        }
    }

    writeFile("cleanPlaces.json", cleanedPlaces);
    writeFile("otherPlaces.json", otherPlaces);
}
