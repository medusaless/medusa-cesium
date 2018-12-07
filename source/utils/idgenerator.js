function getTimeStamp(){
    var date = new Date();
    return `${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getUTCHours()}${date.getMinutes()}${date.getSeconds()}`
}

export default {
    getNextId: function (name) {
        return name.toString() + '_' + getTimeStamp() + '_' + Math.random();
    }
}

