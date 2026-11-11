const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_PATH = path.join(__dirname, '../data.json');

const getDefaultData = () => ({
  users: [],
  contacts: [],
  partners: [],
  webhooks: [],
  queryLogs: []
});

const readData = () => {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            return getDefaultData();
        }
        const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        return { ...getDefaultData(), ...parsed };
    } catch (e) {
        return getDefaultData();
    }
};

const writeData = (data) => {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
};

module.exports = {
    readData,
    writeData,
    uuidv4
};
