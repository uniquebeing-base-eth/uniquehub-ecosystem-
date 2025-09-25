import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, DollarSign, Filter, Search, Plus } from "lucide-react";
import { CourseCard } from "@/components/CourseCard";
import { CourseUpload } from "@/components/CourseUpload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const CoursesSection = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);

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

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    fetchCourses();
  };

  if (!user && showUploadForm) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Courses</h1>
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">Please connect your Farcaster wallet to upload courses</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Courses</h1>
        {user ? (
          <Button onClick={() => setShowUploadForm(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Upload Course
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Connect with Farcaster to upload courses</p>
            <Button variant="outline" size="sm" disabled>
              <Plus className="w-4 h-4 mr-2" />
              Upload Course
            </Button>
          </div>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <CourseUpload 
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground z-10"
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
              className="w-full p-2 rounded-md border border-input bg-background text-foreground z-10"
            >
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="p-4 hover:shadow-lg transition-shadow">
            {course.thumbnail_url && (
              <img 
                src={course.thumbnail_url} 
                alt={course.title}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-lg font-semibold text-foreground mb-2">{course.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {course.description}
            </p>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  {course.price_usdc === 0 ? 'Free' : `${course.price_usdc} USDC`}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {categories.find(c => c.value === course.category)?.label || course.category}
              </Badge>
            </div>
            <Button className="w-full" variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Enroll Now
            </Button>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No courses found</h3>
          <p className="text-muted-foreground mb-4">
            {courses.length === 0 
              ? "No courses available yet. Be the first to upload a course!"
              : "Try adjusting your filters to find courses."
            }
          </p>
          {user && courses.length === 0 && (
            <Button onClick={() => setShowUploadForm(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Upload First Course
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};