import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiData } from '@/hooks/useApiData'
import { useEntity } from '@/contexts/EntityContext'
import { calculateChannelTypeScore } from '@/lib/calculations'
import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Channels() {
  const { selectedEntity } = useEntity()
  const { channels, channelRatings, booths, services, serviceChannels, serviceReviews, isLoading } = useApiData()
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [channelTypeFilter, setChannelTypeFilter] = useState<'all' | 'app' | 'web' | 'service_center'>('all')
  const [showServicesForChannel, setShowServicesForChannel] = useState<string | null>(null)
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

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

    // Filter channels by type and performance
    const filteredChannels = channelsWithScores.filter(channel => {
      if (channelTypeFilter !== 'all' && channel.type !== channelTypeFilter) return false
      // Only apply performance filter to rated channels
      if (performanceFilter !== 'all') {
        if (channel.performanceCategory === 'unrated') return false
        if (channel.performanceCategory !== performanceFilter) return false
      }
      return true
    })

    return {
      scores: channelScores,
      channels: channelsWithScores,
      filteredChannels,
      appChannels: channelsWithScores.filter(c => c.type === 'app'),
      webChannels: channelsWithScores.filter(c => c.type === 'web'),
      serviceCenters: channelsWithScores.filter(c => c.type === 'service_center')
    }
  }, [channels, channelRatings, booths, isLoading, channelTypeFilter, performanceFilter])

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

  const boothBreakdownChart = useMemo(() => {
    if (!selectedChannelData || selectedChannelData.type !== 'service_center') return null
    
    const centerBooths = booths.filter(b => b.centerId === selectedChannelData.id)
    const boothData = centerBooths.map(booth => {
      const boothRatings = channelRatings.filter(r => r.boothId === booth.id)
      const score = boothRatings.length > 0 
        ? boothRatings.reduce((sum, r) => sum + (r.score * r.n), 0) / boothRatings.reduce((sum, r) => sum + r.n, 0)
        : 0
      const volume = boothRatings.reduce((sum, r) => sum + r.n, 0)
      return { name: booth.name, score: Math.round(score * 100) / 100, volume }
    })

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Score', 'Volume']
      },
      xAxis: {
        type: 'category',
        data: boothData.map(b => b.name.length > 15 ? b.name.substring(0, 15) + '...' : b.name),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Score',
          min: 60,
          max: 100
        },
        {
          type: 'value',
          name: 'Volume',
          position: 'right'
        }
      ],
      series: [
        {
          name: 'Score',
          type: 'bar',
          data: boothData.map(b => b.score),
          itemStyle: { color: '#8b5cf6' }
        },
        {
          name: 'Volume',
          type: 'line',
          yAxisIndex: 1,
          data: boothData.map(b => b.volume),
          itemStyle: { color: '#f59e0b' },
          lineStyle: { width: 2 }
        }
      ]
    }
  }, [selectedChannelData, booths, channelRatings])

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground">Loading channel data...</p>
        </div>
      </div>
    )
  }

  if (!channelData) return null

  const entityName = selectedEntity?.name || 'All Entities'
  
  // Calculate performance distribution for rated channels only
  const ratedChannels = channelData.channels.filter(c => c.performanceCategory !== 'unrated')
  const performanceDistribution = {
    high: ratedChannels.filter(c => c.performanceCategory === 'high').length,
    medium: ratedChannels.filter(c => c.performanceCategory === 'medium').length,
    low: ratedChannels.filter(c => c.performanceCategory === 'low').length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Channel Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive channel performance analysis for {entityName} - Deep insights into every touchpoint.
        </p>
      </div>

      {/* Channel Filters - Moved to top for better UX */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={channelTypeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChannelTypeFilter('all')}
            >
              All Channels ({channelData.channels.length})
            </Button>
            <Button 
              variant={channelTypeFilter === 'app' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChannelTypeFilter('app')}
            >
              📱 Apps ({channelData.appChannels.length})
            </Button>
            <Button 
              variant={channelTypeFilter === 'web' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChannelTypeFilter('web')}
            >
              🌐 Web ({channelData.webChannels.length})
            </Button>
            <Button 
              variant={channelTypeFilter === 'service_center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChannelTypeFilter('service_center')}
            >
              🏢 Centers ({channelData.serviceCenters.length})
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button 
              variant={performanceFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPerformanceFilter('all')}
            >
              All Performance
            </Button>
            <Button 
              variant={performanceFilter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPerformanceFilter('high')}
            >
              🟢 High (85+) ({performanceDistribution.high})
            </Button>
            <Button 
              variant={performanceFilter === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPerformanceFilter('medium')}
            >
              🟡 Medium (70-84) ({performanceDistribution.medium})
            </Button>
            <Button 
              variant={performanceFilter === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPerformanceFilter('low')}
            >
              🔴 Low (&lt;70) ({performanceDistribution.low})
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* Channel Assets & Services */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Channel Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Assets</CardTitle>
            <CardDescription>
              Select channels to inspect services and detailed performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {channelData.filteredChannels.map((channel) => (
                <div 
                  key={channel.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedChannelId === channel.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => setSelectedChannelId(channel.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{channel.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {channel.type === 'app' ? '📱' : channel.type === 'web' ? '🌐' : '🏢'} 
                          {channel.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {channel.totalRatings} reviews
                        {channel.type === 'service_center' && 'boothCount' in channel && ` • ${channel.boothCount} booths`}
                      </p>
                      <div className="flex gap-1 mt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-0 h-auto text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowServicesForChannel(showServicesForChannel === channel.id ? null : channel.id)
                          }}
                        >
                          {showServicesForChannel === channel.id ? '🔼 Hide' : '🔽 Services'}
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        channel.score >= 85 ? 'text-green-600' : 
                        channel.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {channel.score}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {channel.type === 'app' && '50% weight'}
                        {channel.type === 'web' && '20% weight'}
                        {channel.type === 'service_center' && '30% weight'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Channel Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedChannelData ? '📋 Channel Insights' : '🎯 Channel Details'}
            </CardTitle>
            <CardDescription>
              {selectedChannelData ? selectedChannelData.name : 'Select a channel to view detailed insights'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedChannelData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Performance Score</p>
                    <p className={`text-2xl font-bold ${
                      selectedChannelData.score >= 85 ? 'text-green-600' : 
                      selectedChannelData.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedChannelData.score}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Review Volume</p>
                    <p className="text-2xl font-bold">{selectedChannelData.totalRatings}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-sm font-medium mb-1">Channel Impact</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedChannelData.type.replace('_', ' ').toUpperCase()}
                    {selectedChannelData.type === 'app' && ' - 50% weight in overall entity score'}
                    {selectedChannelData.type === 'web' && ' - 20% weight in overall entity score'}
                    {selectedChannelData.type === 'service_center' && ' - 30% weight in overall entity score'}
                  </p>
                </div>

                {selectedChannelData.type === 'service_center' && boothBreakdownChart && (
                  <div>
                    <p className="text-sm font-medium mb-2">🏪 Booth Performance Analysis</p>
                    <div className="h-[200px]">
                      <ReactECharts option={boothBreakdownChart} style={{ height: '100%', width: '100%' }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Select a channel asset to view detailed performance metrics</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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