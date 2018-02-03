echo STARTING

# get the existing db and save it
firebase database:get / > ./resources/existingDB.json

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
firebase database:set / ./output/newDB.json

echo COMPLETE