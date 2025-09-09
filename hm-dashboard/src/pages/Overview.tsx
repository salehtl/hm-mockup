import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiData } from '@/hooks/useApiData'
import { useEntity } from '@/contexts/EntityContext'
import { useTrendData } from '@/hooks/useTrendData'
import { TrendChart } from '@/components/TrendChart'
import { 
  calculateChannelTypeScore, 
  calculateEntityServiceScore, 
  calculateEntityScore,
  calculateServiceOverallScore,
  calculateServiceStandaloneScore 
} from '@/lib/calculations'
import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Overview() {
  const { selectedEntity } = useEntity()
  const { services, channels, serviceReviews, channelRatings, dcxReviews, booths, serviceChannels, isLoading } = useApiData()
  const { trendData, isLoading: isTrendLoading } = useTrendData()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'entity' | 'service' | 'channel'>('all')

  const calculations = useMemo(() => {
    if (isLoading || services.length === 0) {
      return { 
        entityScore: 0, 
        serviceScore: 0, 
        channelScore: 0, 
        worstServices: [], 
        topServices: [],
        channelBreakdown: null,
        serviceBreakdown: null,
        performanceDistribution: null,
        alerts: []
      }
    }

    const channelScores = calculateChannelTypeScore(channels, channelRatings, booths)
    const serviceScore = calculateEntityServiceScore(services, serviceReviews, dcxReviews)
    const entityScore = calculateEntityScore(serviceScore, channelScores.overall)

    // Calculate service performance analytics
    const servicesWithScores = services.map(service => {
      const overallScore = calculateServiceOverallScore(service, serviceReviews, dcxReviews)
      const standaloneScore = calculateServiceStandaloneScore(service, serviceReviews)
      const reviewCount = serviceReviews.filter(r => r.serviceId === service.id).reduce((sum, r) => sum + r.n, 0)
      
      // Channel breakdown for service
      const serviceReviewsForService = serviceReviews.filter(r => r.serviceId === service.id)
      const channelBreakdown = {
        app: serviceReviewsForService.filter(r => r.channelOfReview === 'app').reduce((sum, r) => sum + r.n, 0),
        web: serviceReviewsForService.filter(r => r.channelOfReview === 'web').reduce((sum, r) => sum + r.n, 0),
        shared: serviceReviewsForService.filter(r => r.channelOfReview === 'shared').reduce((sum, r) => sum + r.n, 0),
      }

      // Available channels
      const availableChannels = serviceChannels
        .filter(sc => sc.serviceId === service.id && sc.isAvailableVia)
        .length

      return {
        ...service,
        overallScore,
        standaloneScore,
        reviewCount,
        channelBreakdown,
        availableChannels,
        dcxInfluence: service.dcxIds.length > 0 ? overallScore - standaloneScore : 0,
        isDcxEnabled: service.dcxIds.length > 0
      }
    }).filter(s => s.reviewCount > 0)

    // Top and worst performing services
    const sortedByScore = [...servicesWithScores].sort((a, b) => b.overallScore - a.overallScore)
    const worstServices = sortedByScore
      .filter(s => s.reviewCount >= 10)
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 8)
    const topServices = sortedByScore.slice(0, 8)

    // Performance distribution
    const performanceRanges = {
      excellent: servicesWithScores.filter(s => s.overallScore >= 85).length,
      good: servicesWithScores.filter(s => s.overallScore >= 70 && s.overallScore < 85).length,
      needsAttention: servicesWithScores.filter(s => s.overallScore < 70).length
    }

    // Service type breakdown
    const serviceBreakdown = {
      type1: services.filter(s => s.type === 1).length,
      type2: services.filter(s => s.type === 2).length,
      dcxEnabled: services.filter(s => s.dcxIds.length > 0).length,
      totalReviews: serviceReviews.reduce((sum, r) => sum + r.n, 0)
    }

    // Generate alerts based on performance
    const alerts = []
    if (entityScore < 70) alerts.push({ type: 'critical', message: 'Overall entity score below threshold' })
    if (worstServices.filter(s => s.overallScore < 60).length > 0) {
      alerts.push({ type: 'warning', message: `${worstServices.filter(s => s.overallScore < 60).length} services critically underperforming` })
    }
    if (channelScores.service_center < 75) alerts.push({ type: 'info', message: 'Service centers performance below average' })

    return {
      entityScore,
      serviceScore,
      channelScore: channelScores.overall,
      worstServices,
      topServices,
      channelBreakdown: channelScores,
      serviceBreakdown,
      performanceDistribution: performanceRanges,
      alerts,
      servicesWithScores
    }
  }, [services, channels, serviceReviews, channelRatings, dcxReviews, booths, serviceChannels, isLoading])

  // Performance distribution chart
  const performanceDistributionChart = useMemo(() => {
    if (!calculations.performanceDistribution) return null
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} services ({d}%)'
      },
      series: [
        {
          name: 'Performance Distribution',
          type: 'pie',
          radius: ['50%', '80%'],
          data: [
            { 
              value: calculations.performanceDistribution.excellent, 
              name: 'Excellent (85+)', 
              itemStyle: { color: '#10b981' } 
            },
            { 
              value: calculations.performanceDistribution.good, 
              name: 'Good (70-84)', 
              itemStyle: { color: '#f59e0b' } 
            },
            { 
              value: calculations.performanceDistribution.needsAttention, 
              name: 'Needs Attention (<70)', 
              itemStyle: { color: '#ef4444' } 
            }
          ],
          label: {
            formatter: '{b}\n{c} services'
          }
        }
      ]
    }
  }, [calculations.performanceDistribution])

  // Channel vs Service performance comparison
  const performanceComparisonChart = useMemo(() => {
    if (!calculations.channelBreakdown) return null
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Channel Scores', 'Service Score', 'Entity Score']
      },
      xAxis: {
        type: 'category',
        data: ['Apps', 'Web', 'Service Centers', 'Overall']
      },
      yAxis: {
        type: 'value',
        min: 60,
        max: 100
      },
      series: [
        {
          name: 'Channel Scores',
          type: 'bar',
          data: [
            calculations.channelBreakdown.app,
            calculations.channelBreakdown.web,
            calculations.channelBreakdown.service_center,
            calculations.channelScore
          ],
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: 'Service Score',
          type: 'line',
          data: [
            calculations.serviceScore,
            calculations.serviceScore,
            calculations.serviceScore,
            calculations.serviceScore
          ],
          itemStyle: { color: '#10b981' },
          lineStyle: { width: 3 }
        },
        {
          name: 'Entity Score',
          type: 'line',
          data: [
            calculations.entityScore,
            calculations.entityScore,
            calculations.entityScore,
            calculations.entityScore
          ],
          itemStyle: { color: '#8b5cf6' },
          lineStyle: { width: 3, type: 'dashed' }
        }
      ]
    }
  }, [calculations])

  // Service performance heatmap
  const servicePerformanceChart = useMemo(() => {
    if (!calculations.servicesWithScores?.length) return null
    
    const topServices = calculations.servicesWithScores
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 12)
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: function(params: any) {
          const service = topServices[params[0].dataIndex]
          return `
            <div><strong>${service.name}</strong></div>
            <div>Overall: ${params[0].value}</div>
            <div>Standalone: ${params[1].value}</div>
            <div>Reviews: ${service.reviewCount}</div>
            <div>Channels: ${service.availableChannels}</div>
            ${service.isDcxEnabled ? `<div>DCX Impact: ${service.dcxInfluence > 0 ? '+' : ''}${service.dcxInfluence.toFixed(1)}</div>` : ''}
          `
        }
      },
      legend: {
        data: ['Overall Score', 'Standalone Score']
      },
      xAxis: {
        type: 'category',
        data: topServices.map(s => s.name.length > 14 ? s.name.substring(0, 14) + '...' : s.name),
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
          name: 'Overall Score',
          type: 'bar',
          data: topServices.map(s => s.overallScore),
          itemStyle: { 
            color: function(params: any) {
              const service = topServices[params.dataIndex]
              if (service.isDcxEnabled) return '#8b5cf6'
              if (service.overallScore >= 85) return '#10b981'
              if (service.overallScore >= 70) return '#f59e0b'
              return '#ef4444'
            }
          }
        },
        {
          name: 'Standalone Score',
          type: 'line',
          data: topServices.map(s => s.standaloneScore),
          itemStyle: { color: '#06b6d4' },
          lineStyle: { width: 2 }
        }
      ]
    }
  }, [calculations])

  const trendSeries = useMemo(() => {
    if (isTrendLoading || trendData.length === 0) return []
    
    const series = [
      {
        name: 'Entity Score',
        data: trendData.map(d => ({ date: d.date, value: d.entityScore, volume: d.volume })),
        color: '#8b5cf6'
      }
    ]

    if (selectedMetric === 'all' || selectedMetric === 'service') {
      series.push({
        name: 'Service Score',
        data: trendData.map(d => ({ date: d.date, value: d.serviceScore, volume: d.volume })),
        color: '#10b981'
      })
    }

    if (selectedMetric === 'all' || selectedMetric === 'channel') {
      series.push({
        name: 'Channel Score',
        data: trendData.map(d => ({ date: d.date, value: d.channelScore, volume: d.volume })),
        color: '#f59e0b'
      })
    }

    return series
  }, [trendData, isTrendLoading, selectedMetric])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Overview</h1>
          <p className="text-muted-foreground">Loading comprehensive analytics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const entityName = selectedEntity?.name || 'All Entities'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Overview</h1>
        <p className="text-muted-foreground">
          Comprehensive performance dashboard for {entityName} - Real-time insights and strategic KPIs.
        </p>
      </div>

      {/* Alerts Section */}
      {calculations.alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">🚨 Performance Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {calculations.alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant={alert.type === 'critical' ? 'destructive' : alert.type === 'warning' ? 'default' : 'secondary'}>
                    {alert.type.toUpperCase()}
                  </Badge>
                  <span className="text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executive KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entity Score</CardTitle>
            <div className="text-2xl">🎯</div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              calculations.entityScore >= 85 ? 'text-green-600' : 
              calculations.entityScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {calculations.entityScore}
            </div>
            <p className="text-xs text-muted-foreground">
              70% Service + 30% Channel
            </p>
            <div className={`absolute top-0 right-0 w-1 h-full ${
              calculations.entityScore >= 85 ? 'bg-green-500' : 
              calculations.entityScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Score</CardTitle>
            <div className="text-2xl">📋</div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              calculations.serviceScore >= 85 ? 'text-green-600' : 
              calculations.serviceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {calculations.serviceScore}
            </div>
            <p className="text-xs text-muted-foreground">
              {calculations.serviceBreakdown?.totalReviews.toLocaleString()} total reviews
            </p>
            <div className={`absolute top-0 right-0 w-1 h-full ${
              calculations.serviceScore >= 85 ? 'bg-green-500' : 
              calculations.serviceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Channel Score</CardTitle>
            <div className="text-2xl">📊</div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              calculations.channelScore >= 85 ? 'text-green-600' : 
              calculations.channelScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {calculations.channelScore}
            </div>
            <p className="text-xs text-muted-foreground">
              {channels.length} channels across touchpoints
            </p>
            <div className={`absolute top-0 right-0 w-1 h-full ${
              calculations.channelScore >= 85 ? 'bg-green-500' : 
              calculations.channelScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services at Risk</CardTitle>
            <div className="text-2xl">⚠️</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {calculations.performanceDistribution?.needsAttention || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Services scoring below 70
            </p>
            <div className="absolute top-0 right-0 w-1 h-full bg-orange-500"></div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis with Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Historical performance evolution for {entityName}</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex gap-1">
                <Button 
                  variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe('7d')}
                >
                  7D
                </Button>
                <Button 
                  variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe('30d')}
                >
                  30D
                </Button>
                <Button 
                  variant={selectedTimeframe === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe('90d')}
                >
                  90D
                </Button>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant={selectedMetric === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('all')}
                >
                  All
                </Button>
                <Button 
                  variant={selectedMetric === 'entity' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('entity')}
                >
                  Entity
                </Button>
                <Button 
                  variant={selectedMetric === 'service' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('service')}
                >
                  Services
                </Button>
                <Button 
                  variant={selectedMetric === 'channel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('channel')}
                >
                  Channels
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TrendChart
            title=""
            description=""
            series={trendSeries}
            showVolume={true}
            height={350}
            enablePeriodComparison={true}
          />
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>Service quality breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ReactECharts option={performanceDistributionChart} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Service Portfolio Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Service Portfolio</CardTitle>
            <CardDescription>Service composition and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{calculations.serviceBreakdown?.type1}</div>
                  <div className="text-xs text-muted-foreground">🔄 Type-1 Services</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{calculations.serviceBreakdown?.type2}</div>
                  <div className="text-xs text-muted-foreground">⚙️ Type-2 Services</div>
                </div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{calculations.serviceBreakdown?.dcxEnabled}</div>
                <div className="text-xs text-muted-foreground">🔗 DCX-Enabled Services</div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total Services</span>
                  <span className="font-bold">{services.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Channels</span>
                  <span className="font-bold">{channels.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
            <CardDescription>Touchpoint effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">📱 Mobile Apps</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      (calculations.channelBreakdown?.app || 0) >= 85 ? 'text-green-600' : 
                      (calculations.channelBreakdown?.app || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {calculations.channelBreakdown?.app || 0}
                    </span>
                    <div className="text-xs text-muted-foreground">50% weight</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">🌐 Web Portals</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      (calculations.channelBreakdown?.web || 0) >= 85 ? 'text-green-600' : 
                      (calculations.channelBreakdown?.web || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {calculations.channelBreakdown?.web || 0}
                    </span>
                    <div className="text-xs text-muted-foreground">20% weight</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">🏢 Service Centers</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      (calculations.channelBreakdown?.service_center || 0) >= 85 ? 'text-green-600' : 
                      (calculations.channelBreakdown?.service_center || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {calculations.channelBreakdown?.service_center || 0}
                    </span>
                    <div className="text-xs text-muted-foreground">30% weight</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{calculations.channelScore}</div>
                  <div className="text-xs text-muted-foreground">Weighted Channel Score</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service vs Channel Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Analysis Dashboard</CardTitle>
          <CardDescription>
            Comprehensive view of service vs channel performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ReactECharts option={performanceComparisonChart} style={{ height: '100%', width: '100%' }} />
          </div>
        </CardContent>
      </Card>

      {/* Top Service Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Service Performance Analysis</CardTitle>
          <CardDescription>
            Best performing services - Overall vs Standalone scores with DCX impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ReactECharts option={servicePerformanceChart} style={{ height: '100%', width: '100%' }} />
          </div>
        </CardContent>
      </Card>

      {/* Action Items & Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top Performing Services</CardTitle>
            <CardDescription>Services leading in customer satisfaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {calculations.topServices.map((service) => (
                <div key={service.id} className="flex justify-between items-center p-2 rounded hover:bg-accent/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{service.name}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {service.type === 1 ? '🔄' : '⚙️'} Type-{service.type}
                      </Badge>
                      {service.isDcxEnabled && (
                        <Badge variant="secondary" className="text-xs">🔗 DCX</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {service.reviewCount} reviews
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-green-600">{service.overallScore}</p>
                    {service.isDcxEnabled && service.dcxInfluence > 0 && (
                      <p className="text-xs text-green-600">+{service.dcxInfluence.toFixed(1)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Services Requiring Attention</CardTitle>
            <CardDescription>Services with performance concerns (10+ reviews)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {calculations.worstServices.length > 0 ? (
                calculations.worstServices.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-2 rounded hover:bg-accent/50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{service.name}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {service.type === 1 ? '🔄' : '⚙️'} Type-{service.type}
                        </Badge>
                        {service.isDcxEnabled && (
                          <Badge variant="secondary" className="text-xs">🔗 DCX</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {service.reviewCount} reviews
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{service.owner}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        service.overallScore < 60 ? 'text-red-600' : 
                        service.overallScore < 70 ? 'text-orange-600' : 'text-yellow-600'
                      }`}>
                        {service.overallScore}
                      </p>
                      {service.isDcxEnabled && service.dcxInfluence < 0 && (
                        <p className="text-xs text-red-600">{service.dcxInfluence.toFixed(1)}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>All services are performing well!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}