const Joi = require('joi');

const userSchema = Joi.object({
    uuid: Joi.string().guid({ version: 'uuidv4' }).optional(),
    bloodType: Joi.string().valid('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
    username: Joi.string().min(1).max(100).required(),
    entryTime: Joi.date().iso().optional(),
    interactions: Joi.array().items(
        Joi.object({
            deviceId: Joi.string().required(),
            deviceName: Joi.string().required(),
            actionType: Joi.string().required(),
            data: Joi.object().optional(),
            timestamp: Joi.date().iso().optional()
        })
    ).optional()
}).unknown(true);

const updateSchema = Joi.object({
    bloodType: Joi.string().valid('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
    username: Joi.string().min(1).max(100).optional(),
    interactions: Joi.array().items(
        Joi.object({
            deviceId: Joi.string().required(),
            deviceName: Joi.string().required(),
            actionType: Joi.string().required(),
            data: Joi.object().optional(),
            timestamp: Joi.date().iso().optional()
        })
    ).optional()
}).unknown(true);

const interactionSchema = Joi.object({
    deviceId: Joi.string().required(),
    deviceName: Joi.string().required(),
    actionType: Joi.string().required(),
    data: Joi.object().optional(),
    timestamp: Joi.date().iso().optional()
});

const batchCreateSchema = Joi.array().items(userSchema).min(1);

const validators = {
    validateUser: (data) => {
        const { error, value } = userSchema.validate(data);
        if (error) {
            throw new Error(`Validation error: ${error.details[0].message}`);
        }
        return value;
    },

    validateUpdate: (data) => {
        const { error, value } = updateSchema.validate(data);
        if (error) {
            throw new Error(`Validation error: ${error.details[0].message}`);
        }
        return value;
    },

    validateInteraction: (data) => {
        const { error, value } = interactionSchema.validate(data);
        if (error) {
            throw new Error(`Validation error: ${error.details[0].message}`);
        }
        return value;
    },

    validateBatchCreate: (data) => {
        const { error, value } = batchCreateSchema.validate(data);
        if (error) {
            throw new Error(`Validation error: ${error.details[0].message}`);
        }
        return value;
    },

    validateUUID: (uuid) => {
        const { error } = Joi.string().guid({ version: 'uuidv4' }).validate(uuid);
        if (error) {
            throw new Error('Invalid UUID format');
        }
        return uuid;
    }
};

module.exports = validators;