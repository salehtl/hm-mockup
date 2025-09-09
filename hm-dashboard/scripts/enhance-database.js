import fs from 'fs'
import path from 'path'

// Read the current database
const dbPath = path.join(process.cwd(), 'data', 'db.json')
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))

// Enhance entities with more realistic data
const enhancedEntities = db.entities.map(entity => {
  const enhancements = {
    // Add missing fields for realism
    establishedYear: Math.floor(Math.random() * 30) + 1995,
    employeeCount: Math.floor(Math.random() * 5000) + 500,
    website: `https://${entity.name.toLowerCase().replace(/\s+/g, '')}.ae`,
    contactPhone: `+971-${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 9000000) + 1000000}`,
    email: `info@${entity.name.toLowerCase().replace(/\s+/g, '')}.ae`,
    
    // Add more descriptive location details
    location: entity.location || 'Dubai',
    address: generateRealisticAddress(entity.name, entity.sector),
    
    // Add budget and performance metrics
    annualBudget: generateBudget(entity.sector),
    servicesCount: Math.floor(Math.random() * 25) + 5,
    
    // Add governance info
    type: entity.sector === 'Government' ? 'Government Entity' : 
          entity.sector === 'Banking' ? 'Financial Institution' :
          entity.sector === 'Healthcare' ? 'Healthcare Provider' :
          'Private Organization',
    
    // Add realistic descriptions
    description: generateEntityDescription(entity.name, entity.sector)
  }
  
  return { ...entity, ...enhancements }
})

// Enhance services with more realistic data
const enhancedServices = db.services.map(service => {
  return {
    ...service,
    // Add missing descriptions
    description: service.description || generateServiceDescription(service.name, service.type),
    
    // Add realistic processing times
    averageProcessingTime: generateProcessingTime(service.type),
    averageProcessingTimeUnit: 'minutes',
    
    // Add cost information
    serviceFee: generateServiceFee(service.name),
    currency: 'AED',
    
    // Add availability
    availability: '24/7',
    languages: ['English', 'Arabic'],
    
    // Add requirements
    requirements: generateServiceRequirements(service.name),
    
    // Add categories
    category: categorizeService(service.name),
    
    // Add priority level
    priority: Math.random() > 0.3 ? 'standard' : 'priority',
    
    // Add digital availability
    isDigitalAvailable: Math.random() > 0.2,
    
    // Add satisfaction target
    satisfactionTarget: 85 + Math.floor(Math.random() * 10),
    
    // Add version info
    version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}`,
    lastUpdated: generateRecentDate()
  }
})

// Enhance channels with more realistic data
const enhancedChannels = db.channels.map(channel => {
  const baseEnhancements = {
    // Add missing descriptions for all channels
    description: channel.description || generateChannelDescription(channel.name, channel.type),
    
    // Add operational info
    operatingHours: generateOperatingHours(channel.type),
    maxCapacity: generateCapacity(channel.type),
    
    // Add contact info
    contactInfo: generateChannelContact(channel.name, channel.type),
    
    // Add accessibility features
    accessibilityFeatures: generateAccessibilityFeatures(channel.type),
    
    // Add version/status info
    status: 'active',
    version: channel.type === 'app' ? `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}` : undefined,
    lastMaintenance: generateRecentDate(),
    
    // Add performance targets
    targetResponseTime: generateTargetResponseTime(channel.type),
    targetUptime: channel.type !== 'service_center' ? '99.9%' : '100%'
  }

  // Type-specific enhancements
  if (channel.type === 'app') {
    return {
      ...channel,
      ...baseEnhancements,
      platform: ['iOS', 'Android'],
      downloadCount: Math.floor(Math.random() * 500000) + 100000,
      appStoreRating: (4.0 + Math.random() * 1).toFixed(1),
      requiresUpdate: Math.random() > 0.8,
      supportedDevices: ['Phone', 'Tablet', 'Watch'],
      minOSVersion: 'iOS 12.0 / Android 8.0'
    }
  } else if (channel.type === 'web') {
    return {
      ...channel,
      ...baseEnhancements,
      url: `https://${channel.name.toLowerCase().replace(/\s+/g, '')}.ae`,
      browsers: ['Chrome', 'Safari', 'Firefox', 'Edge'],
      mobileOptimized: true,
      sslEnabled: true,
      cdn: 'CloudFlare',
      averageLoadTime: (Math.random() * 2 + 1).toFixed(2) + 's'
    }
  } else if (channel.type === 'service_center') {
    return {
      ...channel,
      ...baseEnhancements,
      address: generateServiceCenterAddress(channel.name),
      coordinates: generateCoordinates(),
      parkingAvailable: Math.random() > 0.3,
      publicTransportAccess: Math.random() > 0.4,
      wheelchairAccessible: Math.random() > 0.7,
      waitingArea: true,
      queueSystem: 'Digital Queue Management',
      averageWaitTime: Math.floor(Math.random() * 20) + 5 + ' minutes'
    }
  }
  
  return { ...channel, ...baseEnhancements }
})

