import express from 'express';
import { response } from '../../utils';

import userRoutes from './user';
import apartmentRoutes from './apartment';

export default (passport) => {

  const router = express.Router();

  router.use('/users', userRoutes(passport));

  router.use(
    '/apartments',
    passport.authenticate('jwt', { session: false }),
    apartmentRoutes()
  );

  router.get(
    '/profile',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      res.send(response(1, req.user));
    }
  );

  return router;
}

