import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiData } from '@/hooks/useApiData'
import { useEntity } from '@/contexts/EntityContext'
import { 
  calculateServiceStandaloneScore, 
  calculateServiceOverallScore 
} from '@/lib/calculations'
import { useMemo, useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { SkeletonPage } from '@/components/SkeletonLoader'
import { usePageSlicers } from '@/contexts/PageSlicersContext'

export function Services() {
  const { } = useEntity()
  const { services, serviceReviews, dcxReviews, serviceChannels, channels, isLoading } = useApiData()
  const { setSlicers } = usePageSlicers()
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | 1 | 2>('all')
  const [dcxFilter, setDcxFilter] = useState<'all' | 'dcx-enabled' | 'standalone'>('all')
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'reviews' | 'owner'>('score')
  const [groupBy, setGroupBy] = useState<'none' | 'owner' | 'performance'>('none')

  // Check for active filters
  const hasActiveFilters = serviceTypeFilter !== 'all' || dcxFilter !== 'all' || performanceFilter !== 'all' || searchQuery !== ''
  
  const clearAllFilters = () => {
    setServiceTypeFilter('all')
    setDcxFilter('all')
    setPerformanceFilter('all')
    setSearchQuery('')
    setSortBy('score')
    setGroupBy('none')
  }

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
      
      // Search functionality
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          service.name.toLowerCase().includes(query) ||
          service.owner.toLowerCase().includes(query) ||
          service.id.toLowerCase().includes(query)
        )
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'reviews':
          return b.reviewCount - a.reviewCount
        case 'owner':
          return a.owner.localeCompare(b.owner)
        case 'score':
        default:
          return b.overallScore - a.overallScore
      }
    })
  }, [services, serviceReviews, dcxReviews, serviceChannels, channels, isLoading, serviceTypeFilter, dcxFilter, performanceFilter, searchQuery, sortBy])

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
    const service = serviceData.find(s => s.id === selectedServiceId)
    
    if (!service) return null
    
    // Add phase data for Type-2 services
    if (service.type === 2) {
      const serviceReviewsForService = serviceReviews.filter(sr => sr.serviceId === selectedServiceId)
      
      const processReviews = serviceReviewsForService.filter(sr => sr.phase === 'process')
      const deliverableReviews = serviceReviewsForService.filter(sr => sr.phase === 'deliverable')
      
      const processData = {
        totalSubmissions: processReviews.reduce((sum, r) => sum + r.n, 0),
        avgScore: processReviews.length > 0 
          ? processReviews.reduce((sum, r) => sum + (r.score * r.n), 0) / processReviews.reduce((sum, r) => sum + r.n, 0)
          : 0
      }
      
      const deliverableData = {
        totalSubmissions: deliverableReviews.reduce((sum, r) => sum + r.n, 0),
        avgScore: deliverableReviews.length > 0 
          ? deliverableReviews.reduce((sum, r) => sum + (r.score * r.n), 0) / deliverableReviews.reduce((sum, r) => sum + r.n, 0)
          : 0
      }
      
      return {
        ...service,
        phaseData: {
          process: processData,
          deliverable: deliverableData
        }
      }
    }
    
    return service
  }, [selectedServiceId, serviceData, serviceReviews])

  // Group services for better organization
  const groupedServices = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Services': serviceData }
    } else if (groupBy === 'owner') {
      return serviceData.reduce((groups, service) => {
        const key = service.owner
        if (!groups[key]) groups[key] = []
        groups[key].push(service)
        return groups
      }, {} as Record<string, typeof serviceData>)
    } else if (groupBy === 'performance') {
      return serviceData.reduce((groups, service) => {
        const key = service.performanceCategory === 'high' ? '🟢 High Performance (85+)' :
                   service.performanceCategory === 'medium' ? '🟡 Medium Performance (70-84)' :
                   '🔴 Needs Attention (<70)'
        if (!groups[key]) groups[key] = []
        groups[key].push(service)
        return groups
      }, {} as Record<string, typeof serviceData>)
    }
    return { 'All Services': serviceData }
  }, [serviceData, groupBy])

  // Set slicers in header when component mounts or data changes
  useEffect(() => {
    if (!isLoading && serviceData) {
      const serviceSlicers = (
        <>
          {/* Service Type Select */}
          <Select value={serviceTypeFilter.toString()} onValueChange={(value: string) => setServiceTypeFilter(value === 'all' ? 'all' : parseInt(value) as 1 | 2)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All</SelectItem>
              <SelectItem value="1">🔄 Type-1</SelectItem>
              <SelectItem value="2">⚙️ Type-2</SelectItem>
            </SelectContent>
          </Select>

          {/* DCX/Standalone Select */}
          <Select value={dcxFilter} onValueChange={(value: 'all' | 'dcx-enabled' | 'standalone') => setDcxFilter(value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Journey" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All</SelectItem>
              <SelectItem value="dcx-enabled">🔗 DCX-Enabled</SelectItem>
              <SelectItem value="standalone">📋 Standalone</SelectItem>
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
            <span className="font-medium">{serviceData.length}</span>
            <span>services</span>
          </div>
        </>
      )
      setSlicers(serviceSlicers)
    }
    return () => setSlicers(null) // Clear slicers when component unmounts
  }, [isLoading, serviceData, serviceTypeFilter, dcxFilter, performanceFilter, hasActiveFilters, setSlicers])

  if (isLoading) {
    return <SkeletonPage showKpis={true} showCharts={true} showTable={true} />
  }

  const allServices = services.filter(s => 
    serviceTypeFilter === 'all' || s.type === serviceTypeFilter
  )
  const dcxServices = allServices.filter(s => s.dcxIds.length > 0)
  const type1Services = allServices.filter(s => s.type === 1)
  const type2Services = allServices.filter(s => s.type === 2)

  return (
    <div className="space-y-6">
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

      {/* Service Portfolio & Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Service Portfolio & Analysis</CardTitle>
          <CardDescription>
            Comprehensive service discovery with detailed analysis - select any service for deep dive insights
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
                  placeholder="Search services..."
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

              {/* Service Type Select */}
              <Select value={serviceTypeFilter.toString()} onValueChange={(value: string) => setServiceTypeFilter(value === 'all' ? 'all' : parseInt(value) as 1 | 2)}>
                <SelectTrigger>
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types ({allServices.length})</SelectItem>
                  <SelectItem value="1">🔄 Type-1 ({type1Services.length})</SelectItem>
                  <SelectItem value="2">⚙️ Type-2 ({type2Services.length})</SelectItem>
                </SelectContent>
              </Select>

              {/* DCX Filter Select */}
              <Select value={dcxFilter} onValueChange={(value: 'all' | 'dcx-enabled' | 'standalone') => setDcxFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Journey Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Journeys</SelectItem>
                  <SelectItem value="dcx-enabled">🔗 DCX-Enabled ({dcxServices.length})</SelectItem>
                  <SelectItem value="standalone">📋 Standalone</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By Select */}
              <Select value={sortBy} onValueChange={(value: 'score' | 'name' | 'reviews' | 'owner') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">🎯 By Score</SelectItem>
                  <SelectItem value="name">🔤 By Name</SelectItem>
                  <SelectItem value="reviews">📊 By Volume</SelectItem>
                  <SelectItem value="owner">🏢 By Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group By and Performance Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={groupBy} onValueChange={(value: 'none' | 'owner' | 'performance') => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Group By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">📝 No Grouping</SelectItem>
                  <SelectItem value="owner">🏢 By Owner</SelectItem>
                  <SelectItem value="performance">⚡ By Performance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={performanceFilter} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setPerformanceFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Performance Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📊 All Levels</SelectItem>
                  <SelectItem value="high">🟢 High (85+)</SelectItem>
                  <SelectItem value="medium">🟡 Medium (70-84)</SelectItem>
                  <SelectItem value="low">🔴 Low (&lt;70)</SelectItem>
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
                  Showing {serviceData.length} of {allServices.length} services
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <span className="mr-1">✕</span>
                    Clear All
                  </Button>
                )}
              </div>

              {/* Results Summary */}
              <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-2">
                <span>
                  {searchQuery && `"${searchQuery}" - `}
                  {serviceData.length} service{serviceData.length !== 1 ? 's' : ''} found
                </span>
                {searchQuery && (
                  <span className="text-blue-600 font-medium">
                    🔍 Active Search
                  </span>
                )}
              </div>
            </div>

            {/* Two-Column Layout: Service List + Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Service Portfolio List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Service Portfolio</h3>
                  <Badge variant="secondary" className="text-xs">
                    {serviceData.length} services
                  </Badge>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                  {Object.entries(groupedServices).map(([groupName, services]) => (
                    <div key={groupName}>
                      {groupBy !== 'none' && (
                        <h4 className="font-medium text-sm text-muted-foreground mb-2 sticky top-0 bg-background z-10">
                          {groupName} ({services.length})
                        </h4>
                      )}
                      <div className="space-y-2">
                        {services.map((service: any) => (
                          <div 
                            key={service.id} 
                            className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:border-primary/50 ${
                              selectedServiceId === service.id ? 'bg-accent border-primary shadow-sm' : ''
                            }`}
                            onClick={() => setSelectedServiceId(service.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm truncate">{service.name}</p>
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {service.type === 1 ? '🔄 T1' : '⚙️ T2'}
                                  </Badge>
                                  {service.isDcxEnabled && (
                                    <Badge variant="secondary" className="text-xs flex-shrink-0">🔗</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate mb-1">{service.owner}</p>
                                <div className="flex gap-1 text-xs text-muted-foreground">
                                  <span>{service.reviewCount}</span>
                                  <span>•</span>
                                  <span>{service.availableChannels.length}ch</span>
                                  {service.isDcxEnabled && (
                                    <>
                                      <span>•</span>
                                      <span>DCX</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className={`font-bold text-lg ${
                                  service.overallScore >= 85 ? 'text-green-600' : 
                                  service.overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {service.overallScore}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  SA: {service.standaloneScore}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* No Results Message */}
                  {serviceData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-2">🔍</div>
                      <p>No services match your current filters</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={clearAllFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Service Analysis Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    {selectedServiceData ? '🔍 Service Analysis' : '📊 Analysis Panel'}
                  </h3>
                  {selectedServiceData && (
                    <Badge variant="outline" className="text-xs">
                      {selectedServiceData.type === 1 ? 'Type-1 Service' : 'Type-2 Service'}
                    </Badge>
                  )}
                </div>

                <div className="bg-muted/30 rounded-lg p-4 min-h-[500px]">
                  {selectedServiceData ? (
                    <div className="space-y-4">
                      {/* Service Header */}
                      <div className="border-b pb-3">
                        <h4 className="font-semibold text-lg">{selectedServiceData.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedServiceData.owner}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {selectedServiceData.type === 1 ? '🔄 Type-1' : '⚙️ Type-2'}
                          </Badge>
                          {selectedServiceData.isDcxEnabled && (
                            <Badge variant="secondary">🔗 DCX-Enabled</Badge>
                          )}
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background p-3 rounded border">
                          <p className="text-sm font-medium">Overall Score</p>
                          <p className={`text-2xl font-bold ${
                            selectedServiceData.overallScore >= 85 ? 'text-green-600' : 
                            selectedServiceData.overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedServiceData.overallScore}
                          </p>
                        </div>
                        <div className="bg-background p-3 rounded border">
                          <p className="text-sm font-medium">Standalone Score</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedServiceData.standaloneScore}
                          </p>
                        </div>
                      </div>

                      {/* Additional Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background p-3 rounded border">
                          <p className="text-sm font-medium">Total Reviews</p>
                          <p className="text-2xl font-bold">{selectedServiceData.reviewCount}</p>
                        </div>
                        <div className="bg-background p-3 rounded border">
                          <p className="text-sm font-medium">Channels</p>
                          <p className="text-2xl font-bold">{selectedServiceData.channelCount}</p>
                        </div>
                      </div>

                      {/* Service Configuration */}
                      <div className="p-3 bg-accent/20 rounded-lg">
                        <p className="text-sm font-medium mb-2">Service Configuration</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>🏷️ Type: {selectedServiceData.type === 1 ? 'Type-1 (Simple)' : 'Type-2 (Process + Deliverable)'}</p>
                          <p>🏢 Owner: {selectedServiceData.owner}</p>
                          <p>📊 Performance Category: {selectedServiceData.performanceCategory}</p>
                          {selectedServiceData.isDcxEnabled && (
                            <p className="text-purple-600">🔗 Connected to DCX journey</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Type-2 Service Breakdown */}
                      {selectedServiceData.type === 2 && (
                        <div>
                          <p className="text-sm font-medium mb-3">⚙️ Type-2 Service Breakdown</p>
                          <div className="h-[250px] bg-background rounded border p-2">
                            <ReactECharts 
                              option={{
                                tooltip: {
                                  trigger: 'axis',
                                  axisPointer: { type: 'shadow' },
                                  formatter: function(params: any) {
                                    const processData = params.find((p: any) => p.seriesName === 'Process Phase')
                                    const deliverableData = params.find((p: any) => p.seriesName === 'Deliverable Phase')
                                    const scoreData = params.find((p: any) => p.seriesName === 'Phase Score')
                                    
                                    let html = '<div><strong>Type-2 Service Analysis</strong></div>'
                                    if (processData) {
                                      html += `<div>Process Submissions: ${processData.value}</div>`
                                    }
                                    if (deliverableData) {
                                      html += `<div>Deliverable Submissions: ${deliverableData.value}</div>`
                                    }
                                    if (processData && deliverableData) {
                                      const dropoffNum = ((processData.value - deliverableData.value) / processData.value * 100)
                                      const dropoff = dropoffNum.toFixed(1)
                                      html += `<div style="color: ${dropoffNum > 0 ? '#f87171' : '#34d399'}">Dropoff: ${dropoff}%</div>`
                                    }
                                    if (scoreData) {
                                      html += `<div>Average Score: ${scoreData.value}</div>`
                                    }
                                    return html
                                  }
                                },
                                legend: {
                                  data: ['Process Phase', 'Deliverable Phase', 'Phase Score'],
                                  top: 5,
                                  textStyle: { fontSize: 10 }
                                },
                                xAxis: {
                                  type: 'category',
                                  data: ['Volume Analysis', 'Performance Analysis'],
                                  axisLabel: { fontSize: 10 }
                                },
                                yAxis: [
                                  {
                                    type: 'value',
                                    name: 'Submissions',
                                    position: 'left',
                                    min: 0,
                                    nameTextStyle: { fontSize: 10 },
                                    axisLabel: { fontSize: 9 }
                                  },
                                  {
                                    type: 'value', 
                                    name: 'Score',
                                    position: 'right',
                                    min: 60,
                                    max: 100,
                                    nameTextStyle: { fontSize: 10 },
                                    axisLabel: { fontSize: 9 }
                                  }
                                ],
                                series: (() => {
                                  if (!selectedServiceData) return []
                                  
                                  const processReviews = (selectedServiceData as any).phaseData?.process || { totalSubmissions: 0, avgScore: 0 }
                                  const deliverableReviews = (selectedServiceData as any).phaseData?.deliverable || { totalSubmissions: 0, avgScore: 0 }
                                  
                                  return [
                                    {
                                      name: 'Process Phase',
                                      type: 'bar',
                                      data: [processReviews.totalSubmissions, 0],
                                      itemStyle: { color: '#60a5fa' },
                                      yAxisIndex: 0
                                    },
                                    {
                                      name: 'Deliverable Phase', 
                                      type: 'bar',
                                      data: [deliverableReviews.totalSubmissions, 0],
                                      itemStyle: { color: '#34d399' },
                                      yAxisIndex: 0
                                    },
                                    {
                                      name: 'Phase Score',
                                      type: 'line',
                                      data: [0, (processReviews.avgScore + deliverableReviews.avgScore) / 2],
                                      itemStyle: { color: '#f59e0b' },
                                      lineStyle: { width: 3 },
                                      yAxisIndex: 1,
                                      symbol: 'circle',
                                      symbolSize: 8
                                    }
                                  ]
                                })()
                              }}
                              style={{ height: '100%', width: '100%' }}
                            />
                          </div>
                          
                          {/* Phase Analysis Cards */}
                          <div className="grid grid-cols-1 gap-2 mt-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border text-xs">
                              <div className="font-medium text-blue-700 dark:text-blue-300">Process Phase</div>
                              <div className="font-bold text-blue-900 dark:text-blue-100">
                                {(selectedServiceData as any).phaseData?.process?.totalSubmissions || 0} submissions
                              </div>
                              <div className="text-blue-600 dark:text-blue-400">
                                Score: {(selectedServiceData as any).phaseData?.process?.avgScore?.toFixed(1) || 0}
                              </div>
                            </div>
                            
                            <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border text-xs">
                              <div className="font-medium text-green-700 dark:text-green-300">Deliverable Phase</div>
                              <div className="font-bold text-green-900 dark:text-green-100">
                                {(selectedServiceData as any).phaseData?.deliverable?.totalSubmissions || 0} submissions
                              </div>
                              <div className="text-green-600 dark:text-green-400">
                                Score: {(selectedServiceData as any).phaseData?.deliverable?.avgScore?.toFixed(1) || 0}
                              </div>
                            </div>
                            
                            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded border text-xs">
                              <div className="font-medium text-red-700 dark:text-red-300">Completion Dropoff</div>
                              <div className="font-bold text-red-900 dark:text-red-100">
                                {(() => {
                                  const process = (selectedServiceData as any).phaseData?.process?.totalSubmissions || 0
                                  const deliverable = (selectedServiceData as any).phaseData?.deliverable?.totalSubmissions || 0
                                  if (process === 0) return '0%'
                                  const dropoff = ((process - deliverable) / process * 100)
                                  return `${dropoff.toFixed(1)}%`
                                })()}
                              </div>
                              <div className="text-red-600 dark:text-red-400">
                                {(() => {
                                  const process = (selectedServiceData as any).phaseData?.process?.totalSubmissions || 0
                                  const deliverable = (selectedServiceData as any).phaseData?.deliverable?.totalSubmissions || 0
                                  return `${deliverable}/${process} completed`
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                      <div>
                        <div className="text-4xl mb-2">📊</div>
                        <p className="font-medium">Select a Service</p>
                        <p className="text-sm">Choose a service from the list to view detailed analysis</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

    </div>
  )
}
