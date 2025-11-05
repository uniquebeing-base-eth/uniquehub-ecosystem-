import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, TrendingUp, Star } from "lucide-react";
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
    <div className="space-y-4 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Explore Courses</h1>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-8 text-xs rounded-full bg-card border-border"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-full border border-border bg-card text-foreground text-[11px] font-medium"
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
          className="w-full px-2.5 py-1.5 rounded-full border border-border bg-card text-foreground text-[11px] font-medium"
        >
          <option value="all">All Prices</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Trending Courses */}
      {trendingCourses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Trending Courses</h2>
          </div>
          <div className="space-y-2.5">
            {trendingCourses.map((course: any, index: number) => (
              <Card 
                key={course.id} 
                className="overflow-hidden hover:shadow-glow transition-all duration-300 cursor-pointer border-border bg-card rounded-2xl group hover:scale-[1.02]"
                onClick={() => handleCourseClick(course)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-3 p-3">
                  <div className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden bg-primary/10 relative">
                    {course.thumbnail_url ? (
                      <>
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-[10px] font-semibold">View Course</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-foreground line-clamp-2 flex-1">{course.title}</h3>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border-0 flex-shrink-0">
                        {course.price_usdc === 0 ? 'FREE' : 'PAID'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2 line-clamp-1">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-1.5">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{course.enrollment_count || 0} students</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-primary">
                      {course.price_usdc === 0 ? 'Free' : `$${course.price_usdc}`}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Courses Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">All Courses</h2>
        <div className="grid grid-cols-2 gap-3">
          {filteredCourses.map((course: any, index: number) => (
            <Card 
              key={course.id} 
              className="overflow-hidden hover:shadow-glow transition-all duration-300 cursor-pointer border-border bg-card rounded-2xl hover:scale-105 group animate-fade-in"
              onClick={() => handleCourseClick(course)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-full h-32 overflow-hidden bg-primary/10 relative">
                {course.thumbnail_url ? (
                  <>
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-semibold bg-primary/80 px-3 py-1 rounded-full">View Course</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <div className="p-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border-0">
                    {categories.find(c => c.value === course.category)?.label || course.category}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 rounded-full bg-success/10 text-success border-0">
                    {course.price_usdc === 0 ? 'FREE' : 'PAID'}
                  </Badge>
                </div>
                <h3 className="text-xs font-bold text-foreground line-clamp-2 min-h-[2.25rem]">{course.title}</h3>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {course.description}
                </p>
                <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <BookOpen className="w-2.5 h-2.5" />
                    <span>{course.enrollment_count || 0}</span>
                  </div>
                </div>
                <div className="pt-1 border-t border-border">
                  <span className="font-bold text-xs text-primary">
                    {course.price_usdc === 0 ? 'Free' : `$${course.price_usdc}`}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-0" onClick={() => setShowPurchaseModal(false)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <Card className="rounded-t-3xl p-4 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">{selectedCourse.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{selectedCourse.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPurchaseModal(false)}
                  className="h-7 w-7 p-0 flex-shrink-0"
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