import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiData } from '@/hooks/useApiData'
import { useEntity } from '@/contexts/EntityContext'
import { calculateChannelTypeScore } from '@/lib/calculations'
import { useMemo, useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { AssetTrendChart } from '@/components/AssetTrendChart'
import { SkeletonPage } from '@/components/SkeletonLoader'
import { usePageSlicers } from '@/contexts/PageSlicersContext'

export function Channels() {
  const { } = useEntity()
  const { channels, channelRatings, booths, services, serviceChannels, serviceReviews, isLoading } = useApiData()
  const { setSlicers } = usePageSlicers()
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [channelTypeFilter, setChannelTypeFilter] = useState<'all' | 'app' | 'web' | 'service_center'>('all')
  const [showServicesForChannel] = useState<string | null>(null)
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'reviews' | 'type'>('score')
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'performance'>('none')

  // Check for active filters
  const hasActiveFilters = channelTypeFilter !== 'all' || performanceFilter !== 'all' || searchQuery !== ''
  
  const clearAllFilters = () => {
    setChannelTypeFilter('all')
    setPerformanceFilter('all')
    setSearchQuery('')
    setSortBy('score')
    setGroupBy('none')
  }

  const channelData = useMemo(() => {
    if (isLoading || channels.length === 0) return null

    const channelScores = calculateChannelTypeScore(channels, channelRatings, booths)
    
    const channelsWithScores = channels.map(channel => {
      if (channel.type === 'app' || channel.type === 'web') {
        const ratings = channelRatings.filter(r => r.channelId === channel.id)
        const score = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + (r.score * r.n), 0) / ratings.reduce((sum, r) => sum + r.n, 0)
          : 0
        const totalRatings = ratings.reduce((sum, r) => sum + r.n, 0)
        // Determine performance category (only for channels with ratings)
        let performanceCategory: 'high' | 'medium' | 'low' | 'unrated'
        if (totalRatings === 0) {
          performanceCategory = 'unrated'
        } else if (score >= 85) {
          performanceCategory = 'high'
        } else if (score >= 70) {
          performanceCategory = 'medium'
        } else {
          performanceCategory = 'low'
        }
        
        return { ...channel, score: Math.round(score * 100) / 100, totalRatings, performanceCategory }
      } else {
        const centerBooths = booths.filter(b => b.centerId === channel.id)
        const boothScores: { score: number; n: number }[] = []
        
        centerBooths.forEach(booth => {
          const boothRatings = channelRatings.filter(r => r.boothId === booth.id)
          if (boothRatings.length > 0) {
            const avgScore = boothRatings.reduce((sum, r) => sum + (r.score * r.n), 0) / boothRatings.reduce((sum, r) => sum + r.n, 0)
            const totalCount = boothRatings.reduce((sum, r) => sum + r.n, 0)
            boothScores.push({ score: avgScore, n: totalCount })
          }
        })

        const centerScore = boothScores.length > 0 
          ? boothScores.reduce((sum, b) => sum + (b.score * b.n), 0) / boothScores.reduce((sum, b) => sum + b.n, 0)
          : 0
        const totalRatings = boothScores.reduce((sum, b) => sum + b.n, 0)
        
        // Determine performance category (only for service centers with ratings)
        let performanceCategory: 'high' | 'medium' | 'low' | 'unrated'
        if (totalRatings === 0) {
          performanceCategory = 'unrated'
        } else if (centerScore >= 85) {
          performanceCategory = 'high'
        } else if (centerScore >= 70) {
          performanceCategory = 'medium'
        } else {
          performanceCategory = 'low'
        }
        
        return { ...channel, score: Math.round(centerScore * 100) / 100, totalRatings, boothCount: centerBooths.length, performanceCategory }
      }
    })

    // Filter channels by type, performance, and search
    const filteredChannels = channelsWithScores.filter(channel => {
      if (channelTypeFilter !== 'all' && channel.type !== channelTypeFilter) return false
      // Only apply performance filter to rated channels
      if (performanceFilter !== 'all') {
        if (channel.performanceCategory === 'unrated') return false
        if (channel.performanceCategory !== performanceFilter) return false
      }
      
      // Search functionality
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          channel.name.toLowerCase().includes(query) ||
          channel.type.toLowerCase().includes(query) ||
          channel.id.toLowerCase().includes(query)
        )
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'reviews':
          return b.totalRatings - a.totalRatings
        case 'type':
          return a.type.localeCompare(b.type)
        case 'score':
        default:
          return b.score - a.score
      }
    })

    return {
      scores: channelScores,
      channels: channelsWithScores,
      filteredChannels,
      appChannels: channelsWithScores.filter(c => c.type === 'app'),
      webChannels: channelsWithScores.filter(c => c.type === 'web'),
      serviceCenters: channelsWithScores.filter(c => c.type === 'service_center')
    }
  }, [channels, channelRatings, booths, isLoading, channelTypeFilter, performanceFilter, searchQuery, sortBy])

  // Get services available on a specific channel
  const getServicesForChannel = useMemo(() => {
    if (!showServicesForChannel || !serviceChannels.length || !services.length) return []
    
    const channelServiceIds = serviceChannels
      .filter(sc => sc.channelId === showServicesForChannel && sc.isAvailableVia)
      .map(sc => sc.serviceId)
    
    return services.filter(s => channelServiceIds.includes(s.id)).map(service => {
      // Get service reviews for this specific channel
      const channelReviews = serviceReviews.filter(sr => sr.serviceId === service.id)
      const avgScore = channelReviews.length > 0 
        ? channelReviews.reduce((sum, r) => sum + (r.score * r.n), 0) / channelReviews.reduce((sum, r) => sum + r.n, 0)
        : 0
      const totalReviews = channelReviews.reduce((sum, r) => sum + r.n, 0)
      
      return {
        ...service,
        avgScore: Math.round(avgScore * 100) / 100,
        totalReviews,
        reviewBreakdown: {
          app: channelReviews.filter(r => r.channelOfReview === 'app').reduce((sum, r) => sum + r.n, 0),
          web: channelReviews.filter(r => r.channelOfReview === 'web').reduce((sum, r) => sum + r.n, 0),
          shared: channelReviews.filter(r => r.channelOfReview === 'shared').reduce((sum, r) => sum + r.n, 0),
        }
      }
    }).sort((a, b) => b.avgScore - a.avgScore)
  }, [showServicesForChannel, serviceChannels, services, serviceReviews])

  // Get services for the selected channel specifically for the detail view
  const selectedChannelServices = useMemo(() => {
    if (!selectedChannelId || !serviceChannels.length || !services.length) return []
    
    const channelServiceIds = serviceChannels
      .filter(sc => sc.channelId === selectedChannelId && sc.isAvailableVia)
      .map(sc => sc.serviceId)
    
    return services.filter(s => channelServiceIds.includes(s.id))
  }, [selectedChannelId, serviceChannels, services])

  // Channel performance overview with volume metrics
  const channelPerformanceChart = useMemo(() => {
    if (!channelData) return null
    
    const topChannels = channelData.filteredChannels
      .filter(c => c.totalRatings > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: function(params: any) {
          const channel = topChannels[params[0].dataIndex]
          return `
            <div><strong>${channel.name}</strong></div>
            <div>Score: ${params[0].value}</div>
            <div>Volume: ${params[1].value} reviews</div>
            <div>Type: ${channel.type.replace('_', ' ')}</div>
          `
        }
      },
      legend: {
        data: ['Performance Score', 'Review Volume']
      },
      xAxis: {
        type: 'category',
        data: topChannels.map(c => c.name.length > 12 ? c.name.substring(0, 12) + '...' : c.name),
        axisLabel: {
          rotate: 30,
          fontSize: 10
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Score',
          min: 60,
          max: 100,
          position: 'left'
        },
        {
          type: 'value',
          name: 'Volume',
          position: 'right'
        }
      ],
      series: [
        {
          name: 'Performance Score',
          type: 'bar',
          data: topChannels.map(c => c.score),
          itemStyle: { 
            color: (params: any) => {
              const score = params.value
              if (score >= 85) return '#34d399'
              if (score >= 70) return '#fbbf24'
              return '#f87171'
            }
          }
        },
        {
          name: 'Review Volume',
          type: 'line',
          yAxisIndex: 1,
          data: topChannels.map(c => c.totalRatings),
          itemStyle: { color: '#8b5cf6' },
          lineStyle: { width: 3 }
        }
      ]
    }
  }, [channelData])

  // Channel distribution by type (pie chart)
  const channelDistributionChart = useMemo(() => {
    if (!channelData) return null
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [
        {
          name: 'Channel Distribution',
          type: 'pie',
          radius: '70%',
          data: [
            { 
              value: channelData.appChannels.length, 
              name: 'Mobile Apps', 
              itemStyle: { color: '#60a5fa' } 
            },
            { 
              value: channelData.webChannels.length, 
              name: 'Web Portals', 
              itemStyle: { color: '#34d399' } 
            },
            { 
              value: channelData.serviceCenters.length, 
              name: 'Service Centers', 
              itemStyle: { color: '#fbbf24' } 
            }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            formatter: '{b}: {c}\n({d}%)'
          }
        }
      ]
    }
  }, [channelData])

  // Performance vs Volume scatter plot
  const performanceVolumeChart = useMemo(() => {
    if (!channelData) return null
    
    const scatterData = channelData.filteredChannels
      .filter(c => c.totalRatings > 0)
      .map(c => ({
        value: [c.totalRatings, c.score],
        name: c.name,
        type: c.type,
        itemStyle: {
          color: c.type === 'app' ? '#60a5fa' : 
                c.type === 'web' ? '#34d399' : '#fbbf24'
        }
      }))
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          return `
            <div><strong>${params.data.name}</strong></div>
            <div>Score: ${params.data.value[1]}</div>
            <div>Volume: ${params.data.value[0]} reviews</div>
            <div>Type: ${params.data.type.replace('_', ' ')}</div>
          `
        }
      },
      xAxis: {
        type: 'value',
        name: 'Review Volume',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: {
        type: 'value',
        name: 'Performance Score',
        nameLocation: 'middle',
        nameGap: 40,
        min: 60,
        max: 100
      },
      series: [
        {
          type: 'scatter',
          data: scatterData,
          symbolSize: function (data: number[]) {
            return Math.sqrt(data[0]) * 2
          }
        }
      ]
    }
  }, [channelData])

  const selectedChannelData = useMemo(() => {
    if (!selectedChannelId || !channelData) return null
    return channelData.channels.find(c => c.id === selectedChannelId)
  }, [selectedChannelId, channelData])

  // Group channels for better organization
  const groupedChannels = useMemo(() => {
    if (!channelData) return {}
    
    if (groupBy === 'none') {
      return { 'All Channels': channelData.filteredChannels }
    } else if (groupBy === 'type') {
      return channelData.filteredChannels.reduce((groups, channel) => {
        const key = channel.type === 'app' ? '📱 Mobile Apps' :
                   channel.type === 'web' ? '🌐 Web Portals' :
                   '🏢 Service Centers'
        if (!groups[key]) groups[key] = []
        groups[key].push(channel)
        return groups
      }, {} as Record<string, typeof channelData.filteredChannels>)
    } else if (groupBy === 'performance') {
      return channelData.filteredChannels.reduce((groups, channel) => {
        const key = channel.performanceCategory === 'high' ? '🟢 High Performance (85+)' :
                   channel.performanceCategory === 'medium' ? '🟡 Medium Performance (70-84)' :
                   channel.performanceCategory === 'low' ? '🔴 Needs Attention (<70)' :
                   '⚪ Unrated Channels'
        if (!groups[key]) groups[key] = []
        groups[key].push(channel)
        return groups
      }, {} as Record<string, typeof channelData.filteredChannels>)
    }
    return { 'All Channels': channelData.filteredChannels }
  }, [channelData, groupBy])


  const servicesPerformanceChart = useMemo(() => {
    if (!getServicesForChannel.length) return null
    
    const top8Services = getServicesForChannel.slice(0, 8)
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      xAxis: {
        type: 'category',
        data: top8Services.map(s => s.name.length > 16 ? s.name.substring(0, 16) + '...' : s.name),
        axisLabel: {
          rotate: 30,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        min: 60,
        max: 100
      },
      series: [
        {
          name: 'Service Score',
          type: 'bar',
          data: top8Services.map(s => s.avgScore),
          itemStyle: { 
            color: (params: any) => {
              const score = params.value
              if (score >= 85) return '#34d399'
              if (score >= 70) return '#fbbf24'
              return '#f87171'
            }
          }
        }
      ]
    }
  }, [getServicesForChannel])

  // Set slicers in header when component mounts or data changes
  useEffect(() => {
    if (!isLoading && channelData) {
      const channelSlicers = (
        <>
          {/* Channel Type Select */}
          <Select value={channelTypeFilter} onValueChange={(value: 'all' | 'app' | 'web' | 'service_center') => setChannelTypeFilter(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Channel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All Channels</SelectItem>
              <SelectItem value="app">📱 Mobile Apps</SelectItem>
              <SelectItem value="web">🌐 Web Portals</SelectItem>
              <SelectItem value="service_center">🏢 Service Centers</SelectItem>
            </SelectContent>
          </Select>

          {/* Performance Select */}
          <Select value={performanceFilter} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setPerformanceFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📊 All</SelectItem>
              <SelectItem value="high">🟢 High (85+)</SelectItem>
              <SelectItem value="medium">🟡 Medium (70-84)</SelectItem>
              <SelectItem value="low">🔴 Low (&lt;70)</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-xs">
              Clear
            </Button>
          )}

          {/* Quick Stats */}
          <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-accent/20 rounded px-2 py-1">
            <span className="font-medium">{channelData?.filteredChannels.length || 0}</span>
            <span>/</span>
            <span className="font-medium">{channelData?.channels.length || 0}</span>
          </div>
        </>
      )
      setSlicers(channelSlicers)
    }
    return () => setSlicers(null) // Clear slicers when component unmounts
  }, [isLoading, channelData, channelTypeFilter, performanceFilter, hasActiveFilters, setSlicers])

  if (isLoading) {
    return <SkeletonPage showKpis={true} showCharts={true} showList={true} />
  }

  if (!channelData) return null

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
            <div className="text-2xl">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelData.filteredChannels.length}</div>
            <p className="text-xs text-muted-foreground">
              {channelTypeFilter !== 'all' ? `${channelTypeFilter} channels` : 'total channels'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apps Score</CardTitle>
            <div className="text-2xl">📱</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelData.scores.app}</div>
            <p className="text-xs text-muted-foreground">
              50% weight • {channelData.appChannels.length} assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Web Score</CardTitle>
            <div className="text-2xl">🌐</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelData.scores.web}</div>
            <p className="text-xs text-muted-foreground">
              20% weight • {channelData.webChannels.length} portals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Centers Score</CardTitle>
            <div className="text-2xl">🏢</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelData.scores.service_center}</div>
            <p className="text-xs text-muted-foreground">
              30% weight • {channelData.serviceCenters.length} centers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Assets & Services */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Channel Assets & Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Channel Assets & Analysis</CardTitle>
            <CardDescription>
              Comprehensive channel discovery with detailed analysis - select any channel for deep dive insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Enhanced Filter Controls */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Search Input */}
                <div className="md:col-span-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">🔍</span>
                  </div>
                  <Input
                    type="text"
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <span className="text-gray-400 hover:text-gray-600">✕</span>
                    </button>
                  )}
                </div>

                {/* Channel Type Select */}
                <Select value={channelTypeFilter} onValueChange={(value: 'all' | 'app' | 'web' | 'service_center') => setChannelTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Channel Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels ({channelData?.channels.length || 0})</SelectItem>
                    <SelectItem value="app">📱 Apps ({channelData?.appChannels.length || 0})</SelectItem>
                    <SelectItem value="web">🌐 Web ({channelData?.webChannels.length || 0})</SelectItem>
                    <SelectItem value="service_center">🏢 Centers ({channelData?.serviceCenters.length || 0})</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By Select */}
                <Select value={sortBy} onValueChange={(value: 'score' | 'name' | 'reviews' | 'type') => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">🎯 By Score</SelectItem>
                    <SelectItem value="name">🔤 By Name</SelectItem>
                    <SelectItem value="reviews">📊 By Volume</SelectItem>
                    <SelectItem value="type">📱 By Type</SelectItem>
                  </SelectContent>
                </Select>

                {/* Performance Filter Select */}
                <Select value={performanceFilter} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setPerformanceFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📊 All Levels</SelectItem>
                    <SelectItem value="high">🟢 High (85+)</SelectItem>
                    <SelectItem value="medium">🟡 Medium (70-84)</SelectItem>
                    <SelectItem value="low">🔴 Low (&lt;70)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group By and Clear Actions Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={groupBy} onValueChange={(value: 'none' | 'type' | 'performance') => setGroupBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Group By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">📝 No Grouping</SelectItem>
                    <SelectItem value="type">📱 By Type</SelectItem>
                    <SelectItem value="performance">⚡ By Performance</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearAllFilters} className="w-full">
                    Clear All Filters
                  </Button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {channelData?.filteredChannels.length || 0} of {channelData?.channels.length || 0} channels
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <span className="mr-1">✕</span>
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Two-Column Layout: Channel List + Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Channel Assets List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Channel Assets</h3>
                  <Badge variant="secondary" className="text-xs">
                    {channelData?.filteredChannels.length || 0} channels
                  </Badge>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                  {Object.entries(groupedChannels).map(([groupName, channels]) => (
                    <div key={groupName}>
                      {groupBy !== 'none' && (
                        <h4 className="font-medium text-sm text-muted-foreground mb-2 sticky top-0 bg-background z-10">
                          {groupName} ({channels.length})
                        </h4>
                      )}
                      <div className="space-y-2">
                        {channels.map((channel: any) => (
                          <div 
                            key={channel.id} 
                            className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:border-primary/50 ${
                              selectedChannelId === channel.id ? 'bg-accent border-primary shadow-sm' : ''
                            }`}
                            onClick={() => setSelectedChannelId(channel.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm truncate">{channel.name}</p>
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {channel.type === 'service_center' ? '🏢' : 
                                     channel.type === 'app' ? '📱' : 
                                     channel.type === 'web' ? '🌐' : 
                                     channel.type === 'shared_platform' ? '🔗' : '📋'} 
                                    {channel.type === 'service_center' ? 'SC' : 
                                     channel.type === 'app' ? 'App' : 
                                     channel.type === 'web' ? 'Web' : channel.type}
                                  </Badge>
                                  {channel.performanceCategory === 'low' && (
                                    <Badge variant="destructive" className="text-xs flex-shrink-0">⚠️</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{channel.id}</p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className={`font-bold text-lg ${
                                  channel.score >= 85 ? 'text-green-600' : 
                                  channel.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {channel.score || '--'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {channel.reviews || 0} reviews
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* No Results Message */}
                  {(!channelData?.filteredChannels || channelData.filteredChannels.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-2">🔍</div>
                      <p>No channels match your current filters</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={clearAllFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Channel Analysis Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    {selectedChannelData ? '🔍 Channel Analysis' : '📊 Analysis Panel'}
                  </h3>
                  {selectedChannelData && (
                    <Badge variant="outline" className="text-xs">
                      {selectedChannelData.type === 'service_center' ? 'Service Center' : 
                       selectedChannelData.type === 'app' ? 'Mobile App' : 
                       selectedChannelData.type === 'web' ? 'Web Portal' : 
                       selectedChannelData.type}
                    </Badge>
                  )}
                </div>

                <div className="bg-muted/30 rounded-lg p-4 min-h-[500px]">
                  {selectedChannelData ? (
                    <div className="space-y-4">
                      {/* Channel Header */}
                      <div className="border-b pb-3">
                        <h4 className="font-semibold text-lg">{selectedChannelData.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedChannelData.id}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {selectedChannelData.type === 'service_center' ? '🏢 Service Center' : 
                             selectedChannelData.type === 'app' ? '📱 Mobile App' : 
                             selectedChannelData.type === 'web' ? '🌐 Web Portal' : 
                             selectedChannelData.type}
                          </Badge>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-background p-3 rounded border">
                          <p className="text-sm font-medium">Channel Score</p>
                          <p className={`text-2xl font-bold ${
                            selectedChannelData.score >= 85 ? 'text-green-600' : 
                            selectedChannelData.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedChannelData.score || '--'}
                          </p>
                        </div>
                        <div className="bg-background p-3 rounded border">
                          <p className="text-sm font-medium">Reviews</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedChannelData.totalRatings || 0}
                          </p>
                        </div>
                        <div className="bg-background p-3 rounded border">
                          <p className="text-sm font-medium">Services</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {selectedChannelServices.length}
                          </p>
                        </div>
                      </div>

                      {/* Channel Insights */}
                      <div className="p-3 bg-accent/20 rounded-lg">
                        <p className="text-sm font-medium mb-2">Channel Insights</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>🏷️ Type: {selectedChannelData.type}</p>
                          <p>🎯 Performance Category: {selectedChannelData.performanceCategory}</p>
                          <p>📊 Review Volume: {selectedChannelData.totalRatings || 0}</p>
                          {selectedChannelData.type === 'service_center' && (selectedChannelData as any).boothCount && (
                            <p>🏢 Booths: {(selectedChannelData as any).boothCount}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Connected Services */}
                      <div>
                        <p className="text-sm font-medium mb-2">🔗 Connected Services</p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {selectedChannelServices.map((service: any, index: number) => (
                            <div key={service?.id} className="flex items-center justify-between p-2 rounded-lg border text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="rounded-full w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{service?.name || 'Unknown Service'}</p>
                                  <p className="text-muted-foreground truncate">
                                    {service?.owner || 'Unknown Owner'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {service?.type === 2 && <Badge variant="secondary" className="text-xs">T2</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                      <div>
                        <div className="text-4xl mb-2">📊</div>
                        <p className="font-medium">Select a Channel</p>
                        <p className="text-sm">Choose a channel from the list to view detailed analysis</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Analytics Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Channel Performance Overview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Channel Performance & Volume Analysis</CardTitle>
            <CardDescription>
              Performance scores vs review volume - Bubble size indicates traffic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ReactECharts option={channelPerformanceChart} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Mix</CardTitle>
            <CardDescription>Distribution by channel type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ReactECharts option={channelDistributionChart} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance vs Volume Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>Performance vs Volume Correlation</CardTitle>
          <CardDescription>
            Scatter plot showing relationship between review volume and performance scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ReactECharts option={performanceVolumeChart} style={{ height: '100%', width: '100%' }} />
          </div>
        </CardContent>
      </Card>

      {/* Asset Performance Trends */}
      <AssetTrendChart />

      {/* Services on Selected Channel */}
      {showServicesForChannel && (
        <Card>
          <CardHeader>
            <CardTitle>🎯 Services Performance Analysis</CardTitle>
            <CardDescription>
              Services delivered through {channelData.channels.find(c => c.id === showServicesForChannel)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getServicesForChannel.length > 0 ? (
              <div className="space-y-4">
                {/* Services Chart */}
                <div className="h-[300px]">
                  <ReactECharts option={servicesPerformanceChart} style={{ height: '100%', width: '100%' }} />
                </div>
                
                {/* Services Grid */}
                <div className="grid gap-3 md:grid-cols-2">
                  {getServicesForChannel.slice(0, 8).map((service) => (
                    <div key={service.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{service.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              Type-{service.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {service.owner} • {service.totalReviews} reviews
                          </p>
                          <div className="flex gap-1">
                            {service.reviewBreakdown.app > 0 && (
                              <Badge variant="outline" className="text-xs">📱 {service.reviewBreakdown.app}</Badge>
                            )}
                            {service.reviewBreakdown.web > 0 && (
                              <Badge variant="outline" className="text-xs">🌐 {service.reviewBreakdown.web}</Badge>
                            )}
                            {service.reviewBreakdown.shared > 0 && (
                              <Badge variant="outline" className="text-xs">🔗 {service.reviewBreakdown.shared}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${
                            service.avgScore >= 85 ? 'text-green-600' : 
                            service.avgScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {service.avgScore}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {getServicesForChannel.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Showing top 8 of {getServicesForChannel.length} services
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">📭</div>
                <p>No services found for this channel</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}