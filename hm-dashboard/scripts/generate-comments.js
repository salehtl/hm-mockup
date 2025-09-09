import fs from 'fs';
import path from 'path';

// Comment templates for different sentiments and categories
const commentTemplates = {
  // Service Comments
  service: {
    positive: [
      "Excellent service! The staff was very helpful and the process was smooth.",
      "Quick and efficient. Completed my request in no time.",
      "Outstanding customer service. Very professional and courteous.",
      "The online process was user-friendly and straightforward.",
      "Great experience overall. Staff went above and beyond to help.",
      "Very satisfied with the service quality. Highly recommend!",
      "Fast processing time and clear instructions. Perfect!",
      "The mobile app made everything so convenient and easy.",
      "Professional service with knowledgeable staff.",
      "Seamless experience from start to finish. Thank you!",
      "The new digital system is amazing! So much faster than before.",
      "Impressed by the level of service and attention to detail.",
      "User-friendly interface and quick response times.",
      "The staff was patient and explained everything clearly.",
      "Modern and efficient. A pleasure to use this service."
    ],
    negative: [
      "Very slow service. Had to wait for hours.",
      "Confusing process and unhelpful staff.",
      "The website is difficult to navigate and keeps crashing.",
      "Poor customer service. Staff seemed uninterested in helping.",
      "Long queues and insufficient staff to handle the crowd.",
      "The mobile app doesn't work properly. Very frustrating.",
      "Complicated procedures with too much paperwork required.",
      "System was down for most of my visit. Wasted my time.",
      "Rude staff and unprofessional behavior.",
      "The online portal is outdated and user-unfriendly.",
      "Took multiple visits to complete a simple request.",
      "No clear guidance provided. Had to figure things out myself.",
      "The process is unnecessarily complex and time-consuming.",
      "Technical issues prevented me from completing my application.",
      "Inconsistent information from different staff members."
    ],
    neutral: [
      "Standard service. Nothing exceptional but got the job done.",
      "Average experience. Room for improvement in some areas.",
      "The service was okay, though it took longer than expected.",
      "Decent service but the facility could be better maintained.",
      "Acceptable service quality. Met my basic requirements.",
      "Not bad, but I've seen better service elsewhere.",
      "The process was fine, though some steps seemed redundant.",
      "Adequate service. Staff was polite but not particularly helpful.",
      "Mixed experience - some aspects were good, others not so much.",
      "Fair service. Could be improved with better organization.",
      "The service fulfilled its purpose but wasn't remarkable.",
      "Standard procedure followed. No major issues encountered.",
      "Basic service provided. Nothing to complain about specifically.",
      "The experience was neither particularly good nor bad.",
      "Functional service, though the environment could be more welcoming."
    ]
  },
  // Channel Comments
  channel: {
    positive: [
      "Love the new mobile app! So much easier than visiting in person.",
      "The website is well-designed and very intuitive to use.",
      "Great customer service center. Clean and well-organized.",
      "The online platform saved me so much time. Excellent!",
      "Convenient location and friendly staff at the service center.",
      "The digital services are top-notch. Very impressed!",
      "Easy to book appointments online. Great feature!",
      "The mobile app notifications keep me updated perfectly.",
      "Web portal is comprehensive and easy to navigate.",
      "Service center staff is knowledgeable and efficient.",
      "The app's user interface is modern and responsive.",
      "Online document upload feature works flawlessly.",
      "Accessible design makes it easy for everyone to use.",
      "The chat support on the website is very helpful.",
      "Multiple language support on the app is appreciated."
    ],
    negative: [
      "The mobile app crashes frequently. Very unreliable.",
      "Website is slow and often unresponsive during peak hours.",
      "Service center is overcrowded and poorly ventilated.",
      "The online system logged me out multiple times.",
      "App interface is confusing and not user-friendly.",
      "Long waiting times at the physical service center.",
      "Website doesn't work properly on mobile browsers.",
      "The app requires too many permissions for basic functions.",
      "Service center parking is insufficient and expensive.",
      "Online booking system frequently shows errors.",
      "The web portal design looks outdated and unprofessional.",
      "App notifications are excessive and annoying.",
      "Service center location is inconvenient and hard to reach.",
      "Website forms are too long and repetitive.",
      "The mobile app battery usage is extremely high."
    ],
    neutral: [
      "The app does its job but could use some improvements.",
      "Website functionality is basic but adequate for most needs.",
      "Service center is standard - nothing special but functional.",
      "The online platform meets basic requirements.",
      "App performance is acceptable though not outstanding.",
      "Service center facilities are adequate for the services offered.",
      "Website navigation could be more intuitive.",
      "The app has all necessary features but lacks polish.",
      "Service center staff is professional but not particularly warm.",
      "Online services are functional though not particularly exciting.",
      "The web portal does what it's supposed to do.",
      "App design is plain but gets the job done.",
      "Service center is clean but could be more modern.",
      "Website content is informative but presentation could be better.",
      "The app works fine though loading times could be faster."
    ]
  }
};

