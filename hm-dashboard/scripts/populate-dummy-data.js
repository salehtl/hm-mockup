import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read existing data
const dbPath = path.join(__dirname, '../data/db.json');
const existingData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Helper functions
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateId(prefix, index) {
  return `${prefix}-${index.toString().padStart(3, '0')}`;
}

// Entity data
const entityTypes = [
  'Government Department',
  'Regulatory Authority',
  'Public Service Provider',
  'Municipal Authority',
  'Federal Agency',
  'Development Authority',
  'Public Utility',
  'Educational Institution',
  'Healthcare Authority',
  'Transportation Authority'
];

const entityNames = [
  'Dubai Culture & Arts Authority',
  'Dubai Statistics Center',
  'Dubai Future Foundation',
  'Dubai Investment Development Agency',
  'Dubai International Financial Centre',
  'Dubai World Trade Centre',
  'Dubai Customs',
  'Dubai Police',
  'Dubai Civil Defence',
  'Dubai Courts',
  'Dubai Public Prosecution',
  'Dubai Health Insurance Corporation',
  'Dubai Tourism',
  'Dubai Sports Council',
  'Dubai Media Office',
  'Dubai Municipality - Waste Management',
  'Dubai Municipality - Building Permits',
  'Dubai Municipality - Public Health',
  'Knowledge and Human Development Authority',
  'Dubai Silicon Oasis Authority'
];

// Service categories and names
const serviceCategories = {
  'Licensing & Permits': [
    'Business License Application', 'Trade License Renewal', 'Building Permit', 
    'Construction License', 'Food Handler Permit', 'Health License', 'Tourism License',
    'Professional License', 'Industrial License', 'Commercial Permit'
  ],
  'Government Services': [
    'Document Authentication', 'Certificate Issuance', 'Legal Consultation',
    'Public Records Access', 'Government Payment', 'Tax Filing', 'Customs Declaration',
    'Immigration Services', 'Visa Application', 'Passport Services'
  ],
  'Public Utilities': [
    'Utility Connection', 'Meter Reading', 'Service Disconnection', 'Billing Inquiry',
    'Energy Audit', 'Water Quality Test', 'Waste Collection', 'Recycling Services',
    'Energy Consultation', 'Smart Meter Installation'
  ],
  'Healthcare': [
    'Medical Certificate', 'Health Card Issuance', 'Vaccination Record', 
    'Medical Facility License', 'Healthcare Provider Registration', 'Public Health Inspection',
    'Medical Equipment License', 'Pharmaceutical License', 'Health Insurance Registration',
    'Medical Tourism Permit'
  ],
  'Transportation': [
    'Vehicle Registration', 'Driver License', 'Traffic Fine Payment', 'Parking Permit',
    'Public Transport Card', 'Vehicle Inspection', 'Commercial Vehicle License',
    'Taxi License', 'Road Works Permit', 'Transportation Survey'
  ],
  'Education': [
    'School Admission', 'Certificate Verification', 'Educational License', 
    'Student Services', 'Teacher Registration', 'Educational Facility Permit',
    'Scholarship Application', 'Academic Records', 'Educational Assessment',
    'Training Program Registration'
  ],
  'Housing & Real Estate': [
    'Property Registration', 'Housing Permit', 'Real Estate License', 
    'Tenancy Contract', 'Property Valuation', 'Building Inspection',
    'Real Estate Investment', 'Housing Application', 'Property Tax',
    'Community Development'
  ],
  'Business & Investment': [
    'Business Registration', 'Investment Permit', 'Commercial Registration',
    'Company Formation', 'Business Consultation', 'Export License',
    'Import Permit', 'Free Zone License', 'Economic Data', 'Market Research'
  ],
  'Tourism & Culture': [
    'Tourist Visa', 'Event Permit', 'Cultural License', 'Hotel License',
    'Tour Guide License', 'Cultural Event Registration', 'Heritage Preservation',
    'Tourism Information', 'Cultural Program', 'Arts License'
  ],
  'Digital Services': [
    'Digital ID', 'Online Authentication', 'E-Signature', 'Digital Wallet',
    'Smart City Services', 'IoT Registration', 'Digital Certificate',
    'Cybersecurity Assessment', 'Digital Innovation', 'Tech License'
  ]
};

