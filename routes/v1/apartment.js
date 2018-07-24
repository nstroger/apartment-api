import express from 'express';
import {
  getApartment,
  getAllApartments,
  createApartment,
  updateApartment,
  deleteApartment,
  filterApartments
} from '../../controllers/apartment';
import { requireRoles, allowedRealtor } from '../../middlewares';

export default () => {

  const reatorPrevilage = requireRoles(['realtor', 'admin']);

  const router = express.Router();

  router.get('/', filterApartments);
  router.post('/', reatorPrevilage, createApartment);
  router.get('/:id', getApartment);
  router.put('/:id', [reatorPrevilage, allowedRealtor], updateApartment);
  router.delete('/:id', [reatorPrevilage, allowedRealtor], deleteApartment);

  return router;
}