// Categories for comments
const categories = [
  'Process Efficiency', 'Staff Behavior', 'Technical Issues', 'User Interface', 
  'Wait Times', 'Documentation', 'Accessibility', 'Communication', 
  'System Performance', 'Facility Quality', 'Digital Experience', 'Service Quality'
];

// Generate random dates within the last 6 months
function getRandomDate() {
  const start = new Date();
  start.setMonth(start.getMonth() - 6);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString().split('T')[0];
}

// Generate random sentiment with weighted distribution
function getRandomSentiment() {
  const rand = Math.random();
  if (rand < 0.4) return 'positive';  // 40% positive
  if (rand < 0.7) return 'neutral';   // 30% neutral  
  return 'negative';                  // 30% negative
}

// Generate comment ID
function generateCommentId(index, type) {
  return `${type}-comment-${String(index).padStart(4, '0')}`;
}

// Generate realistic comment variations
function generateCommentVariation(template) {
  const variations = [
    template,
    template + " Thank you!",
    template + " Hope this helps other users.",
    template + " Will definitely use again.",
    template + " Much appreciated.",
    template + " Overall satisfied with the experience.",
    "Just wanted to share that " + template.toLowerCase(),
    template + " Keep up the good work!",
    "I must say, " + template.toLowerCase(),
    template + " Would recommend to others."
  ];
  
  return variations[Math.floor(Math.random() * variations.length)];
}

// Generate user demographics  
function generateUserProfile() {
  const ages = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
  const segments = ['Citizen', 'Resident', 'Tourist', 'Corporate', 'Government'];
  const languages = ['en', 'ar', 'ur', 'hi', 'fr'];
  
  return {
    age: ages[Math.floor(Math.random() * ages.length)],
    segment: segments[Math.floor(Math.random() * segments.length)],
    language: languages[Math.floor(Math.random() * languages.length)]
  };
}

