import { response } from '../utils';

export default (roles) => (req, res, next) => {
  if (roles.indexOf(req.user.role) >= 0){
    next();
  } else {
    res.status(403).send(
      response(0, 'Permission denied')
    );
  }
}