import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: '' }, // base64 string
  url: { type: String, default: '' },
  coinPrice: { type: Number, default: 0 },
  price: { type: Number, default: 0 }, // real money price
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  secondhand: { type: Boolean, default: false },
  purchased: { type: Boolean, default: false },
  purchasedAt: { type: Date },
  purchasedWith: { type: String, enum: ['coins', 'money', 'both'], default: 'coins' }
}, { timestamps: true });

export default mongoose.model('Wishlist', wishlistSchema);

