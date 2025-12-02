const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DataManager {
    constructor(dataFile = './database.json') {
        this.dataFile = dataFile;
        this.data = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            const fileData = await fs.readFile(this.dataFile, 'utf8');
            this.data = JSON.parse(fileData);
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.data = [];
                await this.save();
            } else {
                throw error;
            }
        }
        this.initialized = true;
    }

    async save() {
        await fs.writeFile(this.dataFile, JSON.stringify(this.data, null, 2));
    }

    generateUUID() {
        return uuidv4();
    }

    async create(userData) {
        await this.initialize();
        
        const newEntry = {
            uuid: userData.uuid || this.generateUUID(),
            bloodType: userData.bloodType,
            username: userData.username,
            entryTime: userData.entryTime || new Date().toISOString(),
            interactions: userData.interactions || [],
            ...Object.keys(userData).reduce((acc, key) => {
                if (!['uuid', 'bloodType', 'username', 'entryTime', 'interactions'].includes(key)) {
                    acc[key] = userData[key];
                }
                return acc;
            }, {})
        };
        
        this.data.push(newEntry);
        await this.save();
        
        return newEntry;
    }

    async findAll() {
        await this.initialize();
        return this.data;
    }

    async findByUUID(uuid) {
        await this.initialize();
        return this.data.find(entry => entry.uuid === uuid);
    }

    async findByField(fieldName, value) {
        await this.initialize();
        return this.data.filter(entry => entry[fieldName] === value);
    }

    async update(uuid, updateData) {
        await this.initialize();
        
        const index = this.data.findIndex(entry => entry.uuid === uuid);
        if (index === -1) {
            return null;
        }
        
        delete updateData.uuid;
        
        this.data[index] = {
            ...this.data[index],
            ...updateData,
            lastUpdated: new Date().toISOString()
        };
        
        await this.save();
        return this.data[index];
    }

    async addInteraction(uuid, interaction) {
        await this.initialize();
        
        const index = this.data.findIndex(entry => entry.uuid === uuid);
        if (index === -1) {
            return null;
        }
        
        if (!this.data[index].interactions) {
            this.data[index].interactions = [];
        }
        
        const interactionData = {
            ...interaction,
            timestamp: interaction.timestamp || new Date().toISOString()
        };
        
        this.data[index].interactions.push(interactionData);
        this.data[index].lastUpdated = new Date().toISOString();
        
        await this.save();
        return this.data[index];
    }

    async batchCreate(usersData) {
        await this.initialize();
        
        const newEntries = usersData.map(userData => ({
            uuid: userData.uuid || this.generateUUID(),
            bloodType: userData.bloodType,
            username: userData.username,
            entryTime: userData.entryTime || new Date().toISOString(),
            interactions: userData.interactions || [],
            ...Object.keys(userData).reduce((acc, key) => {
                if (!['uuid', 'bloodType', 'username', 'entryTime', 'interactions'].includes(key)) {
                    acc[key] = userData[key];
                }
                return acc;
            }, {})
        }));
        
        this.data.push(...newEntries);
        await this.save();
        
        return newEntries;
    }

    async delete(uuid) {
        await this.initialize();
        
        const index = this.data.findIndex(entry => entry.uuid === uuid);
        if (index === -1) {
            return null;
        }
        
        const deleted = this.data.splice(index, 1)[0];
        await this.save();
        
        return deleted;
    }

    async getStatistics() {
        await this.initialize();
        
        const stats = {
            totalUsers: this.data.length,
            bloodTypes: {},
            totalInteractions: 0,
            averageInteractionsPerUser: 0
        };
        
        this.data.forEach(entry => {
            if (entry.bloodType) {
                stats.bloodTypes[entry.bloodType] = (stats.bloodTypes[entry.bloodType] || 0) + 1;
            }
            
            if (entry.interactions) {
                stats.totalInteractions += entry.interactions.length;
            }
        });
        
        if (stats.totalUsers > 0) {
            stats.averageInteractionsPerUser = stats.totalInteractions / stats.totalUsers;
        }
        
        return stats;
    }
}

module.exports = DataManager;