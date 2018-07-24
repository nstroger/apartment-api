import Mongoose from 'mongoose';

import logger from './logger';
import config from './consts';
import { log } from '../utils';

Mongoose.Promise = global.Promise;

const connectToDb = async () => {
  const {
    dbHost,
    dbPort,
    dbName,
    dbUser,
    dbPassword,
  } = config;

  try {

    if (dbHost === 'localhost') {
      await Mongoose.connect(`mongodb://${dbHost}:${dbPort}/${dbName}`);
    } else {
      await Mongoose.connect(`mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`);
    }

    log('Connected to mongo!!!');

  } catch (err) {

    log('Could not connect to MongoDB');

  }
};

export default connectToDb;
