import utilities from "./utilities";

export default function getPlaces() {
    console.log("Fetching new places");
    googleMapsClient.places(
        {
            query: "wine farm",
            location,
            pagetoken: nextPageToken,
        },
        (error, data) => {
            if (error) {
                console.error(error);
                // We need to store this in case we need to run it again
                try {
                    fs.writeFileSync(
                        "error.json",
                        JSON.stringify({
                            nextPageToken,
                        }),
                    );
                } catch (error) {
                    console.error(error);
                }
            }
            nextPageToken = data.json.next_page_token;
            const results = data.json.results;

            results.map((place, index) => {
                // If the place is not present in places, add it
                const placeID = place["place_id"];
                console.log("Adding", place.name, "to places");

                if (!places[placeID]) {
                    places[placeID] = place;
                }
            });

            const placesLength = utilities.getLengthOfObject(places);
            console.log("Places count:", placesLength);

            if (placesLength > config.maxPlacesToFetch - 20) {
                console.log("We have max places");
            } else if (!nextPageToken) {
                console.log("No more results");
            } else {
                // wait for the next page token to be validated
                console.log("Sleeping for 2 seconds");

                setTimeout(() => {
                    getPlaces();
                }, 2000);

                // Write places to file
                try {
                    fs.writeFileSync("places.json", JSON.stringify(places));
                } catch (error) {
                    console.error(error);
                }
            }
        },
    );
}