// Shared channel names
const sharedChannelNames = [
  'UAE PASS Digital Identity',
  'Smart Dubai Platform',
  'Federal eGovernment Portal',
  'Emirates Digital Wallet',
  'UAE Government Services Hub',
  'Integrated Government Platform'
];

// Generate new entities
function generateEntities() {
  const newEntities = [];
  
  for (let i = 0; i < 20; i++) {
    const entityId = generateId('ent', 100 + i);
    newEntities.push({
      id: entityId,
      name: entityNames[i],
      type: randomChoice(entityTypes),
      description: `${entityNames[i]} provides comprehensive public services and regulatory oversight.`
    });
  }
  
  return newEntities;
}

// Generate shared channels
function generateSharedChannels() {
  const sharedChannels = [];
  
  for (let i = 0; i < 6; i++) {
    const channelId = generateId('ch-shared', i + 1);
    sharedChannels.push({
      id: channelId,
      entityId: 'shared',
      type: 'shared_platform',
      name: sharedChannelNames[i]
    });
  }
  
  return sharedChannels;
}

// Generate services for all entities (existing + new)
function generateServices(allEntities) {
  const services = [...existingData.services]; // Keep existing services
  let serviceIndex = 200; // Start from a high number to avoid conflicts
  
  allEntities.forEach(entity => {
    // Skip if entity already has services
    const existingServices = existingData.services.filter(s => s.entityId === entity.id);
    if (existingServices.length > 0) return;
    
    const numServices = randomBetween(15, 35); // Each entity gets 15-35 services
    
    for (let i = 0; i < numServices; i++) {
      const category = randomChoice(Object.keys(serviceCategories));
      const serviceName = randomChoice(serviceCategories[category]);
      const serviceType = randomBetween(1, 2);
      const isDcxEnabled = Math.random() < 0.3; // 30% chance of DCX
      
      const service = {
        id: generateId('srv', serviceIndex++),
        entityId: entity.id,
        name: serviceName,
        type: serviceType,
        dcxIds: isDcxEnabled ? [generateId('dcx', randomBetween(1, 50))] : [],
        owner: entity.name,
        category: category,
        description: `${serviceName} provided by ${entity.name}`
      };
      
      services.push(service);
    }
  });
  
  return services;
}

// Generate channels for new entities
function generateChannels(newEntities, sharedChannels) {
  const channels = [...existingData.channels, ...sharedChannels];
  let channelIndex = 200;
  
  newEntities.forEach(entity => {
    // Each entity gets 2-4 channels
    const numChannels = randomBetween(2, 4);
    const channelTypes = ['app', 'web', 'service_center'];
    
    for (let i = 0; i < numChannels; i++) {
      const channelType = channelTypes[i % channelTypes.length];
      let channelName;
      
      switch (channelType) {
        case 'app':
          channelName = `${entity.name} Mobile App`;
          break;
        case 'web':
          channelName = `${entity.name} Web Portal`;
          break;
        case 'service_center':
          channelName = `${entity.name} Service Center`;
          break;
      }
      
      channels.push({
        id: generateId('ch', channelIndex++),
        entityId: entity.id,
        type: channelType,
        name: channelName
      });
    }
  });
  
  return channels;
}

// Generate service-channel relationships
function generateServiceChannels(services, channels) {
  const serviceChannels = [...existingData.serviceChannels];
  
  services.forEach(service => {
    // Skip if relationships already exist
    const existingRelations = existingData.serviceChannels.filter(sc => sc.serviceId === service.id);
    if (existingRelations.length > 0) return;
    
    // Get channels for this service's entity
    const entityChannels = channels.filter(c => c.entityId === service.entityId);
    
    // Each service is available on 60-100% of its entity's channels
    entityChannels.forEach(channel => {
      if (Math.random() < 0.8) { // 80% chance service is available on this channel
        serviceChannels.push({
          serviceId: service.id,
          channelId: channel.id,
          isAvailableVia: true
        });
      }
    });
    
    // Also add to some shared channels (20% chance each)
    const sharedChannels = channels.filter(c => c.entityId === 'shared');
    sharedChannels.forEach(sharedChannel => {
      if (Math.random() < 0.2) { // 20% chance for shared channels
        serviceChannels.push({
          serviceId: service.id,
          channelId: sharedChannel.id,
          isAvailableVia: true
        });
      }
    });
  });
  
  return serviceChannels;
}

