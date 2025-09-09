import { useState, useEffect } from 'react'
import { useEntity } from '@/contexts/EntityContext'
import { calculateEntityScore, calculateEntityServiceScore, calculateChannelTypeScore } from '@/lib/calculations'
import { apiEndpoints } from '@/lib/api'

interface TrendDataPoint {
  date: string
  entityScore: number
  serviceScore: number
  channelScore: number
  volume: number
}

export function useTrendData() {
  const { selectedEntityId } = useEntity()
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [dcxTrendData, setDcxTrendData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTrendData() {
      setIsLoading(true)
      try {
        // Fetch all necessary data for trend calculations
        const [
          servicesRes,
          channelsRes,
          serviceReviewsRes,
          channelRatingsRes,
          dcxReviewsRes,
          boothsRes,
        ] = await Promise.all([
          fetch(apiEndpoints.services),
          fetch(apiEndpoints.channels),
          fetch(apiEndpoints.serviceReviews),
          fetch(apiEndpoints.channelRatings),
          fetch(apiEndpoints.dcxReviews),
          fetch(apiEndpoints.booths),
        ])

        const [
          allServices,
          allChannels,
          allServiceReviews,
          allChannelRatings,
          allDcxReviews,
          allBooths,
        ] = await Promise.all([
          servicesRes.json(),
          channelsRes.json(),
          serviceReviewsRes.json(),
          channelRatingsRes.json(),
          dcxReviewsRes.json(),
          boothsRes.json(),
        ])

        // Filter data by selected entity if not "all"
        const services = selectedEntityId === 'all' 
          ? allServices 
          : allServices.filter((s: any) => s.entityId === selectedEntityId)
        
        const channels = selectedEntityId === 'all'
          ? allChannels
          : allChannels.filter((c: any) => c.entityId === selectedEntityId)

        // Group data by time periods
        const timePoints = [
          '2025-04-01', '2025-05-01', '2025-06-01', 
          '2025-07-01', '2025-08-01', '2025-09-01'
        ]

        // Calculate trend data for each time period
        const calculatedTrendData = timePoints.map(date => {
          // Filter reviews by date
          const serviceReviewsForDate = allServiceReviews.filter((r: any) => r.ts === date)
          const channelRatingsForDate = allChannelRatings.filter((r: any) => r.ts === date)
          const dcxReviewsForDate = allDcxReviews.filter((r: any) => r.ts === date)

          // Calculate scores for this time period
          const channelScores = calculateChannelTypeScore(channels, channelRatingsForDate, allBooths)
          const serviceScore = calculateEntityServiceScore(services, serviceReviewsForDate, dcxReviewsForDate)
          const entityScore = calculateEntityScore(serviceScore, channelScores.overall)

          // Calculate volume (total reviews)
          const volume = serviceReviewsForDate.reduce((sum: number, r: any) => sum + r.n, 0) +
                        channelRatingsForDate.reduce((sum: number, r: any) => sum + r.n, 0)

          return {
            date,
            entityScore,
            serviceScore,
            channelScore: channelScores.overall,
            volume
          }
        })

        setTrendData(calculatedTrendData)

        // Process DCX trend data
        const dcxTrendsByJourney: { [key: string]: any[] } = {}
        
        allDcxReviews.forEach((review: any) => {
          if (!dcxTrendsByJourney[review.dcxId]) {
            dcxTrendsByJourney[review.dcxId] = []
          }
          dcxTrendsByJourney[review.dcxId].push({
            date: review.ts,
            value: review.score,
            volume: review.n
          })
        })

        const dcxTrends = Object.entries(dcxTrendsByJourney).map(([dcxId, data]) => ({
          dcxId,
          name: getDcxName(dcxId),
          data: data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }))

        setDcxTrendData(dcxTrends)

      } catch (error) {
        console.error('Failed to fetch trend data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendData()
  }, [selectedEntityId])

  return {
    trendData,
    dcxTrendData,
    isLoading
  }
}

function getDcxName(dcxId: string): string {
  const dcxNames: { [key: string]: string } = {
    'dcx-property': 'Property Development',
    'dcx-business': 'Business Setup',
    'dcx-banking': 'Banking Onboarding',
    'dcx-credit': 'Credit & Financing',
    'dcx-wealth': 'Wealth Management',
    'dcx-healthcare': 'Healthcare Professional',
    'dcx-insurance': 'Health Insurance',
    'dcx-utility': 'Utility Connection',
    'dcx-green': 'Green Energy',
    'dcx-transport': 'Transportation Licensing'
  }
  return dcxNames[dcxId] || dcxId
}