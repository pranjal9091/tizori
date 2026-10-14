import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Gullak } from '../models/Gullak';
import { Transaction } from '../models/Transaction';
import { Subscription } from '../models/Subscription';
import { RecurringBill } from '../models/RecurringBill';

export async function runSeed(): Promise<void> {
  console.log('🌱 Seeding PocketPaisa with real-life student/fresher data...');

  const demoEmail = 'demo@pocketpaisa.app';

  const existingUser = await User.findOne({ email: demoEmail });
  if (existingUser) {
    await Promise.all([
      Gullak.deleteMany({ userId: existingUser._id }),
      Transaction.deleteMany({ userId: existingUser._id }),
      Subscription.deleteMany({ userId: existingUser._id }),
      RecurringBill.deleteMany({ userId: existingUser._id }),
      User.deleteOne({ _id: existingUser._id }),
    ]);
  }

  // 1. Create Demo User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const demoUser = await User.create({
    name: 'Aman Verma',
    email: demoEmail,
    passwordHash,
    monthlyIncome: 35000, // Monthly stipend / salary / pocket money
    currency: 'INR',
    tier: 'pro',
  });

  console.log(`👤 Created Demo User: ${demoUser.name} (${demoUser.email})`);

  // 2. Create 4 Digital Gullaks (Piggy Bank Goals)
  const goaDate = new Date();
  goaDate.setMonth(goaDate.getMonth() + 2);
  const phoneDate = new Date();
  phoneDate.setMonth(phoneDate.getMonth() + 5);
  const momDate = new Date();
  momDate.setDate(momDate.getDate() + 25);
  const emgDate = new Date();
  emgDate.setMonth(emgDate.getMonth() + 6);

  await Gullak.create([
    {
      userId: demoUser._id,
      name: 'Goa Coastal Retreat',
      targetAmount: 15000,
      currentAmount: 9200,
      emoji: '🏖️',
      category: 'Travel',
      targetDate: goaDate,
      notes: 'Beach resort accommodation, local transit, and dining pool',
    },
    {
      userId: demoUser._id,
      name: 'Workstation Setup & Tech',
      targetAmount: 55000,
      currentAmount: 24000,
      emoji: '💻',
      category: 'Electronics',
      targetDate: phoneDate,
      notes: 'Upgrading monitor and primary development machine',
    },
    {
      userId: demoUser._id,
      name: "Family Anniversary Gift",
      targetAmount: 6000,
      currentAmount: 4800,
      emoji: '🎁',
      category: 'Family',
      targetDate: momDate,
      notes: 'Celebration dinner and commemorative gift',
    },
    {
      userId: demoUser._id,
      name: 'Emergency Medical Reserve',
      targetAmount: 20000,
      currentAmount: 14500,
      emoji: '🛡️',
      category: 'Emergency',
      targetDate: emgDate,
      notes: 'Strict liquid reserve for unexpected health or home needs',
    },
  ]);

  console.log(`🐷 Created 4 Digital Goal Vaults`);

  // 3. Create Everyday Realistic Transactions for the Month
  const now = new Date();
  const txList = [
    // Needs (Rent, Bills, Commute)
    { title: 'Apartment Rent & Maintenance', amount: 10500, type: 'expense', category: 'Rent & Housing', bucket: 'needs', daysAgo: 13 },
    { title: 'Monthly Groceries & Essentials', amount: 4200, type: 'expense', category: 'Groceries & Supplies', bucket: 'needs', daysAgo: 12 },
    { title: 'Transit Pass & Metro Card', amount: 800, type: 'expense', category: 'Transit & Commute', bucket: 'needs', daysAgo: 11 },
    { title: 'High-Speed Broadband Internet', amount: 749, type: 'expense', category: 'Utilities & Bills', bucket: 'needs', daysAgo: 10 },
    { title: 'Pharmacy & Health Supplies', amount: 260, type: 'expense', category: 'Healthcare', bucket: 'needs', daysAgo: 7 },

    // Everyday Wants (Coffee, Dining, Entertainment)
    { title: 'Artisanal Coffee & Pastry', amount: 160, type: 'expense', category: 'Dining & Cafes', bucket: 'wants', daysAgo: 1 },
    { title: 'Dinner Delivery with Colleagues', amount: 380, type: 'expense', category: 'Dining & Cafes', bucket: 'wants', daysAgo: 2 },
    { title: 'Afternoon Tea & Snacks', amount: 90, type: 'expense', category: 'Dining & Cafes', bucket: 'wants', daysAgo: 3 },
    { title: 'Rideshare to Downtown Hub', amount: 140, type: 'expense', category: 'Transit & Commute', bucket: 'wants', daysAgo: 4 },
    { title: 'Weekend Team Dinner', amount: 620, type: 'expense', category: 'Dining & Cafes', bucket: 'wants', daysAgo: 5 },
    { title: 'Cinema Screening & Concessions', amount: 480, type: 'expense', category: 'Entertainment', bucket: 'wants', daysAgo: 6 },
    { title: 'Coffee Roastery Tasting', amount: 150, type: 'expense', category: 'Dining & Cafes', bucket: 'wants', daysAgo: 7 },
    { title: 'Apparel & Work Wardrobe', amount: 1299, type: 'expense', category: 'Shopping', bucket: 'wants', daysAgo: 8 },
    { title: 'Weekend Brunch Meetup', amount: 450, type: 'expense', category: 'Dining & Cafes', bucket: 'wants', daysAgo: 9 },
    { title: 'Quick Grocery Restock', amount: 240, type: 'expense', category: 'Dining & Cafes', bucket: 'wants', daysAgo: 10 },

    // Savings Vault Deposits
    { title: 'Deposit into Goa Coastal Retreat 🏖️', amount: 2000, type: 'gullak_deposit', category: 'Goal Savings', bucket: 'savings', daysAgo: 11 },
    { title: 'Deposit into Family Anniversary Gift 🎁', amount: 1500, type: 'gullak_deposit', category: 'Goal Savings', bucket: 'savings', daysAgo: 6 },
    { title: 'Roundup Deposit into Tech Setup 💻', amount: 300, type: 'gullak_deposit', category: 'Goal Savings', bucket: 'savings', daysAgo: 2 },
  ];

  const docs = txList.map(item => {
    const d = new Date();
    d.setDate(d.getDate() - item.daysAgo);
    return {
      userId: demoUser._id,
      title: item.title,
      amount: item.amount,
      type: item.type as any,
      category: item.category,
      bucket: item.bucket as any,
      date: d,
    };
  });

  await Transaction.insertMany(docs);
  console.log(`🧾 Seeded ${docs.length} realistic everyday transactions`);

  // 4. Create Realistic Recurring Subscriptions
  const spotifyDate = new Date();
  spotifyDate.setDate(spotifyDate.getDate() + 4);
  const wifiDate = new Date();
  wifiDate.setDate(wifiDate.getDate() + 11);
  const gymDate = new Date();
  gymDate.setDate(gymDate.getDate() + 18);
  const cloudDate = new Date();
  cloudDate.setDate(cloudDate.getDate() + 23);

  await RecurringBill.create([
    {
      userId: demoUser._id,
      name: 'Spotify Premium Student Duo',
      amount: 149,
      frequency: 'monthly',
      category: 'Entertainment',
      nextBillingDate: spotifyDate,
      paymentMethod: 'UPI AutoPay (Google Pay)',
      reminderDaysBefore: 2,
      notes: 'Music & podcasts subscription',
      status: 'active',
    },
    {
      userId: demoUser._id,
      name: 'High-Speed Fiber Broadband (300 Mbps)',
      amount: 825,
      frequency: 'monthly',
      category: 'Utilities & Bills',
      nextBillingDate: wifiDate,
      paymentMethod: 'UPI AutoPay (Paytm)',
      reminderDaysBefore: 3,
      notes: 'Work-from-home internet connection',
      status: 'active',
    },
    {
      userId: demoUser._id,
      name: 'Cult.Fit Gym Membership',
      amount: 1450,
      frequency: 'monthly',
      category: 'Health & Fitness',
      nextBillingDate: gymDate,
      paymentMethod: 'Credit Card Auto-Debit',
      reminderDaysBefore: 3,
      notes: 'Fitness center pass',
      status: 'active',
    },
    {
      userId: demoUser._id,
      name: 'Google One 100GB Cloud Storage',
      amount: 130,
      frequency: 'monthly',
      category: 'Software & Cloud',
      nextBillingDate: cloudDate,
      paymentMethod: 'Debit Card',
      reminderDaysBefore: 2,
      notes: 'Photo and document cloud backup',
      status: 'active',
    },
  ]);
  console.log(`💳 Seeded 4 recurring subscription commitments`);
  console.log('✨ Seed complete!');
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await runSeed();
      await disconnectDB();
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}
