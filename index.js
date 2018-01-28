import fs from "fs";
import readlineSync from "readline-sync";

import config from "./config";
import utilities from "./utilities";

const googleMapsClient = require("@google/maps").createClient({
    key: config.apiKey,
});

let placeIDs = JSON.parse(fs.readFileSync("placeIDs.json"));
let places = JSON.parse(fs.readFileSync("places.json"));
let cleanPlaces = JSON.parse(fs.readFileSync("cleanPlaces.json"));
let approvedPlaces = JSON.parse(fs.readFileSync("approvedPlaces.json"));
let disapprovedPlaces = JSON.parse(fs.readFileSync("disapprovedPlaces.json"));
const existingDB = JSON.parse(fs.readFileSync("existingDB.json"));
const finalPlaces = JSON.parse(fs.readFileSync("finalPlaces.json"));

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

function cleanPlaces() {
    for (let placeID in places) {
        if (!cleanPlaces[placeID]) {
            // Only do stuff if the place is not already in cleanPlaces

            if (approvedPlaces[placeID]) {
                // Add it in if it was previously approved
                console.log("\nAdding", places[placeID].name);

                cleanPlaces[placeID] = places[placeID];

                writeFile("cleanPlaces.json", cleanPlaces);
            } else if (
                places[placeID].name
                    .toLowerCase()
                    .match(/wine|estate|farm|vineyard|cellar|tasting/)
            ) {
                // Add it in if it matches these strings
                console.log("\nAdding", places[placeID].name);

                cleanPlaces[placeID] = places[placeID];

                writeFile("cleanPlaces.json", cleanPlaces);
            } else if (
                places[placeID].name
                    .toLowerCase()
                    .match(
                        /restaurant|cottage|guest|kitchen|eat|house|hotel|lodge|bistro|bar/,
                    )
            ) {
                // Don't do anything
            } else if (!disapprovedPlaces[placeID]) {
                // Otherwise, ask me what to do and keep a list of approved names for later on
                const answer = readlineSync.question(
                    "\nAdd " + places[placeID].name + "? (y/n) ",
                );

                if (answer === "y") {
                    approvedPlaces[placeID] = places[placeID].name;
                    cleanPlaces[placeID] = places[placeID];

                    writeFile("cleanPlaces.json", cleanPlaces);
                    writeFile("approvedPlaces.json", approvedPlaces);
                } else {
                    // Add it to disapprovedPlaces so that we don't get queried again
                    disapprovedPlaces[placeID] = places[placeID].name;

                    writeFile("disapprovedPlaces.json", disapprovedPlaces);
                }
            }
        }
    }

    let count = 0;
    for (let placeID in cleanPlaces) {
        count += 1;
    }
    console.log("Clean places count:", count);
}

function cleanPlacesData() {
    let finalPlaces = {};

    // Only want to keep a minimal amount of information, ie. name, geometry, rating
    for (let placeID in cleanPlaces) {
        const place = {
            name: cleanPlaces[placeID].name,
            location: cleanPlaces[placeID].geometry.location,
            rating: cleanPlaces[placeID].rating,
            photoReference:
                cleanPlaces[placeID].photos &&
                cleanPlaces[placeID].photos[0].photo_reference,
        };

        finalPlaces[placeID] = place;
    }

    writeFile("finalPlaces.json", finalPlaces);
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

    nextAreaCoords &&
        getPlaceIDs(nextAreaCoords, process.argv[3] ? process.argv[3] : 50); // 3 = radius in km
} else if (process.argv[2] === "getPlaces") {
    const nextPlaceID = findNextPlaceID();

    nextPlaceID && getPlace(findNextPlaceID());
} else if (process.argv[2] === "cleanPlaces") {
    cleanPlaces();
} else if (process.argv[2] === "cleanPlacesData") {
    cleanPlacesData();
} else if (process.argv[2] === "prepareDB") {
    const newDB = {
        app: {
            places: finalPlaces,
            featuredPlaces: existingDB.app.featuredPlaces,
        },
        users: existingDB.users,
        version: existingDB.version,
    };

    writeFile("newDB.json", newDB);
} else {
    console.log(
        "\nNothing for you bro. \n\nAdd one of the following arguments: \n\ngetPlaceIDs (+ radius in km)\ngetPlaces\ncleanPlaces\ncountCleanPlaces\nprepareDB\n",
    );
}
