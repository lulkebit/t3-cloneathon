import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d'; // 7d, 30d, 90d
    const model = searchParams.get('model'); // Optional model filter

    // Calculate date range
    const now = new Date();
    const daysBack = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Base query for user's messages with quality metrics
    let query = supabase
      .from('messages')
      .select(
        `
        id,
        conversation_id,
        content,
        created_at,
        conversations (
          model
        ),
        message_quality_metrics (
          quality_score,
          coherence_score,
          relevance_score,
          completeness_score,
          clarity_score,
          response_time,
          word_count,
          sentence_count,
          readability_score,
          prompt_tokens,
          completion_tokens,
          total_tokens,
          cost,
          calculated_at
        )
      `
      )
      .eq('role', 'assistant')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    // Add model filter if specified
    if (model) {
      query = query.eq('conversations.model', model);
    }

    // Filter to user's conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id);

    if (!conversations) {
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    const conversationIds = conversations.map((c) => c.id);

    if (conversationIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalResponses: 0,
          averageQuality: 0,
          averageResponseTime: 0,
          totalCost: 0,
          qualityTrend: 0,
        },
        trends: [],
        modelComparison: [],
        qualityDistribution: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          veryPoor: 0,
        },
        insights: [],
      });
    }

    const { data: messages, error } = await query.in(
      'conversation_id',
      conversationIds
    );

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Filter messages that have quality metrics
    const messagesWithMetrics =
      messages?.filter(
        (m) => m.message_quality_metrics && m.message_quality_metrics.length > 0
      ) || [];

    if (messagesWithMetrics.length === 0) {
      return NextResponse.json({
        summary: {
          totalResponses: 0,
          averageQuality: 0,
          averageResponseTime: 0,
          totalCost: 0,
          qualityTrend: 0,
        },
        trends: [],
        modelComparison: [],
        qualityDistribution: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          veryPoor: 0,
        },
        insights: [],
      });
    }

    // Calculate summary statistics
    const totalResponses = messagesWithMetrics.length;
    const totalQuality = messagesWithMetrics.reduce(
      (sum, m) => sum + m.message_quality_metrics[0].quality_score,
      0
    );
    const averageQuality = totalQuality / totalResponses;

    const totalResponseTime = messagesWithMetrics.reduce(
      (sum, m) => sum + m.message_quality_metrics[0].response_time,
      0
    );
    const averageResponseTime = totalResponseTime / totalResponses;

    const totalCost = messagesWithMetrics.reduce(
      (sum, m) => sum + (m.message_quality_metrics[0].cost || 0),
      0
    );

    // Calculate quality trend (compare first half vs second half)
    const midpoint = Math.floor(messagesWithMetrics.length / 2);
    const firstHalf = messagesWithMetrics.slice(0, midpoint);
    const secondHalf = messagesWithMetrics.slice(midpoint);

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce(
            (sum, m) => sum + m.message_quality_metrics[0].quality_score,
            0
          ) / firstHalf.length
        : 0;
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce(
            (sum, m) => sum + m.message_quality_metrics[0].quality_score,
            0
          ) / secondHalf.length
        : 0;

    const qualityTrend = secondHalfAvg - firstHalfAvg;

    // Generate daily trends
    const trends = generateDailyTrends(messagesWithMetrics, daysBack);

    // Model comparison
    const modelComparison = generateModelComparison(messagesWithMetrics);

    // Quality distribution
    const qualityDistribution = {
      excellent: messagesWithMetrics.filter(
        (m) => m.message_quality_metrics[0].quality_score >= 85
      ).length,
      good: messagesWithMetrics.filter((m) => {
        const score = m.message_quality_metrics[0].quality_score;
        return score >= 70 && score < 85;
      }).length,
      fair: messagesWithMetrics.filter((m) => {
        const score = m.message_quality_metrics[0].quality_score;
        return score >= 55 && score < 70;
      }).length,
      poor: messagesWithMetrics.filter((m) => {
        const score = m.message_quality_metrics[0].quality_score;
        return score >= 40 && score < 55;
      }).length,
      veryPoor: messagesWithMetrics.filter(
        (m) => m.message_quality_metrics[0].quality_score < 40
      ).length,
    };

    // Generate insights
    const insights = generateInsights(
      messagesWithMetrics,
      averageQuality,
      qualityTrend
    );

    return NextResponse.json({
      summary: {
        totalResponses,
        averageQuality: Math.round(averageQuality * 10) / 10,
        averageResponseTime: Math.round(averageResponseTime),
        totalCost: Math.round(totalCost * 10000) / 10000,
        qualityTrend: Math.round(qualityTrend * 10) / 10,
      },
      trends,
      modelComparison,
      qualityDistribution,
      insights,
    });
  } catch (error) {
    console.error('Error in quality analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateDailyTrends(messages: any[], daysBack: number) {
  const trends = [];
  const now = new Date();

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    const dayMessages = messages.filter((m) => {
      const messageDate = new Date(m.created_at).toISOString().split('T')[0];
      return messageDate === dateStr;
    });

    const averageQuality =
      dayMessages.length > 0
        ? dayMessages.reduce(
            (sum, m) => sum + m.message_quality_metrics[0].quality_score,
            0
          ) / dayMessages.length
        : 0;

    const averageResponseTime =
      dayMessages.length > 0
        ? dayMessages.reduce(
            (sum, m) => sum + m.message_quality_metrics[0].response_time,
            0
          ) / dayMessages.length
        : 0;

    trends.push({
      date: dateStr,
      averageQuality: Math.round(averageQuality * 10) / 10,
      responseCount: dayMessages.length,
      averageResponseTime: Math.round(averageResponseTime),
    });
  }

  return trends;
}

