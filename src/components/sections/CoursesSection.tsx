import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, TrendingUp } from "lucide-react";
import { CoursePurchase } from "@/components/CoursePurchase";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const CoursesSection = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [trendingCourses, setTrendingCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "web3-basics", label: "Web3 Basics" },
    { value: "defi", label: "DeFi" },
    { value: "nfts", label: "NFTs" },
    { value: "trading", label: "Trading" },
    { value: "development", label: "Tech & Development" },
    { value: "art", label: "Art & Design" },
    { value: "embroidery", label: "Embroidery & Crafts" },
    { value: "non-tech", label: "Non-Tech" },
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedCategory, priceFilter]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCourses(data);
      
      // Calculate trending courses based on rating and enrollment
      const trending = [...data]
        .sort((a, b) => {
          const scoreA = (a.rating || 0) * 0.5 + (a.enrollment_count || 0) * 0.5;
          const scoreB = (b.rating || 0) * 0.5 + (b.enrollment_count || 0) * 0.5;
          return scoreB - scoreA;
        })
        .slice(0, 3);
      
      setTrendingCourses(trending);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Filter by price
    if (priceFilter === "free") {
      filtered = filtered.filter(course => course.price_usdc === 0);
    } else if (priceFilter === "paid") {
      filtered = filtered.filter(course => course.price_usdc > 0);
    }

    setFilteredCourses(filtered);
  };

  const handleCourseClick = (course: any) => {
    setSelectedCourse(course);
    setShowPurchaseModal(true);
  };

  const handlePurchaseComplete = () => {
    setShowPurchaseModal(false);
    toast.success('Course access granted! You can now view the course content.');
    fetchCourses();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Explore Courses</h1>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background text-foreground"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Price Filter */}
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background text-foreground"
          >
            <option value="all">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </Card>

      {/* Trending Courses */}
      {trendingCourses.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Trending Courses</h2>
          </div>
          <div className="space-y-4">
            {trendingCourses.map((course: any) => (
              <Card 
                key={course.id} 
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleCourseClick(course)}
              >
                <div className="flex gap-4">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-lg text-primary">
                        {course.price_usdc === 0 ? 'Free' : `$${course.price_usdc} USDC`}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.value === course.category)?.label || course.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.enrollment_count || 0} enrolled
                      </span>
                    </div>
                  </div>
                  <ShareToFarcaster
                    text={`Check out "${course.title}" on UniqueHub! ${course.price_usdc === 0 ? 'Free' : `$${course.price_usdc} USDC`}`}
                    embeds={[`https://uniqueehub.vercel.app/courses/${course.id}`]}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Courses Grid */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">All Courses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCourses.map((course: any) => (
            <Card 
              key={course.id} 
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCourseClick(course)}
            >
              {course.thumbnail_url ? (
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-primary/10 rounded-lg mb-4 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground mb-2">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {course.description}
              </p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-primary">
                    {course.price_usdc === 0 ? 'Free' : `$${course.price_usdc} USDC`}
                  </span>
                  {course.price_usdc > 0 && (
                    <span className="text-xs text-muted-foreground">or equivalent in ETH</span>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {categories.find(c => c.value === course.category)?.label || course.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>{course.enrollment_count || 0} enrolled</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedCourse.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedCourse.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPurchaseModal(false)}
                >
                  ✕
                </Button>
              </div>
              <CoursePurchase 
                course={selectedCourse}
                onPurchaseComplete={handlePurchaseComplete}
              />
            </Card>
          </div>
        </div>
      )}

      {filteredCourses.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            {courses.length === 0 
              ? "No courses available yet. Check back soon!"
              : "Try adjusting your filters to find courses."
            }
          </p>
        </Card>
      )}
    </div>
  );
};