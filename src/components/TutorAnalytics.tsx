import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, TrendingUp, TrendingDown, Users, BookOpen, ChevronDown } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { cn } from "@/lib/utils";

interface TutorAnalyticsProps {
  userId: string;
}

export const TutorAnalytics = ({ userId }: TutorAnalyticsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7), // Start with 7 days for faster loading
    to: new Date(),
  });
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    percentageChange: 0,
    trend: "up" as "up" | "down" | "neutral",
  });
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      fetchAnalytics();
      setHasLoaded(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (hasLoaded) {
      fetchAnalytics();
    }
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch user's courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('user_id', userId);

      if (!courses || courses.length === 0) {
        setEnrollmentData([]);
        setStats({ totalEnrollments: 0, percentageChange: 0, trend: "neutral" });
        setLoading(false);
        return;
      }

      const courseIds = courses.map(c => c.id);

      // Fetch enrollments within date range
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('enrolled_at, course_id')
        .in('course_id', courseIds)
        .gte('enrolled_at', startOfDay(dateRange.from).toISOString())
        .lte('enrolled_at', endOfDay(dateRange.to).toISOString())
        .order('enrolled_at', { ascending: true });

      // Create date range array
      const dateArray = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to,
      });

      // Group enrollments by date
      const enrollmentsByDate = new Map<string, number>();
      enrollments?.forEach(enrollment => {
        const date = format(parseISO(enrollment.enrolled_at), 'yyyy-MM-dd');
        enrollmentsByDate.set(date, (enrollmentsByDate.get(date) || 0) + 1);
      });

      // Create chart data
      let cumulativeCount = 0;
      const chartData = dateArray.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dailyEnrollments = enrollmentsByDate.get(dateStr) || 0;
        cumulativeCount += dailyEnrollments;
        return {
          date: format(date, 'MMM dd'),
          enrollments: dailyEnrollments,
          cumulative: cumulativeCount,
        };
      });

      setEnrollmentData(chartData);

      // Calculate stats
      const totalEnrollments = enrollments?.length || 0;
      
      // Calculate previous period for comparison
      const periodDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const previousFrom = subDays(dateRange.from, periodDays);
      const previousTo = dateRange.from;

      const { data: previousEnrollments } = await supabase
        .from('enrollments')
        .select('enrolled_at')
        .in('course_id', courseIds)
        .gte('enrolled_at', startOfDay(previousFrom).toISOString())
        .lt('enrolled_at', startOfDay(previousTo).toISOString());

      const previousTotal = previousEnrollments?.length || 0;
      const percentageChange = previousTotal > 0 
        ? ((totalEnrollments - previousTotal) / previousTotal) * 100 
        : totalEnrollments > 0 ? 100 : 0;

      setStats({
        totalEnrollments,
        percentageChange: Math.round(percentageChange),
        trend: percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral",
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (range: any) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from,
      });
    }
  };

  const setPresetRange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="p-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
            <h2 className="text-lg font-bold text-foreground">Student Analytics</h2>
            <ChevronDown className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="flex items-center justify-end">
            <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <CalendarIcon className="w-3.5 h-3.5 mr-2" />
              {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 space-y-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setPresetRange(7)}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setPresetRange(30)}
              >
                Last 30 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setPresetRange(90)}
              >
                Last 90 days
              </Button>
            </div>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={1}
              className="p-3"
            />
          </PopoverContent>
            </Popover>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-primary" />
            {stats.trend === "up" && <TrendingUp className="w-4 h-4 text-success" />}
            {stats.trend === "down" && <TrendingDown className="w-4 h-4 text-destructive" />}
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.totalEnrollments}</div>
          <div className="text-xs text-muted-foreground">New Students</div>
          {stats.percentageChange !== 0 && (
            <div className={cn(
              "text-xs font-medium mt-1",
              stats.trend === "up" ? "text-success" : "text-destructive"
            )}>
              {stats.percentageChange > 0 ? "+" : ""}{stats.percentageChange}% vs previous period
            </div>
          )}
        </Card>

        <Card className="p-3">
          <BookOpen className="w-5 h-5 text-primary mb-2" />
          <div className="text-2xl font-bold text-foreground">
            {enrollmentData.length > 0 ? enrollmentData[enrollmentData.length - 1].cumulative : 0}
          </div>
          <div className="text-xs text-muted-foreground">Total Students</div>
          <div className="text-xs text-muted-foreground mt-1">Across all courses</div>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Enrollment Trends</h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading analytics...</div>
          </div>
        ) : enrollmentData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={enrollmentData}>
              <defs>
                <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="enrollments"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorEnrollments)"
                name="New Students"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-4">
            <Users className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No enrollment data for this period</p>
            <p className="text-xs text-muted-foreground mt-1">Try selecting a different date range</p>
          </div>
        )}
          </Card>

          {/* Insights */}
          {!loading && enrollmentData.length > 0 && (
            <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Quick Insights</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              • Best day: {enrollmentData.reduce((max, day) => 
                day.enrollments > max.enrollments ? day : max
              ).date} with {enrollmentData.reduce((max, day) => 
                day.enrollments > max.enrollments ? day : max
              ).enrollments} new students
            </p>
            <p>
              • Average: {(stats.totalEnrollments / enrollmentData.length).toFixed(1)} students per day
            </p>
            {stats.trend === "up" && (
              <p className="text-success">
                • Your courses are gaining traction! Keep up the great work 🚀
              </p>
            )}
            {stats.trend === "down" && (
              <p className="text-warning">
                • Consider promoting your courses or creating new content to attract more students
              </p>
            )}
              </div>
            </Card>
          )}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};