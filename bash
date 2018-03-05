echo STARTING

# get the existing db and save it
firebase database:get /staging > ./resources/existingDB.json

# clean output
npm start cleanOutput

# get new place ids
npm start getPlaceIDs

# get new places
npm start getPlaces

# clean places
npm start cleanPlaces

# clean places data
npm start cleanPlacesData

# prepare new db
npm start prepareDB

# upload new db to firebase
firebase database:set /staging ./output/newDB.json

# upload new db to firebase - development node
firebase database:set /development ./output/newDB.json

echo COMPLETE