function generateModelComparison(messages: any[]) {
  const modelStats: { [key: string]: any } = {};

  messages.forEach((m) => {
    const model = m.conversations?.model || 'Unknown';
    const metrics = m.message_quality_metrics[0];

    if (!modelStats[model]) {
      modelStats[model] = {
        model,
        totalResponses: 0,
        totalQuality: 0,
        totalResponseTime: 0,
        totalCost: 0,
      };
    }

    modelStats[model].totalResponses++;
    modelStats[model].totalQuality += metrics.quality_score;
    modelStats[model].totalResponseTime += metrics.response_time;
    modelStats[model].totalCost += metrics.cost || 0;
  });

  return Object.values(modelStats)
    .map((stats: any) => ({
      model: stats.model,
      averageQuality:
        Math.round((stats.totalQuality / stats.totalResponses) * 10) / 10,
      averageResponseTime: Math.round(
        stats.totalResponseTime / stats.totalResponses
      ),
      averageCost:
        Math.round((stats.totalCost / stats.totalResponses) * 10000) / 10000,
      totalResponses: stats.totalResponses,
    }))
    .sort((a, b) => b.averageQuality - a.averageQuality);
}

function generateInsights(
  messages: any[],
  averageQuality: number,
  qualityTrend: number
) {
  const insights = [];

  // Quality insights
  if (averageQuality >= 85) {
    insights.push(
      '🎉 Excellent overall response quality! Your AI responses are consistently high-quality.'
    );
  } else if (averageQuality >= 70) {
    insights.push(
      '✅ Good response quality with room for improvement in specific areas.'
    );
  } else if (averageQuality >= 55) {
    insights.push(
      '⚠️ Average response quality. Consider experimenting with different models or prompts.'
    );
  } else {
    insights.push(
      '🔧 Response quality needs attention. Try more specific prompts or different models.'
    );
  }

  // Trend insights
  if (qualityTrend > 5) {
    insights.push(
      '📈 Quality is improving over time! Your prompting skills are getting better.'
    );
  } else if (qualityTrend < -5) {
    insights.push(
      '📉 Quality has declined recently. Consider reviewing your recent prompting strategies.'
    );
  }

  // Response time insights
  const avgResponseTime =
    messages.reduce(
      (sum, m) => sum + m.message_quality_metrics[0].response_time,
      0
    ) / messages.length;

  if (avgResponseTime > 15000) {
    insights.push(
      '⏱️ Response times are slower than optimal. Consider using faster models for simple queries.'
    );
  }

  // Cost insights
  const totalCost = messages.reduce(
    (sum, m) => sum + (m.message_quality_metrics[0].cost || 0),
    0
  );

  if (totalCost > 1) {
    insights.push(
      '💰 High API costs detected. Consider using more cost-effective models for routine tasks.'
    );
  }

  return insights;
}
