import User from '../models/user.model';
import { log } from '../utils';
import connectToDb from '../config/db';

const createAdmin = async () => {
  const user = new User({
    email: 'admin@example.com',
    firstname: 'Admin',
    lastname: 'User',
    password: 'qwer1234',
    role: 'admin',
    verified: true
  });

  await user.save();
}

connectToDb();

  let admin;

User.findOne({ role: 'admin' })
  .then(user => {
    if (!user) {
      return createAdmin();
    }
    return user;
  })
  .then(console.log)
  .catch(console.log);
