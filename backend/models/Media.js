import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  dbLinks: [{ type: String }],
  type: { 
    type: String, 
    enum: [
      'anime movie',
      'anime tv serial',
      'ero anime',
      'ero manga',
      'fiction book',
      'game',
      'manga',
      'manhwa',
      'movie',
      'non fiction book',
      'online game',
      'tv serial',
      'vn game'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['backlog', 'not started', 'in progress', 'done'],
    default: 'backlog'
  },
  year: { type: Number },
  coverImage: { type: String, default: '' },
  description: { type: String, default: '' },
  externalSources: [{ type: String }], // URLs that recommend this media
  countryOrigin: { type: String, default: '' },
  reward: {
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 }
  },
  unlockables: {
    skills: [{ type: String }],
    items: [{ type: String }],
    characters: [{ type: String }]
  },
  relatedGoals: [{ type: String }]
}, { timestamps: true });

// Auto-calculate external source count
mediaSchema.virtual('externalSourceCount').get(function() {
  return this.externalSources ? this.externalSources.length : 0;
});

export default mongoose.model('Media', mediaSchema);

