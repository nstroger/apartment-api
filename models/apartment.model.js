import mongoose from 'mongoose';

const ApartmentSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  floorAreaSize: {
    type: Number,
  },
  pricePerMonth: {
    type: Number,
  },
  numberOfRooms: {
    type: Number,
    default: 1
  },
  address: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  created: {
    type: Date,
    default: () => new Date()
  },
  realtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    default: 'available'
  }
});

const ApartmentModel = mongoose.model('Apartment', ApartmentSchema);

export default ApartmentModel;
