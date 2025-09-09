import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiData } from '@/hooks/useApiData'
import { useEntity } from '@/contexts/EntityContext'
import { 
  calculateServiceStandaloneScore, 
  calculateServiceOverallScore 
} from '@/lib/calculations'
import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Services() {
  const { selectedEntity } = useEntity()
  const { services, serviceReviews, dcxReviews, serviceChannels, channels, isLoading } = useApiData()
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | 1 | 2>('all')
  const [dcxFilter, setDcxFilter] = useState<'all' | 'dcx-enabled' | 'standalone'>('all')
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const serviceData = useMemo(() => {
    if (isLoading || services.length === 0) return []

    return services.map(service => {
      const standaloneScore = calculateServiceStandaloneScore(service, serviceReviews)
      const overallScore = calculateServiceOverallScore(service, serviceReviews, dcxReviews)
      const reviewCount = serviceReviews
        .filter(r => r.serviceId === service.id)
        .reduce((sum, r) => sum + r.n, 0)
      
      const serviceReviewsForService = serviceReviews.filter(r => r.serviceId === service.id)
      const channelBreakdown = {
        app: serviceReviewsForService.filter(r => r.channelOfReview === 'app').reduce((sum, r) => sum + r.n, 0),
        web: serviceReviewsForService.filter(r => r.channelOfReview === 'web').reduce((sum, r) => sum + r.n, 0),
        shared: serviceReviewsForService.filter(r => r.channelOfReview === 'shared').reduce((sum, r) => sum + r.n, 0),
        service_center: serviceReviewsForService.filter(r => r.channelOfReview === 'service_center' as any).reduce((sum, r) => sum + r.n, 0)
      }

      // Get available channels for this service
      const availableChannels = serviceChannels
        .filter(sc => sc.serviceId === service.id && sc.isAvailableVia)
        .map(sc => channels.find(c => c.id === sc.channelId))
        .filter(c => c !== undefined)

      // Determine performance category based on overall score
      let performanceCategory: 'high' | 'medium' | 'low'
      if (overallScore >= 85) performanceCategory = 'high'
      else if (overallScore >= 70) performanceCategory = 'medium'
      else performanceCategory = 'low'

      return {
        ...service,
        standaloneScore,
        overallScore,
        reviewCount,
        channelBreakdown,
        availableChannels,
        dcxInfluence: service.dcxIds.length > 0 ? overallScore - standaloneScore : 0,
        isDcxEnabled: service.dcxIds.length > 0,
        channelCount: availableChannels.length,
        performanceCategory
      }
    })
    .filter(service => {
      if (serviceTypeFilter !== 'all' && service.type !== serviceTypeFilter) return false
      if (dcxFilter === 'dcx-enabled' && !service.isDcxEnabled) return false
      if (dcxFilter === 'standalone' && service.isDcxEnabled) return false
      if (performanceFilter !== 'all' && service.performanceCategory !== performanceFilter) return false
      return true
    })
    .sort((a, b) => b.overallScore - a.overallScore)
  }, [services, serviceReviews, dcxReviews, serviceChannels, channels, isLoading, serviceTypeFilter, dcxFilter, performanceFilter])

  // Service performance vs volume scatter plot
  const performanceVolumeChart = useMemo(() => {
    const scatterData = serviceData
      .filter(s => s.reviewCount > 0)
      .map(s => ({
        value: [s.reviewCount, s.overallScore],
        name: s.name,
        type: s.type,
        isDcx: s.isDcxEnabled,
        itemStyle: {
          color: s.isDcxEnabled ? '#8b5cf6' : s.type === 1 ? '#60a5fa' : '#34d399'
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
            <div>Type: ${params.data.type === 1 ? 'Simple' : 'Complex'}</div>
            <div>${params.data.isDcx ? 'DCX-Enabled' : 'Standalone'}</div>
          `
        }
      },
      legend: {
        data: ['Type-1 Services', 'Type-2 Services', 'DCX-Enabled']
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
            return Math.sqrt(data[0]) * 1.5 + 5
          }
        }
      ]
    }
  }, [serviceData])

  // Top performers chart
  const topPerformersChart = useMemo(() => {
    const topServices = serviceData.slice(0, 10)
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: function(params: any) {
          const service = topServices[params[0].dataIndex]
          return `
            <div><strong>${service.name}</strong></div>
            <div>Overall Score: ${params[0].value}</div>
            <div>Volume: ${service.reviewCount} reviews</div>
            <div>Type: ${service.type === 1 ? 'Simple' : 'Complex'}</div>
            <div>Channels: ${service.channelCount}</div>
            ${service.isDcxEnabled ? `<div>DCX Impact: +${service.dcxInfluence.toFixed(1)}</div>` : ''}
          `
        }
      },
      legend: {
        data: ['Overall Score', 'Review Volume']
      },
      xAxis: {
        type: 'category',
        data: topServices.map(s => s.name.length > 16 ? s.name.substring(0, 16) + '...' : s.name),
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
          name: 'Overall Score',
          type: 'bar',
          data: topServices.map(s => s.overallScore),
          itemStyle: { 
            color: function(params: any) {
              const service = topServices[params.dataIndex]
              if (service.isDcxEnabled) return '#8b5cf6'
              if (service.overallScore >= 85) return '#34d399'
              if (service.overallScore >= 70) return '#fbbf24'
              return '#f87171'
            }
          }
        },
        {
          name: 'Review Volume',
          type: 'line',
          yAxisIndex: 1,
          data: topServices.map(s => s.reviewCount),
          itemStyle: { color: '#06b6d4' },
          lineStyle: { width: 3 }
        }
      ]
    }
  }, [serviceData])

  // Service type distribution
  const serviceTypeChart = useMemo(() => {
    const type1Count = serviceData.filter(s => s.type === 1).length
    const type2Count = serviceData.filter(s => s.type === 2).length
    const dcxCount = serviceData.filter(s => s.isDcxEnabled).length
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [
        {
          name: 'Service Distribution',
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { 
              value: type1Count, 
              name: 'Type-1 (Simple)', 
              itemStyle: { color: '#60a5fa' } 
            },
            { 
              value: type2Count, 
              name: 'Type-2 (Complex)', 
              itemStyle: { color: '#34d399' } 
            },
            { 
              value: dcxCount, 
              name: 'DCX-Enabled', 
              itemStyle: { color: '#8b5cf6' } 
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
            formatter: '{b}\n{c} services'
          }
        }
      ]
    }
  }, [serviceData])

  // Channel distribution for services
  const channelDistributionChart = useMemo(() => {
    const channelData = serviceData.reduce((acc, service) => {
      // Track total usage across channels
      service.channelBreakdown.app + service.channelBreakdown.web + 
                   service.channelBreakdown.shared + service.channelBreakdown.service_center
      
      acc.app += service.channelBreakdown.app
      acc.web += service.channelBreakdown.web
      acc.shared += service.channelBreakdown.shared
      acc.service_center += service.channelBreakdown.service_center
      
      return acc
    }, { app: 0, web: 0, shared: 0, service_center: 0 })
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      xAxis: {
        type: 'category',
        data: ['Mobile Apps', 'Web Portals', 'Shared Platforms', 'Service Centers']
      },
      yAxis: {
        type: 'value',
        name: 'Review Volume'
      },
      series: [
        {
          name: 'Reviews',
          type: 'bar',
          data: [channelData.app, channelData.web, channelData.shared, channelData.service_center],
          itemStyle: {
            color: function(params: any) {
              const colors = ['#60a5fa', '#34d399', '#8b5cf6', '#fbbf24']
              return colors[params.dataIndex]
            }
          }
        }
      ]
    }
  }, [serviceData])

  const selectedServiceData = useMemo(() => {
    if (!selectedServiceId) return null
    return serviceData.find(s => s.id === selectedServiceId)
  }, [selectedServiceId, serviceData])

  // Service channels analysis for selected service
  const serviceChannelsChart = useMemo(() => {
    if (!selectedServiceData) return null
    
    const channelData = selectedServiceData.availableChannels.map(channel => ({
      name: channel?.name || 'Unknown',
      type: channel?.type || 'unknown',
      reviews: selectedServiceData.channelBreakdown[
        channel?.type === 'app' ? 'app' :
        channel?.type === 'web' ? 'web' :
        channel?.type === 'service_center' ? 'service_center' : 'shared'
      ] || 0
    }))
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} reviews'
      },
      series: [
        {
          name: 'Channel Usage',
          type: 'pie',
          radius: '60%',
          data: channelData.map(c => ({
            value: c.reviews,
            name: c.name,
            itemStyle: {
              color: c.type === 'app' ? '#60a5fa' :
                    c.type === 'web' ? '#34d399' :
                    c.type === 'service_center' ? '#fbbf24' : '#8b5cf6'
            }
          })),
          label: {
            formatter: '{b}\n{c} reviews'
          }
        }
      ]
    }
  }, [selectedServiceData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Loading service data...</p>
        </div>
      </div>
    )
  }

  const entityName = selectedEntity?.name || 'All Entities'
  const allServices = services.filter(s => 
    serviceTypeFilter === 'all' || s.type === serviceTypeFilter
  )
  const dcxServices = allServices.filter(s => s.dcxIds.length > 0)
  const type1Services = allServices.filter(s => s.type === 1)
  const type2Services = allServices.filter(s => s.type === 2)
  
  // Calculate performance distribution for all services
  const allServiceData = services.map(service => {
    const overallScore = calculateServiceOverallScore(service, serviceReviews, dcxReviews)
    let performanceCategory: 'high' | 'medium' | 'low'
    if (overallScore >= 85) performanceCategory = 'high'
    else if (overallScore >= 70) performanceCategory = 'medium'
    else performanceCategory = 'low'
    return { ...service, overallScore, performanceCategory }
  })
  
  const performanceDistribution = {
    high: allServiceData.filter(s => s.performanceCategory === 'high').length,
    medium: allServiceData.filter(s => s.performanceCategory === 'medium').length,
    low: allServiceData.filter(s => s.performanceCategory === 'low').length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive service performance analysis for {entityName} - Deep insights into every service offering.
        </p>
      </div>

      {/* Service Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex gap-2">
              <Button 
                variant={serviceTypeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setServiceTypeFilter('all')}
              >
                All Services ({allServices.length})
              </Button>
              <Button 
                variant={serviceTypeFilter === 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setServiceTypeFilter(1)}
              >
                🔄 Type-1 ({type1Services.length})
              </Button>
              <Button 
                variant={serviceTypeFilter === 2 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setServiceTypeFilter(2)}
              >
                ⚙️ Type-2 ({type2Services.length})
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={dcxFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDcxFilter('all')}
            >
              All Types
            </Button>
            <Button 
              variant={dcxFilter === 'dcx-enabled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDcxFilter('dcx-enabled')}
            >
              🔗 DCX-Enabled ({dcxServices.length})
            </Button>
            <Button 
              variant={dcxFilter === 'standalone' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDcxFilter('standalone')}
            >
              📱 Standalone
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
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <div className="text-2xl">📋</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceData.length}</div>
            <p className="text-xs text-muted-foreground">
              {serviceTypeFilter !== 'all' ? `Type-${serviceTypeFilter} services` : 'total services'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type-1 Services</CardTitle>
            <div className="text-2xl">🔄</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{type1Services.length}</div>
            <p className="text-xs text-muted-foreground">
              Simple services • Single-step
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type-2 Services</CardTitle>
            <div className="text-2xl">⚙️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{type2Services.length}</div>
            <p className="text-xs text-muted-foreground">
              Complex services • Multi-step
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DCX-Enabled</CardTitle>
            <div className="text-2xl">🔗</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dcxServices.length}</div>
            <p className="text-xs text-muted-foreground">
              Journey-connected services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Service Performance Overview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Service Performance & Volume Analysis</CardTitle>
            <CardDescription>
              Top 10 services by performance - DCX services highlighted in purple
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ReactECharts option={topPerformersChart} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Service Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Service Portfolio Mix</CardTitle>
            <CardDescription>Distribution by service complexity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ReactECharts option={serviceTypeChart} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance vs Volume Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>Performance vs Volume Correlation</CardTitle>
          <CardDescription>
            Service performance vs review volume - Bubble size indicates traffic, colors show service types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ReactECharts option={performanceVolumeChart} style={{ height: '100%', width: '100%' }} />
          </div>
        </CardContent>
      </Card>

      {/* Channel Usage Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Usage Distribution</CardTitle>
          <CardDescription>
            Review volume across different service delivery channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ReactECharts option={channelDistributionChart} style={{ height: '100%', width: '100%' }} />
          </div>
        </CardContent>
      </Card>

      {/* Service Portfolio & Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Service Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle>Service Portfolio</CardTitle>
            <CardDescription>
              Select services to inspect detailed performance and channel distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {serviceData.map((service) => (
                <div 
                  key={service.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedServiceId === service.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => setSelectedServiceId(service.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{service.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {service.type === 1 ? '🔄' : '⚙️'} Type-{service.type}
                        </Badge>
                        {service.isDcxEnabled && (
                          <Badge variant="secondary" className="text-xs">
                            🔗 DCX
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {service.owner} • {service.reviewCount} reviews • {service.channelCount} channels
                      </p>
                      <div className="flex gap-1">
                        {service.channelBreakdown.app > 0 && (
                          <Badge variant="outline" className="text-xs">📱 {service.channelBreakdown.app}</Badge>
                        )}
                        {service.channelBreakdown.web > 0 && (
                          <Badge variant="outline" className="text-xs">🌐 {service.channelBreakdown.web}</Badge>
                        )}
                        {service.channelBreakdown.shared > 0 && (
                          <Badge variant="outline" className="text-xs">🔗 {service.channelBreakdown.shared}</Badge>
                        )}
                        {service.channelBreakdown.service_center > 0 && (
                          <Badge variant="outline" className="text-xs">🏢 {service.channelBreakdown.service_center}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        service.overallScore >= 85 ? 'text-green-600' : 
                        service.overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {service.overallScore}
                      </p>
                      {service.isDcxEnabled && service.dcxInfluence !== 0 && (
                        <p className={`text-xs ${
                          service.dcxInfluence > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          DCX: {service.dcxInfluence > 0 ? '+' : ''}{service.dcxInfluence.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedServiceData ? '🎯 Service Insights' : '📊 Service Details'}
            </CardTitle>
            <CardDescription>
              {selectedServiceData ? selectedServiceData.name : 'Select a service to view detailed insights'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedServiceData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Overall Score</p>
                    <p className={`text-2xl font-bold ${
                      selectedServiceData.overallScore >= 85 ? 'text-green-600' : 
                      selectedServiceData.overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedServiceData.overallScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Review Volume</p>
                    <p className="text-2xl font-bold">{selectedServiceData.reviewCount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Standalone Score</p>
                    <p className="text-xl font-bold">{selectedServiceData.standaloneScore}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Available Channels</p>
                    <p className="text-xl font-bold">{selectedServiceData.channelCount}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-sm font-medium mb-1">Service Configuration</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedServiceData.type === 1 ? '🔄 TYPE-1 (Simple Service)' : '⚙️ TYPE-2 (Complex Service)'}
                    {selectedServiceData.type === 2 && ' - 80% Process + 20% Deliverable weighting'}
                  </p>
                  {selectedServiceData.isDcxEnabled && (
                    <p className="text-xs text-muted-foreground mt-1">
                      🔗 DCX-Enabled - 70% Standalone + 30% Journey blend
                      {selectedServiceData.dcxInfluence !== 0 && (
                        <span className={selectedServiceData.dcxInfluence > 0 ? 'text-green-600' : 'text-red-600'}>
                          {' '}(Impact: {selectedServiceData.dcxInfluence > 0 ? '+' : ''}{selectedServiceData.dcxInfluence.toFixed(1)})
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {selectedServiceData.availableChannels.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">📊 Channel Usage Breakdown</p>
                    <div className="h-[200px]">
                      <ReactECharts option={serviceChannelsChart} style={{ height: '100%', width: '100%' }} />
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">📋 Available Channels</p>
                  <div className="grid gap-2">
                    {selectedServiceData.availableChannels.map((channel, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-accent/10 rounded">
                        <span className="text-sm">
                          {channel?.type === 'app' ? '📱' : 
                           channel?.type === 'web' ? '🌐' : 
                           channel?.type === 'service_center' ? '🏢' : '🔗'}
                        </span>
                        <span className="text-sm font-medium">{channel?.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {channel?.type?.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>Select a service to view detailed performance analytics</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}