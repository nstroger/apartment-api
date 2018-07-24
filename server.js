import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import passport from 'passport';

import logger from './config/logger';
import config from './config/consts';
import passportConfig from './config/passport';
import connectToDb from './config/db';
import { response, log } from './utils';

import v1Routes from './routes/v1';

const port = config.serverPort;

logger.stream = {
  write: (message) => {
    log(message);
  },
};

connectToDb();

const app = express();
app.disable('x-powered-by');

passportConfig(passport);
app.use(passport.initialize());

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev', { stream: logger.stream }));

app.use('/api/v1', v1Routes(passport));

// Index route
app.get('/', (req, res) => {
  res.send('Node API');
});

app.use((err, req, res, next) => {
  if (err) {
    log(err);

    if (err.isJoi) {
      res.status(400).send(
        response(0, err.details[0].message)
      );
    } else if (err.code === 11000) {
      res.status(422).send(
        response(0, 'Already exists')
      );
    } else if (err.name==='CastError' && err.kind==='ObjectId') {
      res.status(404).send(
        response(0, 'Can\'t find the ' + err.model.modelName.toLowerCase())
      );
    } else {
      res.status(500).send(
        response(0, 'Server side error')
      );
    }
  } else {
    next();
  }
});

app.listen(port, () => {
  logger.info('server started - ', port);
});

export default app;
