import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, MessageSquare, ThumbsUp, Flag, CheckCircle, User } from 'lucide-react'
import { apiEndpoints } from '@/lib/api'
import ReactECharts from 'echarts-for-react'
import { SkeletonPage } from '@/components/SkeletonLoader'

interface ServiceComment {
  id: string
  serviceId: string
  reviewId: string
  userId: string
  comment: string
  sentiment: 'positive' | 'negative' | 'neutral'
  category: string
  timestamp: string
  channelOfReview: string
  phase?: string
  userProfile: {
    age: string
    segment: string
    language: string
  }
  helpful: number
  flagged: boolean
  verified: boolean
}

interface ChannelComment {
  id: string
  channelId?: string
  boothId?: string
  ratingId: string
  userId: string
  comment: string
  sentiment: 'positive' | 'negative' | 'neutral'
  category: string
  timestamp: string
  userProfile: {
    age: string
    segment: string
    language: string
  }
  helpful: number
  flagged: boolean
  verified: boolean
}

export default function Comments() {
  const [serviceComments, setServiceComments] = useState<ServiceComment[]>([])
  const [channelComments, setChannelComments] = useState<ChannelComment[]>([])
  const [services, setServices] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [commentType, setCommentType] = useState<'all' | 'service' | 'channel'>('all')
  const [sentimentFilter, setSentimentFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [ageFilter, setAgeFilter] = useState<string>('all')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all')
  const [flaggedFilter, setFlaggedFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [serviceCommentsRes, channelCommentsRes, servicesRes, channelsRes] = await Promise.all([
          fetch(apiEndpoints.serviceComments),
          fetch(apiEndpoints.channelComments),
          fetch(apiEndpoints.services),
          fetch(apiEndpoints.channels)
        ])
        
        if (!serviceCommentsRes.ok || !channelCommentsRes.ok || !servicesRes.ok || !channelsRes.ok) {
          throw new Error('One or more API requests failed')
        }
        
        setServiceComments(await serviceCommentsRes.json())
        setChannelComments(await channelCommentsRes.json())
        setServices(await servicesRes.json())
        setChannels(await channelsRes.json())
      } catch (error) {
        console.error('Error loading comments data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Combined comments with type distinction
  const allComments = useMemo(() => {
    const serviceCommentsWithType = serviceComments.map(c => ({ ...c, type: 'service' as const }))
    const channelCommentsWithType = channelComments.map(c => ({ ...c, type: 'channel' as const }))
    return [...serviceCommentsWithType, ...channelCommentsWithType]
  }, [serviceComments, channelComments])

  // Get unique values for filter options
  const categories = useMemo(() => [...new Set(allComments.map(c => c.category))], [allComments])
  const ages = useMemo(() => [...new Set(allComments.map(c => c.userProfile.age))], [allComments])
  const segments = useMemo(() => [...new Set(allComments.map(c => c.userProfile.segment))], [allComments])

  // Filtered and sorted comments
  const filteredComments = useMemo(() => {
    let filtered = allComments

    // Type filter
    if (commentType !== 'all') {
      filtered = filtered.filter(c => c.type === commentType)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.userId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sentiment filter
    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(c => c.sentiment === sentimentFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter)
    }

    // Age filter
    if (ageFilter !== 'all') {
      filtered = filtered.filter(c => c.userProfile.age === ageFilter)
    }

    // Segment filter
    if (segmentFilter !== 'all') {
      filtered = filtered.filter(c => c.userProfile.segment === segmentFilter)
    }

    // Verified filter
    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(c => verifiedFilter === 'verified' ? c.verified : !c.verified)
    }

    // Flagged filter
    if (flaggedFilter !== 'all') {
      filtered = filtered.filter(c => flaggedFilter === 'flagged' ? c.flagged : !c.flagged)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortBy) {
        case 'timestamp':
          aVal = new Date(a.timestamp)
          bVal = new Date(b.timestamp)
          break
        case 'helpful':
          aVal = a.helpful
          bVal = b.helpful
          break
        case 'sentiment':
          aVal = a.sentiment
          bVal = b.sentiment
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [allComments, searchQuery, commentType, sentimentFilter, categoryFilter, ageFilter, segmentFilter, verifiedFilter, flaggedFilter, sortBy, sortOrder])

  // Sentiment distribution for chart
  const sentimentData = useMemo(() => {
    const sentiment = { positive: 0, negative: 0, neutral: 0 }
    filteredComments.forEach(c => sentiment[c.sentiment]++)
    
    return {
      tooltip: { trigger: 'item' },
      series: [{
        name: 'Sentiment Distribution',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: true, position: 'outside' },
        data: [
          { value: sentiment.positive, name: 'Positive', itemStyle: { color: '#10b981' } },
          { value: sentiment.negative, name: 'Negative', itemStyle: { color: '#ef4444' } },
          { value: sentiment.neutral, name: 'Neutral', itemStyle: { color: '#6b7280' } }
        ]
      }]
    }
  }, [filteredComments])

  // Category distribution for chart
  const categoryData = useMemo(() => {
    const categoryCount: Record<string, number> = {}
    filteredComments.forEach(c => {
      categoryCount[c.category] = (categoryCount[c.category] || 0) + 1
    })
    
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: Object.keys(categoryCount),
        axisLabel: { rotate: 45, fontSize: 10 }
      },
      yAxis: { type: 'value' },
      series: [{
        name: 'Comments',
        type: 'bar',
        data: Object.values(categoryCount),
        itemStyle: { color: '#3b82f6' }
      }]
    }
  }, [filteredComments])

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'negative': return 'bg-red-100 text-red-800'
      case 'neutral': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || 'Unknown Service'
  }

  const getChannelName = (channelId?: string) => {
    return channels.find(c => c.id === channelId)?.name || 'Unknown Channel'
  }

  if (loading) {
    return <SkeletonPage showKpis={true} showCharts={true} showTable={true} />
  }

  return (
    <div className="space-y-6">

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredComments.length.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Positive Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredComments.filter(c => c.sentiment === 'positive').length}
            </div>
            <div className="text-sm text-gray-500">
              {((filteredComments.filter(c => c.sentiment === 'positive').length / filteredComments.length) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Negative Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredComments.filter(c => c.sentiment === 'negative').length}
            </div>
            <div className="text-sm text-gray-500">
              {((filteredComments.filter(c => c.sentiment === 'negative').length / filteredComments.length) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Flagged Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredComments.filter(c => c.flagged).length}
            </div>
            <div className="text-sm text-gray-500">
              {((filteredComments.filter(c => c.flagged).length / filteredComments.length) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Overview of comment sentiments</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactECharts option={sentimentData} style={{ height: '300px' }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments by Category</CardTitle>
            <CardDescription>Distribution across feedback categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactECharts option={categoryData} style={{ height: '300px' }} />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search comments, categories, or user IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={commentType} onValueChange={(value: any) => setCommentType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Comment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="service">Service Comments</SelectItem>
                <SelectItem value="channel">Channel Comments</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {ages.map(age => (
                  <SelectItem key={age} value={age}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="User Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                {segments.map(segment => (
                  <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Flagged Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Comments</SelectItem>
                <SelectItem value="flagged">Flagged Only</SelectItem>
                <SelectItem value="unflagged">Not Flagged</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">Date</SelectItem>
                  <SelectItem value="helpful">Helpful Votes</SelectItem>
                  <SelectItem value="sentiment">Sentiment</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setCommentType('all')
                setSentimentFilter('all')
                setCategoryFilter('all')
                setAgeFilter('all')
                setSegmentFilter('all')
                setVerifiedFilter('all')
                setFlaggedFilter('all')
                setSortBy('timestamp')
                setSortOrder('desc')
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={20} />
            Comments ({filteredComments.length.toLocaleString()})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredComments.slice(0, 50).map((comment) => (
            <div key={comment.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getSentimentColor(comment.sentiment)}>
                    {comment.sentiment}
                  </Badge>
                  <Badge variant="secondary">{comment.category}</Badge>
                  <Badge variant="outline">
                    {comment.type === 'service' ? getServiceName(comment.serviceId) : getChannelName(comment.channelId)}
                  </Badge>
                  {comment.type === 'service' && comment.phase && (
                    <Badge variant="outline">{comment.phase}</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">{comment.timestamp}</div>
              </div>

              <p className="text-gray-900">{comment.comment}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    {comment.userId}
                  </div>
                  <div>{comment.userProfile.age} • {comment.userProfile.segment} • {comment.userProfile.language}</div>
                </div>

                <div className="flex items-center gap-3">
                  {comment.flagged && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Flag size={14} />
                      <span className="text-sm">Flagged</span>
                    </div>
                  )}
                  {comment.verified && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <CheckCircle size={14} />
                      <span className="text-sm">Verified</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-gray-500">
                    <ThumbsUp size={14} />
                    <span className="text-sm">{comment.helpful}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredComments.length > 50 && (
            <div className="text-center text-gray-500 py-4">
              Showing first 50 of {filteredComments.length.toLocaleString()} comments
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}