import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { assign } from 'lodash';

import config from '../config/consts';
import User from '../models/user.model';
import {
  getToken,
  response,
  sendEmail,
  encodeEmail,
  emailMsg,
  decodeToken,
  log
} from '../utils';


export const login = async (req, res, next) => {
  const loginFields = Joi.object().keys({
    email   : Joi.string().email().required(),
    password: Joi.string().max(255).min(8).required(),
  });

  try {
    const data = await Joi.validate(req.body, loginFields);
    const user = await User.findOne({ email: data.email });

    if (!user) {
      res.status(401).send(
        response(0, 'Invalid email or password')
      );

      return;
    }

    if (!user.verified) {
      res.status(401).send(
        response(0, 'Please verify your email')
      );
      return;
    }

    user.comparePassword(data.password, (err, match) => {
      if (err) next(err);

      if (match) {
        const token = getToken(user);

        res.send(
          response(1, { user, token })
        );
      } else {
        res.status(401).send(
          response(0, 'Invalid email or password')
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  const registerFields = Joi.object().keys({
    email    : Joi.string().email().required(),
    password : Joi.string().max(255).min(8).required(),
    firstname: Joi.string().max(255).required(),
    lastname : Joi.string().max(255).required()
  });

  try {
    const data = await Joi.validate(req.body, registerFields);

    data.role = 'client';

    const user = new User(data);
    await user.save();

    const token = encodeEmail(user.email);

    log('Verify token\n' + token);

    sendEmail(
      user.email,
      'Welcome to Apartments',
      emailMsg(token)
    );

    res.status(201).send(
      response(1, 'User registered successfully')
    );
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  const inputSchema = Joi.object().keys({
    token: Joi.string().required()
  });

  try {

    const data = await Joi.validate(req.body, inputSchema);

    const decoded = decodeToken(data.token);

    if (!decoded) {
      res.status(400).send( response(0, 'Token is invalid or expired') );
      return;
    }

    const user = await User.findOne({
      email: decoded.email
    });

    if (!user) {
      res.status(400).send( response(0, 'Token is invalid or expired') );
      return;
    } else if (user.verified) {
      res.send( response(0, 'The user is already verified') );
      return;
    }

    user.verified = true;
    await user.save();

    res.send(
      response(1, {
        user: user,
        token: getToken(user),
      })
    );
  } catch (err) {
    next(err);
  }
}

export const resendEmail = async (req, res, next) => {
  const inputSchema = Joi.object().keys({
    email    : Joi.string().email().required()
  });

  try {
    const data = await Joi.validate(req.body, inputSchema);

    const user = await User.findOne(data);

    if (!user) {
      res.send(
        response(0, 'You are not registered yet')
      );

      return;
    } else if (user.verified) {
      res.send(
        response(0, 'You have already verified email')
      );

      return;
    }

    const token = encodeEmail(user.email);

    log('Verify Token \n' + token);

    sendEmail(
      user.email,
      'Welcome to Apartments',
      emailMsg(token)
    );

    res.send(
      response(1, 'Email sent successfully')
    );
  } catch(err) {
    next(err);
  }
}

export const getAllUsers = async (req, res, next) => {
  try {
    const role = req.query.role;

    if (role && role !== 'realtor' && role !== 'client') {
      res.status(400).send(
        response(0, 'Invalid role')
      );

      return;
    }

    let options = {
      role: {$in: ['realtor', 'client']}
    };

    if (role) {
      options = { role };
    }

    const users = await User.find(options);

    res.send( response(1, users) );
  } catch(err) {
    next(err);
  }
}

export const getUser = async (req, res, next) => {
  const id = req.params.id;

  try {
    const user = await User.findById(id);

    if (user) {
      if (user.role === 'admin') {
        res.status(403).send(
          response(0, 'Permission denied')
        );
      } else {
        res.send( response(1, user) );
      }
    } else {
      res.status(404).send(
        response(0, "User does not exist")
      );
    }
  } catch(err) {
    next(err);
  }
}

export const createUser = async (req, res, next) => {

  const inputSchema = Joi.object().keys({
    email    : Joi.string().email().required(),
    password : Joi.string().max(255).min(8).required(),
    firstname: Joi.string().max(255).required(),
    lastname : Joi.string().max(255).required(),
    role     : Joi.string().valid(['realtor', 'client']).required(),
    verified : Joi.boolean()
  });

  try {

    const data = await Joi.validate(req.body, inputSchema);

    const user = new User(data);
    await user.save();

    const token = encodeEmail(user.email);

    sendEmail(
      user.email,
      'You are invited to Apartments',
      emailMsg(token)
    );

    res.status(201).send(
      response(1, user)
    );
  } catch (err) {
    next(err);
  }

}

export const updateUser = async (req, res, next) => {

  const inputSchema = Joi.object().keys({
    email: Joi.string().email(),
    firstname : Joi.string().max(255),
    lastname : Joi.string().max(255),
    password : Joi.string().max(255).min(8),
    role : Joi.string().valid(['realtor', 'client']),
    verified: Joi.boolean()
  });

  const id = req.params.id;

  try {
    const data = await Joi.validate(req.body, inputSchema);

    const user = await User.findById(id);

    if (user) {
      if (user.role === 'admin') {
        res.status(403).send(
          response(0, 'Permission denied')
        );

        return;
      }

      assign(user, data);
      await user.save();

      res.send( response(1, 'User updated successfully') );

    } else {
      res.status(404).send(
        response(0, 'Can\'t find the user' )
      );
    }

  } catch (err) {
    next(err);
  }

}

export const deleteUser = async(req, res, next) => {
  const id = req.params.id;

  try {
    const user = await User.findById(id);

    if (user) {
      if (user.role === 'admin') {
        res.status(403).send(
          response(0, 'Permission denied')
        );

        return;
      }

      user.remove();

      res.send( response(1, 'User deleted successfully') );
    } else {
      res.status(404).send(
        response(0, "Can't find the user")
      );
    }

  } catch(err) {
    next(err);
  }
}

export const updateProfile = async (req, res, next) => {

  const inputSchema = Joi.object().keys({
    email: Joi.string().email(),
    firstname : Joi.string().max(255),
    lastname : Joi.string().max(255),
  });

  const id = req.user._id;

  try {
    const data = await Joi.validate(req.body, inputSchema);

    assign(req.user, data);
    await req.user.save();

    res.send( response(1, 'Profile updated successfully') );

  } catch (err) {
    next(err);
  }

}


export const changePassword = async (req, res, next) => {

  const inputSchema = Joi.object().keys({
    oldPassword: Joi.string().max(255).min(8).required(),
    newPassword: Joi.string().max(255).min(8).required()
  });

  const id = req.user._id;

  try {
    const data = await Joi.validate(req.body, inputSchema);

    req.user.comparePassword(data.oldPassword, async (err, match) => {
      if (err) next(err);

      if (match) {
        req.user.password = data.newPassword;

        await req.user.save();

        res.send(
          response(1, 'Password changed successfully')
        );
      } else {
        res.status(400).send(
          response(0, 'Wrong password')
        );
      }
    });

  } catch (err) {
    next(err);
  }

}