// Main script
async function generateComments() {
  console.log('🚀 Starting comment generation...');
  
  // Read existing database
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  console.log('📊 Database loaded. Found:');
  console.log(`- ${db.services?.length || 0} services`);
  console.log(`- ${db.channels?.length || 0} channels`);
  console.log(`- ${db.serviceReviews?.length || 0} service reviews`);
  console.log(`- ${db.channelRatings?.length || 0} channel ratings`);
  
  // Initialize comments arrays
  const serviceComments = [];
  const channelComments = [];
  
  // Generate service comments (3-8 comments per service review)
  db.serviceReviews?.forEach((review, reviewIndex) => {
    const commentsCount = Math.floor(Math.random() * 6) + 3; // 3-8 comments
    
    for (let i = 0; i < commentsCount; i++) {
      const sentiment = getRandomSentiment();
      const template = commentTemplates.service[sentiment][
        Math.floor(Math.random() * commentTemplates.service[sentiment].length)
      ];
      const userProfile = generateUserProfile();
      
      serviceComments.push({
        id: generateCommentId(serviceComments.length + 1, 'srv'),
        serviceId: review.serviceId,
        reviewId: review.id,
        userId: `user-${Math.floor(Math.random() * 10000)}`,
        comment: generateCommentVariation(template),
        sentiment: sentiment,
        category: categories[Math.floor(Math.random() * categories.length)],
        timestamp: getRandomDate(),
        channelOfReview: review.channelOfReview,
        phase: review.phase || null,
        userProfile: userProfile,
        helpful: Math.floor(Math.random() * 15), // 0-14 helpful votes
        flagged: Math.random() < 0.02, // 2% chance of being flagged
        verified: Math.random() < 0.7 // 70% verified users
      });
    }
    
    if ((reviewIndex + 1) % 100 === 0) {
      console.log(`📝 Generated comments for ${reviewIndex + 1} service reviews...`);
    }
  });
  
  // Generate channel comments (2-6 comments per channel rating)
  db.channelRatings?.forEach((rating, ratingIndex) => {
    const commentsCount = Math.floor(Math.random() * 5) + 2; // 2-6 comments
    
    for (let i = 0; i < commentsCount; i++) {
      const sentiment = getRandomSentiment();
      const template = commentTemplates.channel[sentiment][
        Math.floor(Math.random() * commentTemplates.channel[sentiment].length)
      ];
      const userProfile = generateUserProfile();
      
      channelComments.push({
        id: generateCommentId(channelComments.length + 1, 'ch'),
        channelId: rating.channelId || null,
        boothId: rating.boothId || null,
        ratingId: rating.id,
        userId: `user-${Math.floor(Math.random() * 10000)}`,
        comment: generateCommentVariation(template),
        sentiment: sentiment,
        category: categories[Math.floor(Math.random() * categories.length)],
        timestamp: getRandomDate(),
        userProfile: userProfile,
        helpful: Math.floor(Math.random() * 12), // 0-11 helpful votes
        flagged: Math.random() < 0.02, // 2% chance of being flagged
        verified: Math.random() < 0.7 // 70% verified users
      });
    }
    
    if ((ratingIndex + 1) % 50 === 0) {
      console.log(`💬 Generated comments for ${ratingIndex + 1} channel ratings...`);
    }
  });
  
  // Add comments to database
  db.serviceComments = serviceComments;
  db.channelComments = channelComments;
  
  // Write updated database
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  
  console.log('✅ Comment generation complete!');
  console.log(`📊 Generated ${serviceComments.length} service comments`);
  console.log(`💬 Generated ${channelComments.length} channel comments`);
  console.log(`📝 Total: ${serviceComments.length + channelComments.length} comments`);
  
  // Generate summary statistics
  const totalComments = serviceComments.length + channelComments.length;
  const positiveCount = [...serviceComments, ...channelComments].filter(c => c.sentiment === 'positive').length;
  const negativeCount = [...serviceComments, ...channelComments].filter(c => c.sentiment === 'negative').length;
  const neutralCount = [...serviceComments, ...channelComments].filter(c => c.sentiment === 'neutral').length;
  
  console.log('\n📈 Sentiment Distribution:');
  console.log(`- Positive: ${positiveCount} (${((positiveCount/totalComments)*100).toFixed(1)}%)`);
  console.log(`- Neutral: ${neutralCount} (${((neutralCount/totalComments)*100).toFixed(1)}%)`);
  console.log(`- Negative: ${negativeCount} (${((negativeCount/totalComments)*100).toFixed(1)}%)`);
  
  console.log('\n🔄 Next steps:');
  console.log('1. Update data.js with new comment data');
  console.log('2. Create Comments Analysis page');
  console.log('3. Add comment filtering and search functionality');
}

// Run the script
generateComments().catch(console.error);