// Generate service reviews
function generateServiceReviews(services) {
  const serviceReviews = [...existingData.serviceReviews];
  const months = ['2025-06-01', '2025-07-01', '2025-08-01', '2025-09-01'];
  const channelTypes = ['app', 'web', 'shared', 'service_center'];
  const phases = ['process', 'deliverable'];
  
  services.forEach(service => {
    // Skip if reviews already exist
    const existingReviews = existingData.serviceReviews.filter(r => r.serviceId === service.id);
    if (existingReviews.length > 0) return;
    
    // Generate reviews for multiple months
    months.forEach(month => {
      const numChannelTypes = randomBetween(1, 3); // Service gets reviews on 1-3 channel types per month
      const selectedChannels = [];
      
      for (let i = 0; i < numChannelTypes; i++) {
        const channelType = randomChoice(channelTypes.filter(c => !selectedChannels.includes(c)));
        selectedChannels.push(channelType);
        
        if (service.type === 1) {
          // Type-1: Simple service, single review
          const reviewId = `rv-${service.id.split('-')[1]}-${channelType}-${month.split('-')[1]}`;
          serviceReviews.push({
            id: reviewId,
            serviceId: service.id,
            ts: month,
            channelOfReview: channelType,
            score: randomBetween(65, 95),
            n: randomBetween(10, 200),
            ...(channelType === 'shared' && { viaChannel: randomChoice(['ch-shared-001', 'ch-shared-002', 'ch-shared-003']) })
          });
        } else {
          // Type-2: Complex service, process + deliverable reviews
          phases.forEach(phase => {
            const reviewId = `rv-${service.id.split('-')[1]}-${channelType}-${phase}-${month.split('-')[1]}`;
            serviceReviews.push({
              id: reviewId,
              serviceId: service.id,
              ts: month,
              channelOfReview: channelType,
              phase: phase,
              score: randomBetween(65, 95),
              n: randomBetween(10, 150),
              ...(channelType === 'shared' && { viaChannel: randomChoice(['ch-shared-001', 'ch-shared-002', 'ch-shared-003']) })
            });
          });
        }
      }
    });
  });
  
  return serviceReviews;
}

// Generate channel ratings
function generateChannelRatings(channels) {
  const channelRatings = [...existingData.channelRatings];
  const months = ['2025-06-01', '2025-07-01', '2025-08-01', '2025-09-01'];
  
  channels.forEach(channel => {
    // Skip if ratings already exist
    const existingRatings = existingData.channelRatings.filter(r => r.channelId === channel.id);
    if (existingRatings.length > 0) return;
    
    months.forEach(month => {
      if (channel.type !== 'service_center') {
        // App/Web channel rating
        channelRatings.push({
          id: `cr-${channel.id}-${month}`,
          channelId: channel.id,
          ts: month,
          score: randomFloat(70, 95, 1),
          n: randomBetween(50, 300)
        });
      }
    });
  });
  
  return channelRatings;
}

// Generate booths for service centers
function generateBooths(channels) {
  const booths = [...existingData.booths];
  let boothIndex = 200;
  
  channels.forEach(channel => {
    if (channel.type === 'service_center') {
      // Skip if booths already exist
      const existingBooths = existingData.booths.filter(b => b.centerId === channel.id);
      if (existingBooths.length > 0) return;
      
      const numBooths = randomBetween(3, 8);
      for (let i = 1; i <= numBooths; i++) {
        booths.push({
          id: generateId('booth', boothIndex++),
          centerId: channel.id,
          name: `${channel.name} - Booth ${i}`
        });
      }
    }
  });
  
  return booths;
}

// Generate booth ratings
function generateBoothRatings(booths) {
  const channelRatings = [...existingData.channelRatings];
  const months = ['2025-06-01', '2025-07-01', '2025-08-01', '2025-09-01'];
  
  booths.forEach(booth => {
    // Skip if ratings already exist
    const existingRatings = existingData.channelRatings.filter(r => r.boothId === booth.id);
    if (existingRatings.length > 0) return;
    
    months.forEach(month => {
      channelRatings.push({
        id: `br-${booth.id}-${month}`,
        boothId: booth.id,
        ts: month,
        score: randomFloat(68, 92, 1),
        n: randomBetween(20, 120)
      });
    });
  });
  
  return channelRatings;
}

