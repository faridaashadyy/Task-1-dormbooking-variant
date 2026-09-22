import { Booking } from '../models/Booking.js';
import Joi from 'joi';

// TODO: write a validation schema for create/update per README.md section 2.

const createBookingSchema=Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required().greater(Joi.ref('startDate')),
  purpose: Joi.string().optional(),
  bookedBy: Joi.string().optional(),
});
const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  purpose: Joi.string(),
  bookedBy: Joi.string()
});



// function publicBooking(b) {
//   return {
//     id: b._id.toString(),
//     roomNumber: b.roomNumber,
//     startDate: b.startDate,
//     endDate: b.endDate,
//     purpose: b.purpose,
//     bookedBy: publicUser(b.bookedBy),
//   };
// }

function verifyDates(startDate,endDate){
  if(new Date(startDate)>=new Date(endDate)){
    return false;
  }
  return true;
}

async function verifyBooking(roomNumber,startDate,endDate){
  const conflict = await Booking.findOne({
    roomNumber: roomNumber,
    startDate: { $lt: endDate },
    endDate: { $gt: startDate }
  });

  if (conflict) {
    return false;
  }

  return true;
}
// TODO: per README.md section 4, you will need a way to detect whether a
// proposed booking conflicts with an existing one on the same room.

// GET /api/bookings
// TODO: implement per README.md section 3.
export async function getAllBookings(req, res, next) {
  try {
    // TODO
    const booking=await Booking.find().sort({ startDate: -1 }).populate('bookedBy', 'name email').lean();
    res.json({ bookings: booking });
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getBooking(req, res, next) {
  try {
    // TODO
    const booking=await Booking.findById(req.params.id).populate('bookedBy', 'name email').lean();
    if(!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ booking:booking });
  } catch (err) { next(err); }
}

// POST /api/bookings
// TODO: implement per README.md sections 3 and 4.
export async function createBooking(req, res, next) {
  try {
    // TODO
    const { value, error } = createBookingSchema.validate(req.body);
    if(error) return res.status(400).json({ message: error.message });
    if (!verifyDates(value.startDate, value.endDate)) {
      return res.status(400).json({
        message: 'startDate must be before endDate'
      });
    }
    if(!await verifyBooking(value.roomNumber,value.startDate,value.endDate)){
      return res.status(400).json({
        message: 'Booking conflicts with an existing booking for the same room'
      });
    }
    const booking = await Booking.create(value);
    res.status(201).json({ booking: booking }); 
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id
// TODO: implement per README.md sections 3, 4, and 5.
export async function updateBooking(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }

    const roomNumber = value.roomNumber || booking.roomNumber;
    const startDate = value.startDate || booking.startDate;
    const endDate = value.endDate || booking.endDate;

    if (!verifyDates(startDate, endDate)) {
      return res.status(400).json({
        message: 'startDate must be before endDate'
      });
    }

    const conflict = await Booking.findOne({
      _id: { $ne: req.params.id },
      roomNumber: roomNumber,
      startDate: { $lt: endDate },
      endDate: { $gt: startDate }
    });

    if (conflict) {
      return res.status(409).json({
        message: 'Room is already booked for this time range'
      });
    }

    if (value.roomNumber !== undefined) {
      booking.roomNumber = value.roomNumber;
    }

    if (value.startDate !== undefined) {
      booking.startDate = value.startDate;
    }

    if (value.endDate !== undefined) {
      booking.endDate = value.endDate;
    }

    if (value.purpose !== undefined) {
      booking.purpose = value.purpose;
    }

    if (value.bookedBy !== undefined) {
      booking.bookedBy = value.bookedBy;
    }

    await booking.save();

    await booking.populate('bookedBy');

    res.json({ booking });
  } catch (err) {
    next(err);
  }
}


// DELETE /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function deleteBooking(req, res, next) {
  try {
    // TODO
    const booking=await Booking.findById(req.params.id);
    if(!booking) {
      return res.status(404).json({message: "Booking can't be found to delete it"});
    }
    await booking.deleteOne();
    res.json({ ok: true });
  } catch (err) { next(err); }
}