// Enhance booths with more realistic data
const enhancedBooths = db.booths.map(booth => {
  return {
    ...booth,
    // Add booth number for organization
    boothNumber: generateBoothNumber(),
    
    // Add operational details
    operatingHours: 'Sun-Thu: 7:30-15:30, Fri-Sat: Closed',
    staffCount: Math.floor(Math.random() * 2) + 1,
    
    // Add equipment/features
    equipment: generateBoothEquipment(),
    
    // Add capacity and performance
    dailyCapacity: Math.floor(Math.random() * 50) + 30,
    averageServiceTime: Math.floor(Math.random() * 10) + 5 + ' minutes',
    
    // Add accessibility
    wheelchairAccessible: Math.random() > 0.8,
    languageSupport: ['English', 'Arabic'],
    
    // Add status
    status: Math.random() > 0.9 ? 'maintenance' : 'active',
    lastMaintenance: generateRecentDate(),
    
    // Add services offered
    servicesOffered: generateBoothServices(booth.name)
  }
})

// Helper functions for realistic data generation
function generateRealisticAddress(entityName, sector) {
  const areas = ['Downtown Dubai', 'Business Bay', 'DIFC', 'Dubai Marina', 'Jumeirah', 'Bur Dubai', 'Deira']
  const area = areas[Math.floor(Math.random() * areas.length)]
  const building = `${entityName.split(' ')[0]} Building`
  const floor = Math.floor(Math.random() * 20) + 1
  return `Floor ${floor}, ${building}, ${area}, Dubai, UAE`
}

function generateBudget(sector) {
  const budgetRanges = {
    'Government': Math.floor(Math.random() * 500000000) + 100000000,
    'Banking': Math.floor(Math.random() * 1000000000) + 500000000,
    'Healthcare': Math.floor(Math.random() * 300000000) + 50000000,
    'Education': Math.floor(Math.random() * 200000000) + 30000000,
    'Transport': Math.floor(Math.random() * 400000000) + 80000000
  }
  return budgetRanges[sector] || Math.floor(Math.random() * 100000000) + 20000000
}

function generateEntityDescription(name, sector) {
  const descriptions = {
    'Dubai Municipality': 'Leading municipal authority responsible for sustainable urban development and quality of life in Dubai',
    'Emirates NBD': 'Premier banking and financial services group serving millions of customers across the region',
    'Dubai Health Authority': 'Comprehensive healthcare provider ensuring world-class medical services and public health initiatives'
  }
  const sectorDesc = sector ? sector.toLowerCase() : 'public service'
  return descriptions[name] || `Leading ${sectorDesc} organization providing essential services and solutions`
}