// Generate DCX reviews
function generateDCXReviews(services) {
  const dcxReviews = [...existingData.dcxReviews];
  const months = ['2025-06-01', '2025-07-01', '2025-08-01', '2025-09-01'];
  
  // Get all unique DCX IDs from DCX-enabled services
  const dcxIds = [...new Set(services.filter(s => s.dcxIds.length > 0).flatMap(s => s.dcxIds))];
  
  dcxIds.forEach(dcxId => {
    // Skip if reviews already exist
    const existingDcxReviews = existingData.dcxReviews.filter(r => r.dcxId === dcxId);
    if (existingDcxReviews.length > 0) return;
    
    months.forEach(month => {
      dcxReviews.push({
        id: `dcx-${dcxId}-${month}`,
        dcxId: dcxId,
        ts: month,
        score: randomBetween(70, 90),
        n: randomBetween(30, 150)
      });
    });
  });
  
  return dcxReviews;
}

// Main generation function
function generateData() {
  console.log('🚀 Starting dummy data generation...');
  
  // Generate new entities
  console.log('📊 Generating 20 new entities...');
  const newEntities = generateEntities();
  const allEntities = [...existingData.entities, ...newEntities];
  
  // Generate shared channels
  console.log('🔗 Generating 6 shared channels...');
  const sharedChannels = generateSharedChannels();
  
  // Generate channels for new entities
  console.log('📱 Generating channels for new entities...');
  const allChannels = generateChannels(newEntities, sharedChannels);
  
  // Generate services
  console.log('🎯 Generating services for all entities...');
  const allServices = generateServices(allEntities);
  
  // Generate service-channel relationships
  console.log('🔗 Generating service-channel relationships...');
  const serviceChannels = generateServiceChannels(allServices, allChannels);
  
  // Generate booths
  console.log('🏢 Generating booths for service centers...');
  const booths = generateBooths(allChannels);
  
  // Generate reviews and ratings
  console.log('⭐ Generating service reviews...');
  const serviceReviews = generateServiceReviews(allServices);
  
  console.log('📊 Generating channel ratings...');
  const channelRatings = generateChannelRatings(allChannels);
  const boothRatings = generateBoothRatings(booths);
  const allChannelRatings = [...channelRatings, ...boothRatings];
  
  console.log('🔄 Generating DCX reviews...');
  const dcxReviews = generateDCXReviews(allServices);
  
  // Compile final data
  const finalData = {
    entities: allEntities,
    services: allServices,
    channels: allChannels,
    serviceChannels: serviceChannels,
    serviceReviews: serviceReviews,
    channelRatings: allChannelRatings,
    dcxReviews: dcxReviews,
    booths: booths
  };
  
  // Write to file
  console.log('💾 Writing data to db.json...');
  fs.writeFileSync(dbPath, JSON.stringify(finalData, null, 2));
  
  // Print statistics
  console.log('\n📈 Generation Complete! Statistics:');
  console.log(`├── Entities: ${finalData.entities.length} (${newEntities.length} new)`);
  console.log(`├── Services: ${finalData.services.length} (${finalData.services.length - existingData.services.length} new)`);
  console.log(`├── Channels: ${finalData.channels.length} (${finalData.channels.length - existingData.channels.length} new)`);
  console.log(`├── Service-Channel Relations: ${finalData.serviceChannels.length}`);
  console.log(`├── Service Reviews: ${finalData.serviceReviews.length}`);
  console.log(`├── Channel Ratings: ${finalData.channelRatings.length}`);
  console.log(`├── DCX Reviews: ${finalData.dcxReviews.length}`);
  console.log(`└── Booths: ${finalData.booths.length}`);
  
  console.log('\n🎉 Dummy data population complete!');
  console.log('🔍 The dashboard now has massive amounts of data to test scalability and UI performance.');
}

// Run the generation
try {
  generateData();
} catch (error) {
  console.error('❌ Error generating data:', error);
  process.exit(1);
}