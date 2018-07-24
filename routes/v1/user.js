import express from 'express';
import {
  login,
  register,
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  verifyEmail,
  resendEmail,
  updateProfile,
  changePassword
} from '../../controllers/user';
import { requireRoles } from '../../middlewares';

export default (passport) => {
  const router = express.Router();

  const authenticate = passport.authenticate('jwt', { session: false });

  router.post('/login', login);
  router.post('/register', register);
  router.post('/verify', verifyEmail);
  router.post('/resend', resendEmail);
  router.post('/profile', authenticate, updateProfile);
  router.post('/change-password', authenticate, changePassword);

  const middlewares = [
    authenticate,
    requireRoles(['admin'])
  ];

  router.get('/', middlewares, getAllUsers);
  router.post('/', middlewares, createUser);
  router.get('/:id', middlewares, getUser);
  router.put('/:id', middlewares, updateUser);
  router.delete('/:id', middlewares, deleteUser);

  return router;
}