function generateServiceDescription(name, type) {
  const typeDesc = type === 1 ? 'Streamlined single-step service' : 'Comprehensive multi-phase service process'
  return `${typeDesc} for ${name.toLowerCase()}. Digital-first approach with multiple channel availability.`
}

function generateProcessingTime(type) {
  return type === 1 ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 45) + 15
}

function generateServiceFee(serviceName) {
  if (serviceName.toLowerCase().includes('permit') || serviceName.toLowerCase().includes('license')) {
    return Math.floor(Math.random() * 500) + 100
  }
  if (serviceName.toLowerCase().includes('registration')) {
    return Math.floor(Math.random() * 200) + 50
  }
  return Math.floor(Math.random() * 100) + 25
}

function generateServiceRequirements(serviceName) {
  const baseReqs = ['Emirates ID', 'Valid passport']
  if (serviceName.toLowerCase().includes('business') || serviceName.toLowerCase().includes('trade')) {
    return [...baseReqs, 'Trade License', 'NOC Certificate']
  }
  if (serviceName.toLowerCase().includes('property') || serviceName.toLowerCase().includes('building')) {
    return [...baseReqs, 'Title Deed', 'NOC from Developer', 'Approved Plans']
  }
  return baseReqs
}

function categorizeService(serviceName) {
  const categories = {
    'permit': 'Permits & Licensing',
    'license': 'Permits & Licensing',
    'registration': 'Registration & Documentation',
    'property': 'Real Estate Services',
    'building': 'Construction Services',
    'trade': 'Business Services',
    'health': 'Healthcare Services',
    'education': 'Education Services',
    'transport': 'Transportation Services'
  }
  
  const name = serviceName.toLowerCase()
  for (const [key, category] of Object.entries(categories)) {
    if (name.includes(key)) return category
  }
  return 'General Services'
}

function generateChannelDescription(name, type) {
  if (type === 'app') {
    return `Mobile application providing seamless access to ${name.replace(' App', '').replace(' Mobile', '')} services with enhanced user experience`
  }
  if (type === 'web') {
    return `Official web portal offering comprehensive online services and information for ${name.replace(' Portal', '').replace(' Website', '')}`
  }
  if (type === 'service_center') {
    return `Physical service center providing in-person assistance and specialized services in ${name.replace(' Service Center', '')} area`
  }
  return `Digital channel for accessing services and support`
}

function generateOperatingHours(type) {
  if (type === 'app' || type === 'web') return '24/7'
  return 'Sunday-Thursday: 7:30-15:30, Friday: 7:30-12:00, Saturday: Closed'
}

function generateCapacity(type) {
  if (type === 'app') return Math.floor(Math.random() * 10000) + 5000 + ' concurrent users'
  if (type === 'web') return Math.floor(Math.random() * 5000) + 2000 + ' concurrent sessions'
  return Math.floor(Math.random() * 200) + 100 + ' daily visitors'
}

function generateChannelContact(name, type) {
  if (type === 'service_center') {
    return {
      phone: `+971-4-${Math.floor(Math.random() * 9000000) + 1000000}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@service.ae`,
      emergencyPhone: '+971-4-6069999'
    }
  }
  return {
    supportEmail: `support@${name.toLowerCase().replace(/\s+/g, '')}.ae`,
    helpline: '+971-600-DUBAI'
  }
}

function generateAccessibilityFeatures(type) {
  const features = ['Screen Reader Support', 'High Contrast Mode', 'Multi-language Support']
  if (type === 'service_center') {
    features.push('Wheelchair Access', 'Priority Queue for Elderly', 'Sign Language Support')
  }
  if (type === 'app') {
    features.push('Voice Commands', 'Large Text Option', 'VoiceOver Support')
  }
  return features
}

function generateTargetResponseTime(type) {
  if (type === 'app' || type === 'web') return '< 2 seconds'
  return '< 5 minutes'
}

