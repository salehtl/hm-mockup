import { useState, useEffect } from 'react'
import { useEntity } from '@/contexts/EntityContext'

interface Service {
  id: string
  entityId: string
  name: string
  type: number
  dcxIds: string[]
  owner: string
}

interface Channel {
  id: string
  entityId: string
  type: 'app' | 'web' | 'service_center'
  name: string
}

interface ServiceReview {
  id: string
  serviceId: string
  ts: string
  channelOfReview: 'app' | 'web' | 'shared'
  phase?: 'process' | 'deliverable'
  score: number
  n: number
}

interface ChannelRating {
  id: string
  channelId?: string
  boothId?: string
  ts: string
  score: number
  n: number
}

interface DCXReview {
  id: string
  dcxId: string
  ts: string
  score: number
  n: number
}

interface Booth {
  id: string
  centerId: string
  name: string
}

interface ServiceChannel {
  serviceId: string
  channelId: string
  isAvailableVia: boolean
}

export function useApiData() {
  const { selectedEntityId } = useEntity()
  const [services, setServices] = useState<Service[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [serviceReviews, setServiceReviews] = useState<ServiceReview[]>([])
  const [channelRatings, setChannelRatings] = useState<ChannelRating[]>([])
  const [dcxReviews, setDcxReviews] = useState<DCXReview[]>([])
  const [booths, setBooths] = useState<Booth[]>([])
  const [serviceChannels, setServiceChannels] = useState<ServiceChannel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [
          servicesRes,
          channelsRes,
          serviceReviewsRes,
          channelRatingsRes,
          dcxReviewsRes,
          boothsRes,
          serviceChannelsRes,
        ] = await Promise.all([
          fetch('http://localhost:3001/services'),
          fetch('http://localhost:3001/channels'),
          fetch('http://localhost:3001/serviceReviews'),
          fetch('http://localhost:3001/channelRatings'),
          fetch('http://localhost:3001/dcxReviews'),
          fetch('http://localhost:3001/booths'),
          fetch('http://localhost:3001/serviceChannels'),
        ])

        const [
          servicesData,
          channelsData,
          serviceReviewsData,
          channelRatingsData,
          dcxReviewsData,
          boothsData,
          serviceChannelsData,
        ] = await Promise.all([
          servicesRes.json(),
          channelsRes.json(),
          serviceReviewsRes.json(),
          channelRatingsRes.json(),
          dcxReviewsRes.json(),
          boothsRes.json(),
          serviceChannelsRes.json(),
        ])

        // Filter data by selected entity if not "all"
        const filteredServices = selectedEntityId === 'all' 
          ? servicesData 
          : servicesData.filter((s: Service) => s.entityId === selectedEntityId)
        
        const filteredChannels = selectedEntityId === 'all'
          ? channelsData
          : channelsData.filter((c: Channel) => c.entityId === selectedEntityId)

        setServices(filteredServices)
        setChannels(filteredChannels)
        setServiceReviews(serviceReviewsData)
        setChannelRatings(channelRatingsData)
        setDcxReviews(dcxReviewsData)
        setBooths(boothsData)
        setServiceChannels(serviceChannelsData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedEntityId])

  return {
    services,
    channels,
    serviceReviews,
    channelRatings,
    dcxReviews,
    booths,
    serviceChannels,
    isLoading,
  }
}