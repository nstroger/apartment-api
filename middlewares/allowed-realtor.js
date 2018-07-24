import Apartment from '../models/apartment.model';
import { response } from '../utils';

export default async (req, res, next) => {
  const id = req.params.id;

  try {

    const apartment = await Apartment.findById(id);

    if (!apartment) {
      res.status(404).send(
        response(0, "Can't find the apartment")
      );

      return;
    }

    if (req.user.role !== 'admin' && !req.user._id.equals(apartment.realtor)) {
      res.status(403).send(
        response(0, "Permission denied")
      );

      return;
    }

    next();

  } catch (err) {
    next(err);
  }

}