function generateServiceCenterAddress(name) {
  const areas = ['Deira', 'Bur Dubai', 'Jumeirah', 'Al Barsha', 'Dubai Marina', 'Downtown']
  const area = name.includes('Deira') ? 'Deira' : 
               name.includes('Bur Dubai') ? 'Bur Dubai' :
               areas[Math.floor(Math.random() * areas.length)]
  return `${name}, Sheikh Zayed Road, ${area}, Dubai, UAE`
}

function generateCoordinates() {
  // Dubai coordinates range
  const lat = (25.0 + Math.random() * 0.3).toFixed(6)
  const lng = (55.1 + Math.random() * 0.3).toFixed(6)
  return { latitude: lat, longitude: lng }
}

function generateBoothNumber() {
  return `B${Math.floor(Math.random() * 20) + 1}`.padStart(3, '0')
}

function generateBoothEquipment() {
  const equipment = ['Computer Terminal', 'Document Scanner', 'Printer', 'Card Reader']
  const additional = ['Biometric Scanner', 'Signature Pad', 'Camera', 'Intercom']
  const randomAdditional = additional.filter(() => Math.random() > 0.5)
  return [...equipment, ...randomAdditional]
}

function generateBoothServices(boothName) {
  if (boothName.toLowerCase().includes('license')) {
    return ['License Applications', 'License Renewals', 'License Amendments', 'NOC Issuance']
  }
  if (boothName.toLowerCase().includes('permit')) {
    return ['Permit Applications', 'Permit Inspections', 'Permit Extensions', 'Clearance Certificates']
  }
  if (boothName.toLowerCase().includes('inquiry')) {
    return ['General Information', 'Application Status', 'Document Verification', 'Complaint Registration']
  }
  return ['Document Processing', 'Application Submission', 'Information Services']
}

function generateRecentDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
  return date.toISOString().split('T')[0]
}

// Apply enhancements to database
db.entities = enhancedEntities
db.services = enhancedServices
db.channels = enhancedChannels
db.booths = enhancedBooths

// Add missing DCX data enhancements
db.dcx = db.dcx.map(dcx => ({
  ...dcx,
  description: dcx.description || generateDCXDescription(dcx.name),
  category: categorizeDCX(dcx.name),
  estimatedDuration: generateDCXDuration(),
  complexity: Math.floor(Math.random() * 3) + 1, // 1-3 complexity
  customerSegment: generateCustomerSegment(),
  priority: Math.random() > 0.3 ? 'standard' : 'high',
  version: `${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 5)}`,
  lastReviewed: generateRecentDate()
}))

function generateDCXDescription(name) {
  return `End-to-end customer journey for ${name.toLowerCase()} with seamless multi-touchpoint experience and integrated service delivery.`
}

function categorizeDCX(name) {
  if (name.toLowerCase().includes('property') || name.toLowerCase().includes('business')) return 'Business Services'
  if (name.toLowerCase().includes('resident')) return 'Resident Services'
  if (name.toLowerCase().includes('tourism') || name.toLowerCase().includes('visitor')) return 'Tourism Services'
  return 'General Services'
}

function generateDCXDuration() {
  const durations = ['15-30 minutes', '30-60 minutes', '1-2 hours', '2-4 hours', 'Multiple sessions']
  return durations[Math.floor(Math.random() * durations.length)]
}

function generateCustomerSegment() {
  const segments = ['Individual', 'Business', 'Tourist', 'Resident', 'Corporate']
  return segments[Math.floor(Math.random() * segments.length)]
}

// Write the enhanced database back to file
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

console.log('✅ Database enhanced with realistic dummy data!')
console.log(`📊 Enhanced ${db.entities.length} entities`)
console.log(`🎯 Enhanced ${db.services.length} services`) 
console.log(`📱 Enhanced ${db.channels.length} channels`)
console.log(`🏢 Enhanced ${db.booths.length} booths`)
console.log(`🔄 Enhanced ${db.dcx.length} DCX journeys`)