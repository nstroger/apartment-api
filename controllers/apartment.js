import Joi from 'joi';
import { assign } from 'lodash';

import Apartment from '../models/apartment.model';
import { response } from '../utils';

export const getApartment = async (req, res, next) => {
  const id = req.params.id;

  try {
    const apartment = await Apartment.findById(id).populate('realtor');

    if (apartment) {
      res.send( response(1, apartment) );
    } else {
      res.status(404).send(
        response(0, "Can't find the apartment")
      );
    }
  } catch(err) {
    next(err);
  }
}

const getCondition = (data) => {
  const opMap = {
    'lt': '$lt',
    'eq': '$eq',
    'gt': '$gt'
  };
  const cond = {};
  if (data.sizeOp && data.sizeVal !== undefined) {
    cond['floorAreaSize'] = {
      [opMap[data.sizeOp]]: data.sizeVal
    }
  }
  if (data.priceOp && data.priceVal !== undefined) {
    cond['pricePerMonth'] = {
      [opMap[data.priceOp]]: data.priceVal
    }
  }
  if (data.roomsOp && data.roomsVal !== undefined) {
    cond['numberOfRooms'] = {
      [opMap[data.roomsOp]]: data.roomsVal
    }
  }

  return cond;
}

export const filterApartments = async (req, res, next) => {
  try {
    const inputSchema = Joi.object().keys({
      sizeOp: Joi.string().valid(['gt', 'lt', 'eq']),
      sizeVal: Joi.number(),
      priceOp: Joi.string().valid(['gt', 'lt', 'eq']),
      priceVal: Joi.number(),
      roomsOp: Joi.string().valid(['gt', 'lt', 'eq']),
      roomsVal: Joi.number().integer()
    });

    const data = await Joi.validate(req.query, inputSchema);

    const cond = getCondition(data);
    if (req.user.role === 'client') {
      cond.status = 'Available';
    } else if (req.user.role === 'realtor') {
      cond.realtor = req.user._id;
    }

    const apartments =
      await Apartment.find(cond).populate('realtor');

    res.send( response(1, apartments) );
  } catch(err) {
    next(err);
  }
}

export const createApartment = async (req, res, next) => {

  const inputSchema = Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    floorAreaSize: Joi.number().positive().required(),
    pricePerMonth: Joi.number().positive().required(),
    numberOfRooms: Joi.number().positive().integer().required(),
    address: Joi.string().required().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    realtor: Joi.string().allow(''),
    status: Joi.string().valid(['Available', 'Rented']).required()
  });

  try {

    const data = await Joi.validate(req.body, inputSchema);

    if (!data.realtor) {
      data.realtor = req.user;
    }

    if (req.user.role === 'realtor') {
      data.realtor = req.user;
    }

    const apartment = new Apartment(data);
    await apartment.save();

    res.status(201).send(
      response(1, apartment)
    );
  } catch (err) {
    next(err);
  }

}

export const updateApartment = async (req, res, next) => {

  const obj = {
    name: Joi.string(),
    description: Joi.string().allow(''),
    floorAreaSize: Joi.number().positive(),
    pricePerMonth: Joi.number().positive(),
    numberOfRooms: Joi.number().positive().integer(),
    address: Joi.string(),
    latitude: Joi.number(),
    longitude: Joi.number(),
    realtor: Joi.string(),
    status: Joi.string().valid(['Available', 'Rented'])
  };

  if (req.user.role === 'realtor') {
    delete obj.realtor;
  }

  const inputSchema = Joi.object().keys(obj);

  const id = req.params.id;

  try {
    const data = await Joi.validate(req.body, inputSchema);

    const apartment = await Apartment.findById(id);

    if (apartment) {

      assign(apartment, data);

      await apartment.save();

    } else {
      res.status(404).send(
        response(0, "Can't find the apartment")
      );

      return;
    }

    res.send( response(1, 'Apartment updated successfully') );
  } catch (err) {
    next(err);
  }

}

export const deleteApartment = async(req, res, next) => {
  const id = req.params.id;

  try {
    const apartment = await Apartment.findByIdAndDelete(id);

    if (apartment) {
      res.send( response(1, "Apartment deleted successfully") );
    } else {
      res.status(404).send(
        response(0, "Can't find the apartment")
      );
    }

  } catch(err) {
    next(err);
  }
}

