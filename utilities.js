const utilities = {};

utilities.getLengthOfObject = object => {
    let length = 0;

    for (let key in object) {
        length += 1;
    }

    return length;
};

export default utilities;
