const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true, 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userModel', 
    required: true,
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
  } 
});


refreshTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);