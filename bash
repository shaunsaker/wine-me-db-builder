echo STARTING

# get the existing places db and save it
firebase database:get /staging/app/places/ > ./resources/existingDB.json

# clean output
npm start cleanOutput

# get new place ids 
# npm start getPlaceIDs 

# get new places
npm start getPlaces

# clean places
npm start cleanPlaces

# clean places data
npm start cleanPlacesData

# prepare new db
npm start prepareDB

# upload new db to firebase - development node
firebase database:set /development/app/places ./output/newDB.json

# upload new db to firebase
firebase database:set /staging/app/places/ ./output/newDB.json

echo COMPLETE
