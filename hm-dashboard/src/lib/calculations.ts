interface ServiceReview {
  serviceId: string
  channelOfReview: 'app' | 'web' | 'shared'
  phase?: 'process' | 'deliverable'
  score: number
  n: number
}

interface ChannelRating {
  channelId?: string
  boothId?: string
  score: number
  n: number
}

interface Channel {
  id: string
  type: 'app' | 'web' | 'service_center' | 'shared_platform'
}

interface Service {
  id: string
  type: number // 1 or 2
  dcxIds: string[]
}

interface Booth {
  id: string
  centerId: string
}

interface DCXReview {
  dcxId: string
  score: number
  n: number
}

const WEIGHTS = {
  channelTypeDefault: { app: 0.5, web: 0.2, service_center: 0.3 },
  channelOfReview: { app: 0.38, web: 0.26, shared: 0.36 },
  entityScore: { service: 0.7, channel: 0.3 },
  type2Service: { process: 0.8, deliverable: 0.2 },
  dcxBlend: { standalone: 0.7, dcx: 0.3 }
}

function weightedAverage(scores: { score: number; n: number }[]): number {
  if (scores.length === 0) return 0
  
  const totalScore = scores.reduce((sum, item) => sum + (item.score * item.n), 0)
  const totalCount = scores.reduce((sum, item) => sum + item.n, 0)
  
  return totalCount > 0 ? totalScore / totalCount : 0
}

export function calculateChannelTypeScore(
  channels: Channel[], 
  channelRatings: ChannelRating[], 
  booths: Booth[]
): { app: number; web: number; service_center: number; overall: number } {
  const scores = { app: 0, web: 0, service_center: 0 }
  const counts = { app: 0, web: 0, service_center: 0 }

  // Calculate app and web scores
  channels.forEach(channel => {
    if (channel.type === 'app' || channel.type === 'web') {
      const ratings = channelRatings.filter(r => r.channelId === channel.id)
      if (ratings.length > 0) {
        const avgScore = weightedAverage(ratings)
        scores[channel.type] += avgScore
        counts[channel.type]++
      }
    }
  })

  // Calculate service center scores (booth-level → center → type)
  const serviceCenters = channels.filter(c => c.type === 'service_center')
  serviceCenters.forEach(center => {
    const centerBooths = booths.filter(b => b.centerId === center.id)
    const boothScores: { score: number; n: number }[] = []
    
    centerBooths.forEach(booth => {
      const boothRatings = channelRatings.filter(r => r.boothId === booth.id)
      if (boothRatings.length > 0) {
        const avgScore = weightedAverage(boothRatings)
        const totalCount = boothRatings.reduce((sum, r) => sum + r.n, 0)
        boothScores.push({ score: avgScore, n: totalCount })
      }
    })

    if (boothScores.length > 0) {
      const centerScore = weightedAverage(boothScores)
      scores.service_center += centerScore
      counts.service_center++
    }
  })

  // Average scores by type
  Object.keys(scores).forEach(type => {
    const key = type as keyof typeof scores
    if (counts[key] > 0) {
      scores[key] = scores[key] / counts[key]
    }
  })

  // Apply weights and redistribute if types missing
  const presentTypes = Object.keys(scores).filter(type => counts[type as keyof typeof counts] > 0)
  const totalWeight = presentTypes.reduce((sum, type) => sum + WEIGHTS.channelTypeDefault[type as keyof typeof WEIGHTS.channelTypeDefault], 0)
  
  let weightedScore = 0
  presentTypes.forEach(type => {
    const key = type as keyof typeof scores
    const weight = WEIGHTS.channelTypeDefault[key] / totalWeight // Redistribute
    weightedScore += scores[key] * weight
  })

  return {
    app: Math.round(scores.app * 100) / 100,
    web: Math.round(scores.web * 100) / 100,
    service_center: Math.round(scores.service_center * 100) / 100,
    overall: Math.round(weightedScore * 100) / 100
  }
}

export function calculateServiceStandaloneScore(
  service: Service,
  serviceReviews: ServiceReview[]
): number {
  const reviews = serviceReviews.filter(r => r.serviceId === service.id)
  if (reviews.length === 0) return 0

  if (service.type === 1) {
    // Type-1: Channel-of-review weighted average
    const channelScores: { [key: string]: { score: number; n: number }[] } = {}
    
    reviews.forEach(review => {
      if (!channelScores[review.channelOfReview]) {
        channelScores[review.channelOfReview] = []
      }
      channelScores[review.channelOfReview].push({ score: review.score, n: review.n })
    })

    let weightedScore = 0
    Object.keys(channelScores).forEach(channel => {
      const channelAvg = weightedAverage(channelScores[channel])
      const weight = WEIGHTS.channelOfReview[channel as keyof typeof WEIGHTS.channelOfReview] || 0
      weightedScore += channelAvg * weight
    })

    return Math.round(weightedScore * 100) / 100
  } else {
    // Type-2: 80% Process + 20% Deliverable
    const processReviews = reviews.filter(r => r.phase === 'process')
    const deliverableReviews = reviews.filter(r => r.phase === 'deliverable')

    const processScore = processReviews.length > 0 ? weightedAverage(processReviews) : 0
    const deliverableScore = deliverableReviews.length > 0 ? weightedAverage(deliverableReviews) : 0

    const standaloneScore = (processScore * WEIGHTS.type2Service.process) + 
                           (deliverableScore * WEIGHTS.type2Service.deliverable)

    return Math.round(standaloneScore * 100) / 100
  }
}

export function calculateServiceOverallScore(
  service: Service,
  serviceReviews: ServiceReview[],
  dcxReviews: DCXReview[]
): number {
  const standaloneScore = calculateServiceStandaloneScore(service, serviceReviews)
  
  if (service.dcxIds.length === 0) {
    return standaloneScore // No DCX influence
  }

  // Calculate DCX contribution
  const relevantDcxReviews = dcxReviews.filter(r => service.dcxIds.includes(r.dcxId))
  const dcxScore = relevantDcxReviews.length > 0 ? weightedAverage(relevantDcxReviews) : 0

  const overallScore = (standaloneScore * WEIGHTS.dcxBlend.standalone) + 
                      (dcxScore * WEIGHTS.dcxBlend.dcx)

  return Math.round(overallScore * 100) / 100
}

export function calculateEntityServiceScore(
  services: Service[],
  serviceReviews: ServiceReview[],
  dcxReviews: DCXReview[]
): number {
  if (services.length === 0) return 0

  const serviceScores: { score: number; n: number }[] = []

  services.forEach(service => {
    const overallScore = calculateServiceOverallScore(service, serviceReviews, dcxReviews)
    const serviceReviewsCount = serviceReviews
      .filter(r => r.serviceId === service.id)
      .reduce((sum, r) => sum + r.n, 0)
    
    if (serviceReviewsCount > 0) {
      serviceScores.push({ score: overallScore, n: serviceReviewsCount })
    }
  })

  return Math.round(weightedAverage(serviceScores) * 100) / 100
}

export function calculateEntityScore(
  entityServiceScore: number,
  entityChannelScore: number
): number {
  const entityScore = (entityServiceScore * WEIGHTS.entityScore.service) + 
                     (entityChannelScore * WEIGHTS.entityScore.channel)
  
  return Math.round(entityScore * 100) / 100
}